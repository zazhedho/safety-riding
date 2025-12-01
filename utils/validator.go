package utils

import (
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"regexp"
	"safety-riding/pkg/response"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

func init() {
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		v.RegisterValidation("lowercase_nospace", validateLowercaseNoSpace)
	}
}

// validateLowercaseNoSpace validates that a string is lowercase and has no spaces
func validateLowercaseNoSpace(fl validator.FieldLevel) bool {
	value := fl.Field().String()
	if value == "" {
		return true
	}
	// Check: lowercase only and no spaces
	matched, _ := regexp.MatchString(`^[a-z0-9_-]+$`, value)
	return matched
}

type ValidateMessage struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func mapValidateMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "This field is required"
	case "email":
		return "Invalid email"
	case "alphanum":
		return "Should be alphanumeric"
	case "min":
		return "Minimum " + fe.Param()
	case "max":
		return "Maximum " + fe.Param()
	case "lte":
		return "Should be less than " + fe.Param()
	case "gte":
		return "Should be greater than " + fe.Param()
	case "ltefield":
		return "Should be less than " + fe.Param()
	case "gtefield":
		return "Should be greater than " + fe.Param()
	case "lowercase_nospace":
		return "Must be lowercase with no spaces (only a-z, 0-9, underscore, and hyphen allowed)"
	}

	return "Invalid value"
}

func ValidateError(err error, reflectType reflect.Type, tagName string) []ValidateMessage {
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		out := make([]ValidateMessage, len(ve))
		for i, fe := range ve {
			field := fe.Field()
			if structField, ok := reflectType.FieldByName(fe.Field()); ok {
				field = structField.Tag.Get(tagName)
			}
			out[i] = ValidateMessage{field, mapValidateMessage(fe)}
		}
		return out
	}
	return []ValidateMessage{{"", err.Error()}}
}

func ValidateUUID(ctx *gin.Context, logID uuid.UUID) (string, error) {
	id := ctx.Param("id")
	if id == "" {
		res := response.Response(http.StatusBadRequest, http.StatusText(http.StatusBadRequest), logID, nil)
		res.Error = "ID parameter is required"
		ctx.JSON(http.StatusBadRequest, res)
		return "", fmt.Errorf("missing ID")
	}

	if _, err := uuid.Parse(id); err != nil {
		res := response.Response(http.StatusBadRequest, http.StatusText(http.StatusBadRequest), logID, nil)
		res.Error = response.Errors{Code: http.StatusBadRequest, Message: "ID must be a valid UUID"}
		ctx.JSON(http.StatusBadRequest, res)
		return "", fmt.Errorf("invalid UUID")
	}

	return id, nil
}

func ValidateNonNegative(value interface{}, fieldName string) error {
	v := reflect.ValueOf(value)
	switch v.Kind() {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if v.Int() < 0 {
			return fmt.Errorf("%s cannot be negative", fieldName)
		}
	case reflect.Float32, reflect.Float64:
		if v.Float() < 0 {
			return fmt.Errorf("%s cannot be negative", fieldName)
		}
	default:
		return errors.New("ValidateNonNegative only supports numeric types")
	}
	return nil
}

func ValidateNonNegativeBatch(fields map[string]interface{}) error {
	if len(fields) == 0 {
		return nil
	}
	var msgs []string
	for field, v := range fields {
		if neg, ok := isNegative(v); !ok {
			msgs = append(msgs, fmt.Sprintf("%s has unsupported type", field))
		} else if neg {
			msgs = append(msgs, fmt.Sprintf("%s cannot be negative", field))
		}
	}
	if len(msgs) > 0 {
		return errors.New(strings.Join(msgs, "; "))
	}
	return nil
}

func isNegative(v interface{}) (neg bool, supported bool) {
	if v == nil {
		return false, true
	}
	val := reflect.ValueOf(v)
	switch val.Kind() {
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return val.Int() < 0, true
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64, reflect.Uintptr:
		return false, true // unsigned tidak bisa negatif
	case reflect.Float32, reflect.Float64:
		return val.Float() < 0, true
	default:
		return false, false
	}
}
