package repodashboard

import (
	"fmt"
	"math"
	"time"

	"safety-riding/internal/dto"
	interfacedashboard "safety-riding/internal/interfaces/dashboard"

	"gorm.io/gorm"
)

type DashboardRepo struct {
	DB *gorm.DB
}

func NewDashboardRepo(db *gorm.DB) interfacedashboard.RepoDashboardInterface {
	return &DashboardRepo{DB: db}
}

func (r *DashboardRepo) GetBasicStats() (dto.BasicStats, error) {
	// Implement existing GetBasicStats if needed
	return dto.BasicStats{}, nil
}

func (r *DashboardRepo) GetStats() (*dto.DashboardStats, error) {
	// Get first day of current and previous month
	now := time.Now()
	firstDayCurrentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	firstDayPrevMonth := firstDayCurrentMonth.AddDate(0, -1, 0)
	firstDayNextMonth := firstDayCurrentMonth.AddDate(0, 1, 0)

	// Format dates as strings (YYYY-MM-DD)
	startDate := firstDayPrevMonth.Format("2006-01-02")
	endDate := firstDayNextMonth.Format("2006-01-02")

	// Period format for POLDA (YYYY-MM)
	currentPeriod := firstDayCurrentMonth.Format("2006-01")
	prevPeriod := firstDayPrevMonth.Format("2006-01")

	// Get last 12 months for trends
	firstDay12MonthsAgo := firstDayCurrentMonth.AddDate(0, -11, 0)
	startDate12Months := firstDay12MonthsAgo.Format("2006-01-02")

	var stats dto.DashboardStats

	// Count all schools and publics (no date filter)
	if err := r.DB.Table("schools").Where("deleted_at IS NULL").Count(&stats.Schools).Error; err != nil {
		return nil, err
	}
	if err := r.DB.Table("publics").Where("deleted_at IS NULL").Count(&stats.Publics).Error; err != nil {
		return nil, err
	}

	// Count events from last 2 months (current + previous)
	if err := r.DB.Table("events").
		Where("deleted_at IS NULL AND event_date >= ? AND event_date < ?", startDate, endDate).
		Count(&stats.Events).Error; err != nil {
		return nil, err
	}

	// Count AHASS accidents from last 2 months
	if err := r.DB.Table("accidents").
		Where("deleted_at IS NULL AND accident_date >= ? AND accident_date < ?", startDate, endDate).
		Count(&stats.AhassAccidents).Error; err != nil {
		return nil, err
	}

	// Sum POLDA accidents from last 2 months
	if err := r.DB.Table("polda_accidents").
		Where("deleted_at IS NULL AND period IN (?, ?)", prevPeriod, currentPeriod).
		Select("COALESCE(SUM(total_accidents), 0)").
		Scan(&stats.PoldaAccidents).Error; err != nil {
		return nil, err
	}

	// Count budgets from last 2 months
	if err := r.DB.Table("event_budgets").
		Where("deleted_at IS NULL AND budget_date >= ? AND budget_date < ?", startDate, endDate).
		Count(&stats.Budgets).Error; err != nil {
		return nil, err
	}

	// Total accidents = AHASS + POLDA
	stats.Accidents = stats.AhassAccidents + stats.PoldaAccidents

	// ===== ADDITIONAL STATS =====
	// Total deaths and injured from AHASS accidents (last 2 months)
	type DeathsInjuredSum struct {
		TotalDeaths  int64
		TotalInjured int64
	}
	var deathsInjured DeathsInjuredSum
	if err := r.DB.Table("accidents").
		Select("COALESCE(SUM(death_count), 0) as total_deaths, COALESCE(SUM(injured_count), 0) as total_injured").
		Where("deleted_at IS NULL AND accident_date >= ? AND accident_date < ?", startDate, endDate).
		Scan(&deathsInjured).Error; err != nil {
		return nil, err
	}

	// Add POLDA deaths and injured
	var poldaDeathsInjured DeathsInjuredSum
	r.DB.Table("polda_accidents").
		Select("COALESCE(SUM(total_deaths), 0) as total_deaths, COALESCE(SUM(total_severe_injury + total_minor_injury), 0) as total_injured").
		Where("deleted_at IS NULL AND period IN (?, ?)", prevPeriod, currentPeriod).
		Scan(&poldaDeathsInjured)

	stats.AdditionalStats.TotalDeaths = deathsInjured.TotalDeaths + poldaDeathsInjured.TotalDeaths
	stats.AdditionalStats.TotalInjured = deathsInjured.TotalInjured + poldaDeathsInjured.TotalInjured

	// Average attendees per event
	type AvgAttendees struct {
		TotalAttendees int64
		EventCount     int64
	}
	var avgAtt AvgAttendees
	if err := r.DB.Table("events").
		Select("COALESCE(SUM(attendees_count), 0) as total_attendees, COUNT(*) as event_count").
		Where("deleted_at IS NULL AND event_date >= ? AND event_date < ?", startDate, endDate).
		Scan(&avgAtt).Error; err != nil {
		return nil, err
	}
	if avgAtt.EventCount > 0 {
		stats.AdditionalStats.AvgAttendeesPerEvent = avgAtt.TotalAttendees / avgAtt.EventCount
	}

	// Budget utilization rate
	type BudgetSum struct {
		TotalAllocated float64
		TotalSpent     float64
	}
	var budgetSum BudgetSum
	if err := r.DB.Table("event_budgets").
		Select("COALESCE(SUM(budget_amount), 0) as total_allocated, COALESCE(SUM(actual_spent), 0) as total_spent").
		Where("deleted_at IS NULL AND budget_date >= ? AND budget_date < ?", startDate, endDate).
		Scan(&budgetSum).Error; err != nil {
		return nil, err
	}
	if budgetSum.TotalAllocated > 0 {
		rate := (budgetSum.TotalSpent / budgetSum.TotalAllocated) * 100
		stats.AdditionalStats.BudgetUtilizationRate = math.Round(rate*100) / 100
	}

	// ===== TRAINED ENTITIES (Schools and Publics with completed events) =====
	// Count schools with completed events
	r.DB.Table("schools").
		Joins("JOIN events ON schools.id = events.school_id").
		Where("schools.deleted_at IS NULL AND events.deleted_at IS NULL AND events.status = ?", "completed").
		Distinct("schools.id").
		Count(&stats.AdditionalStats.TrainedSchools)

	// Count publics with completed events
	r.DB.Table("publics").
		Joins("JOIN events ON publics.id = events.public_id").
		Where("publics.deleted_at IS NULL AND events.deleted_at IS NULL AND events.status = ?", "completed").
		Distinct("publics.id").
		Count(&stats.AdditionalStats.TrainedPublics)

	// ===== ACCIDENT TRENDS (Last 12 months) =====
	type AccidentTrendRaw struct {
		YearMonth string
		Count     int64
		Deaths    int64
		Injured   int64
	}
	var ahassTrends []AccidentTrendRaw
	if err := r.DB.Table("accidents").
		Select("TO_CHAR(accident_date::date, 'YYYY-MM') as year_month, COUNT(*) as count, COALESCE(SUM(death_count), 0) as deaths, COALESCE(SUM(injured_count), 0) as injured").
		Where("deleted_at IS NULL AND accident_date >= ?", startDate12Months).
		Group("year_month").
		Order("year_month ASC").
		Scan(&ahassTrends).Error; err != nil {
		return nil, err
	}

	// Get POLDA trends
	var poldaTrends []AccidentTrendRaw
	r.DB.Table("polda_accidents").
		Select("period as year_month, COALESCE(SUM(total_accidents), 0) as count, COALESCE(SUM(total_deaths), 0) as deaths, COALESCE(SUM(total_severe_injury + total_minor_injury), 0) as injured").
		Where("deleted_at IS NULL AND period >= ?", firstDay12MonthsAgo.Format("2006-01")).
		Group("period").
		Order("period ASC").
		Scan(&poldaTrends)

	// Merge AHASS and POLDA trends
	trendMap := make(map[string]*dto.AccidentTrendData)
	for _, t := range ahassTrends {
		trendMap[t.YearMonth] = &dto.AccidentTrendData{
			Period:    formatPeriod(t.YearMonth),
			Accidents: t.Count,
			Deaths:    t.Deaths,
			Injured:   t.Injured,
		}
	}
	for _, t := range poldaTrends {
		if existing, ok := trendMap[t.YearMonth]; ok {
			existing.Accidents += t.Count
			existing.Deaths += t.Deaths
			existing.Injured += t.Injured
		} else {
			trendMap[t.YearMonth] = &dto.AccidentTrendData{
				Period:    formatPeriod(t.YearMonth),
				Accidents: t.Count,
				Deaths:    t.Deaths,
				Injured:   t.Injured,
			}
		}
	}

	// Convert map to slice and sort chronologically
	var periods []string
	for period := range trendMap {
		periods = append(periods, period)
	}

	// Sort periods chronologically (YYYY-MM format)
	for i := 0; i < len(periods); i++ {
		for j := i + 1; j < len(periods); j++ {
			if periods[i] > periods[j] {
				periods[i], periods[j] = periods[j], periods[i]
			}
		}
	}

	// Add trends in chronological order
	for _, period := range periods {
		if trend, exists := trendMap[period]; exists {
			stats.AccidentTrends = append(stats.AccidentTrends, *trend)
		}
	}

	// ===== EVENT DISTRIBUTION (Last 2 months) =====
	type EventDistRaw struct {
		EventType string
		Count     int64
	}
	var eventDist []EventDistRaw
	if err := r.DB.Table("events").
		Select("COALESCE(event_type, 'Unknown') as event_type, COUNT(*) as count").
		Where("deleted_at IS NULL AND event_date >= ? AND event_date < ?", startDate, endDate).
		Group("event_type").
		Scan(&eventDist).Error; err != nil {
		return nil, err
	}

	for _, e := range eventDist {
		stats.EventDistribution = append(stats.EventDistribution, dto.EventDistribution{
			EventType: e.EventType,
			Count:     e.Count,
		})
	}

	// ===== BUDGET UTILIZATION (Last 12 months) =====
	type BudgetUtilRaw struct {
		YearMonth      string
		TotalAllocated float64
		TotalSpent     float64
	}
	var budgetUtil []BudgetUtilRaw
	if err := r.DB.Table("event_budgets").
		Select("TO_CHAR(budget_date::date, 'YYYY-MM') as year_month, COALESCE(SUM(budget_amount), 0) as total_allocated, COALESCE(SUM(actual_spent), 0) as total_spent").
		Where("deleted_at IS NULL AND budget_date >= ?", startDate12Months).
		Group("year_month").
		Order("year_month ASC").
		Scan(&budgetUtil).Error; err != nil {
		return nil, err
	}

	for _, b := range budgetUtil {
		stats.BudgetUtilization = append(stats.BudgetUtilization, dto.BudgetUtilization{
			Period:    formatPeriod(b.YearMonth),
			Allocated: b.TotalAllocated,
			Spent:     b.TotalSpent,
		})
	}

	// ===== RECENT EVENTS (Last 5) =====
	type RecentEventRaw struct {
		ID         string
		Title      string
		EventType  string
		EventDate  string
		SchoolName string
		PublicName string
	}
	var recentEvents []RecentEventRaw
	if err := r.DB.Table("events").
		Select("events.id, events.title, events.event_type, events.event_date, schools.name as school_name, publics.name as public_name").
		Joins("LEFT JOIN schools ON events.school_id = schools.id").
		Joins("LEFT JOIN publics ON events.public_id = publics.id").
		Where("events.deleted_at IS NULL").
		Order("events.created_at DESC").
		Limit(5).
		Scan(&recentEvents).Error; err != nil {
		return nil, err
	}

	for _, e := range recentEvents {
		location := e.SchoolName
		if location == "" {
			location = e.PublicName
		}
		if location == "" {
			location = "-"
		}
		stats.RecentEvents = append(stats.RecentEvents, dto.RecentEvent{
			ID:        e.ID,
			Title:     e.Title,
			EventType: e.EventType,
			EventDate: e.EventDate,
			Location:  location,
		})
	}

	// ===== RECENT ACCIDENTS (Last 5) =====
	type RecentAccidentRaw struct {
		ID             string
		PoliceReportNo string
		AccidentDate   string
		Location       string
		DeathCount     int
		InjuredCount   int
	}
	var recentAccidents []RecentAccidentRaw
	if err := r.DB.Table("accidents").
		Select("id, police_report_no, accident_date, location, death_count, injured_count").
		Where("deleted_at IS NULL").
		Order("created_at DESC").
		Limit(5).
		Scan(&recentAccidents).Error; err != nil {
		return nil, err
	}

	for _, a := range recentAccidents {
		location := a.Location
		if location == "" {
			location = "-"
		}
		stats.RecentAccidents = append(stats.RecentAccidents, dto.RecentAccident{
			ID:             a.ID,
			PoliceReportNo: a.PoliceReportNo,
			AccidentDate:   a.AccidentDate,
			Location:       location,
			DeathCount:     a.DeathCount,
			InjuredCount:   a.InjuredCount,
		})
	}

	return &stats, nil
}

func (r *DashboardRepo) GetAccidentRecommendations() ([]dto.AccidentRecommendation, error) {
	// Use same date calculation as GetStats()
	now := time.Now()
	firstDayCurrentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	firstDayPrevMonth := firstDayCurrentMonth.AddDate(0, -1, 0)
	firstDayNextMonth := firstDayCurrentMonth.AddDate(0, 1, 0)

	// Format dates as strings (YYYY-MM-DD)
	startDate := firstDayPrevMonth.Format("2006-01-02")
	endDate := firstDayNextMonth.Format("2006-01-02")

	// Period format for POLDA (YYYY-MM)
	currentPeriod := firstDayCurrentMonth.Format("2006-01")
	prevPeriod := firstDayPrevMonth.Format("2006-01")

	// Disable prepared statements to avoid conflicts
	db := r.DB.Session(&gorm.Session{PrepareStmt: false})

	var recommendations []dto.AccidentRecommendation

	// Get AHASS accidents by city (aggregate from district level)
	type CityCount struct {
		CityID   string `gorm:"column:city_id"`
		CityName string `gorm:"column:city_name"`
		Count    int64  `gorm:"column:count"`
	}

	var ahassData []CityCount
	if err := db.Table("accidents").
		Select("CAST(city_id AS TEXT) as city_id, city_name, COUNT(*) as count").
		Where("deleted_at IS NULL AND accident_date >= ? AND accident_date < ?", startDate, endDate).
		Group("city_id, city_name").
		Having("COUNT(*) > 0").
		Find(&ahassData).Error; err != nil {
		return recommendations, err
	}

	// Get POLDA accidents by city
	var poldaData []CityCount
	query := fmt.Sprintf(`
		SELECT city_id, city_name, SUM(total_accidents) as count 
		FROM polda_accidents 
		WHERE deleted_at IS NULL AND period IN ('%s', '%s') 
		GROUP BY city_id, city_name 
		HAVING SUM(total_accidents) > 0
	`, prevPeriod, currentPeriod)

	if err := db.Raw(query).Scan(&poldaData).Error; err != nil {
		return recommendations, err
	}

	// Merge AHASS and POLDA data by city
	cityMap := make(map[string]struct {
		CityID     string
		CityName   string
		AhassCount int64
		PoldaCount int64
	})

	// Add AHASS data
	for _, a := range ahassData {
		cityMap[a.CityID] = struct {
			CityID     string
			CityName   string
			AhassCount int64
			PoldaCount int64
		}{a.CityID, a.CityName, a.Count, 0}
	}

	// Add POLDA data
	for _, p := range poldaData {
		if existing, exists := cityMap[p.CityID]; exists {
			existing.PoldaCount = p.Count
			cityMap[p.CityID] = existing
		} else {
			cityMap[p.CityID] = struct {
				CityID     string
				CityName   string
				AhassCount int64
				PoldaCount int64
			}{p.CityID, p.CityName, 0, p.Count}
		}
	}

	// Calculate weighted scores and create recommendations
	for _, city := range cityMap {
		if city.AhassCount > 0 || city.PoldaCount > 0 {
			score := (float64(city.PoldaCount) * 0.8) + (float64(city.AhassCount) * 0.2)
			totalCount := city.AhassCount + city.PoldaCount

			recommendations = append(recommendations, dto.AccidentRecommendation{
				CityID:       city.CityID,
				CityName:     city.CityName,
				DistrictID:   "",
				DistrictName: "",
				Score:        math.Round(score*100) / 100,
				AhassCount:   city.AhassCount,
				PoldaCount:   city.PoldaCount,
				TotalCount:   totalCount,
			})
		}
	}

	return recommendations, nil
}

// Helper function to format period from "YYYY-MM" to "Mon YYYY"
func formatPeriod(period string) string {
	t, err := time.Parse("2006-01", period)
	if err != nil {
		return period
	}
	return t.Format("Jan 2006")
}
