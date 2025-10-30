package utils

import "time"

func UpdateStatus(userId, status string) map[string]interface{} {
	return map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
		"updated_by": userId,
	}
}
