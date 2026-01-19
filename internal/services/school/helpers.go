package serviceschool

// calculatePriorityScore calculates the priority score based on multiple factors
func calculatePriorityScore(marketShare, threshold float64, totalStudents, accidentSeverity, totalAccidents int) int {
	var score float64 = 0

	// Factor 1: Market Share (40 points max)
	// Below 87% = high priority, the lower the share, the higher the score
	if marketShare < threshold {
		// Scale: 0% market share = 40 points, 87% = 0 points
		marketFactor := ((threshold - marketShare) / threshold) * 40
		score += marketFactor
	}

	// Factor 2: Student Population (30 points max)
	// More students = higher priority for education impact
	// Assuming max ~10000 students per district for scaling
	studentFactor := float64(totalStudents) / 10000.0 * 30
	if studentFactor > 30 {
		studentFactor = 30
	}
	score += studentFactor

	// Factor 3: Accident Severity (30 points max)
	// Higher severity = higher priority
	// Assuming max severity score of 100 for scaling
	accidentFactor := float64(accidentSeverity) / 100.0 * 30
	if accidentFactor > 30 {
		accidentFactor = 30
	}
	score += accidentFactor

	// Round to nearest integer
	finalScore := int(score + 0.5)
	if finalScore > 100 {
		finalScore = 100
	}
	if finalScore < 0 {
		finalScore = 0
	}

	return finalScore
}

// getPriorityLevel returns the priority level based on score
func getPriorityLevel(score int) string {
	switch {
	case score >= 75:
		return "Critical"
	case score >= 50:
		return "High"
	case score >= 25:
		return "Medium"
	default:
		return "Low"
	}
}
