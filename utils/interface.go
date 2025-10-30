package utils

import "encoding/json"

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
