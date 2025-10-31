package utils

import (
	"regexp"
	"strings"
)

var nonDigitRemover = regexp.MustCompile(`\D+`)

var prefixZero = regexp.MustCompile(`^0`)
var prefixPlus62 = regexp.MustCompile(`^\+62`)

func NormalizePhoneTo62(phoneInput string) string {

	var prefix string
	var numberToClean string

	if strings.HasPrefix(phoneInput, "+") {
		prefix = "+"
		numberToClean = phoneInput[1:]
	} else {
		prefix = ""
		numberToClean = phoneInput
	}

	sanitizedDigits := nonDigitRemover.ReplaceAllString(numberToClean, "")
	sanitized := prefix + sanitizedDigits

	var normalized string
	normalized = prefixZero.ReplaceAllString(sanitized, "62")
	normalized = prefixPlus62.ReplaceAllString(normalized, "62")

	return normalized
}
