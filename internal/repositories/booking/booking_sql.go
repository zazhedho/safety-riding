package booking

import (
	"fmt"
	"workshop-management/internal/domain/booking"
	"workshop-management/internal/domain/service"
	"workshop-management/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewBookingRepo(db *gorm.DB) booking.RepoBooking {
	return &repo{DB: db}
}

func (r *repo) Create(booking booking.Booking, bookingServices []booking.BookService) error {
	tx := r.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err := tx.Omit("Services").Create(&booking).Error; err != nil {
		tx.Rollback()
		return err
	}

	if len(bookingServices) > 0 {
		if err := tx.Create(&bookingServices).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (r *repo) GetServicesByIDs(serviceIDs []string) ([]service.Service, error) {
	var services []service.Service
	if err := r.DB.Where("id IN ?", serviceIDs).Find(&services).Error; err != nil {
		return nil, err
	}
	return services, nil
}

func (r *repo) GetById(id string) (booking.Booking, error) {
	var m booking.Booking
	if err := r.DB.Preload("Services").Where("id = ?", id).First(&m).Debug().Error; err != nil {
		return booking.Booking{}, err
	}
	return m, nil
}

func (r *repo) GetByIdUserId(id, userId string) (ret booking.Booking, err error) {
	query := r.DB.Model(&booking.Booking{}).Debug()

	if id != "" {
		query = query.Where("id = ?", id)
	}
	if userId != "" {
		query = query.Where("user_id = ?", userId)
	}

	if err = r.DB.First(&ret).Error; err != nil {
		return booking.Booking{}, err
	}
	return ret, nil
}

func (r *repo) GetBookingServicesByBookingId(bookingId string) ([]booking.BookService, error) {
	var bookingServices []booking.BookService
	if err := r.DB.Where("booking_id = ?", bookingId).Find(&bookingServices).Error; err != nil {
		return nil, err
	}
	return bookingServices, nil
}

func (r *repo) Fetch(params filter.BaseParams) (bookings []booking.Booking, totalData int64, err error) {
	query := r.DB.Model(&booking.Booking{}).
		Preload("Vehicle", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "model", "license_plate")
		}).Debug()

	if len(params.Columns) > 0 {
		query = query.Select(params.Columns)
	}

	if params.Search != "" {
		query = query.Where("LOWER(notes) LIKE LOWER(?)", "%"+params.Search+"%")
	}

	// apply filters
	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch v := value.(type) {
		case string:
			if v == "" {
				continue
			}
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		}
	}

	if err = query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"booking_date": true,
			"status":       true,
			"created_at":   true,
			"updated_at":   true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.Offset(params.Offset).Limit(params.Limit).Find(&bookings).Error; err != nil {
		return nil, 0, err
	}

	return bookings, totalData, nil
}

func (r *repo) Update(m booking.Booking, data interface{}) (int64, error) {
	res := r.DB.Table(m.TableName()).Where("id = ?", m.Id).Updates(data)
	if res.Error != nil {
		return 0, nil
	}
	return res.RowsAffected, nil
}
