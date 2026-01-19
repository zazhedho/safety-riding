package utils

import (
	"encoding/json"
	"fmt"
	"strings"
)

func InterfaceString(data interface{}) string {
	if data == nil {
		return ""
	}
	switch v := data.(type) {
	case string:
		return v
	case []byte:
		return string(v)
	default:
		bytes, _ := json.Marshal(data)
		return string(bytes)
	}
}

// InterfaceStringStrict safely extracts string from interface, returns empty string if not a string type
func InterfaceStringStrict(val interface{}) string {
	if val == nil {
		return ""
	}
	if str, ok := val.(string); ok {
		return str
	}
	return ""
}

// InterfaceInt safely extracts int from interface, returns 0 if not a numeric type
func InterfaceInt(val interface{}) int {
	if val == nil {
		return 0
	}
	switch v := val.(type) {
	case int:
		return v
	case int32:
		return int(v)
	case int64:
		return int(v)
	case float64:
		return int(v)
	case float32:
		return int(v)
	}
	return 0
}

// InterfaceFloat64 safely extracts float64 from interface, returns 0 if not a numeric type
func InterfaceFloat64(val interface{}) float64 {
	if val == nil {
		return 0
	}
	switch v := val.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int64:
		return float64(v)
	case int32:
		return float64(v)
	}
	return 0
}

func ConvertValuesToString(filters map[string]interface{}, keys ...string) map[string]interface{} {
	if filters == nil {
		return nil
	}
	target := map[string]struct{}{}
	for _, k := range keys {
		target[k] = struct{}{}
	}

	out := make(map[string]interface{}, len(filters))
	for k, v := range filters {
		if len(target) == 0 {
			out[k] = toString(v)
			continue
		}
		if _, ok := target[k]; ok {
			out[k] = toString(v)
		} else {
			out[k] = v
		}
	}
	return out
}

func toString(v interface{}) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return t
	case fmt.Stringer:
		return t.String()
	case []string:
		return strings.Join(t, ",")
	case []interface{}:
		b, _ := json.Marshal(t) // fallback aman
		return string(b)
	default:
		return fmt.Sprintf("%v", v)
	}
}
