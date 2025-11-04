package utils

import (
	"fmt"
	"strings"
	"time"
)

// parseEventDateTime combines event_date and end_time into a single time.Time
func ParseEventDateTime(eventDate, endTime string) (time.Time, error) {
	// eventDate format: YYYY-MM-DD
	// endTime format: HH:MM:SS or HH:MM

	// Parse date
	dateParts := strings.Split(eventDate, "-")
	if len(dateParts) != 3 {
		return time.Time{}, fmt.Errorf("invalid event_date format, expected YYYY-MM-DD")
	}

	// Parse time - handle both HH:MM:SS and HH:MM formats
	timeParts := strings.Split(endTime, ":")
	if len(timeParts) < 2 {
		return time.Time{}, fmt.Errorf("invalid end_time format, expected HH:MM or HH:MM:SS")
	}

	// Ensure we have seconds (default to 00 if not provided)
	if len(timeParts) == 2 {
		timeParts = append(timeParts, "00")
	}

	// Combine date and time into format: "2006-01-02 15:04:05"
	dateTimeStr := fmt.Sprintf("%s %s:%s:%s", eventDate, timeParts[0], timeParts[1], timeParts[2])

	// Parse the combined datetime
	layout := "2006-01-02 15:04:05"
	parsedTime, err := time.Parse(layout, dateTimeStr)
	if err != nil {
		return time.Time{}, fmt.Errorf("failed to parse event datetime: %w", err)
	}

	return parsedTime, nil
}
