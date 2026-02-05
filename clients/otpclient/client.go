package otpclient

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"safety-riding/utils"
)

var ErrNotConfigured = errors.New("otp service not configured")

type Client struct {
	baseURL    string
	appName    string
	sendPath   string
	verifyPath string
	http       *http.Client
}

func NewFromEnv() (*Client, error) {
	baseURL := strings.TrimSpace(utils.GetEnv("OTP_SERVICE_URL", "").(string))
	if baseURL == "" {
		return nil, ErrNotConfigured
	}

	appName := strings.TrimSpace(utils.GetEnv("OTP_APP_NAME", "Safety Riding").(string))
	if appName == "" {
		appName = "Safety Riding"
	}

	sendPath := strings.TrimSpace(utils.GetEnv("OTP_SERVICE_SEND_PATH", "/api/auth/otp/send").(string))
	if sendPath == "" {
		sendPath = "/api/auth/otp/send"
	}
	verifyPath := strings.TrimSpace(utils.GetEnv("OTP_SERVICE_VERIFY_PATH", "/api/auth/otp/verify").(string))
	if verifyPath == "" {
		verifyPath = "/api/auth/otp/verify"
	}

	timeoutSeconds := utils.GetEnv("OTP_SERVICE_TIMEOUT_SECONDS", 5).(int)
	if timeoutSeconds <= 0 {
		timeoutSeconds = 5
	}

	return &Client{
		baseURL:    strings.TrimRight(baseURL, "/"),
		appName:    appName,
		sendPath:   ensureLeadingSlash(sendPath),
		verifyPath: ensureLeadingSlash(verifyPath),
		http: &http.Client{
			Timeout: time.Duration(timeoutSeconds) * time.Second,
		},
	}, nil
}

func (c *Client) SendRegisterOTP(ctx context.Context, email string) error {
	if c == nil {
		return ErrNotConfigured
	}

	payload := map[string]string{"email": email}
	return c.post(ctx, c.sendPath, payload)
}

func (c *Client) VerifyRegisterOTP(ctx context.Context, email, code string) error {
	if c == nil {
		return ErrNotConfigured
	}

	payload := map[string]string{"email": email, "code": code}
	return c.post(ctx, c.verifyPath, payload)
}

func (c *Client) post(ctx context.Context, path string, payload interface{}) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("encode request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-App-Name", c.appName)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		msg := readBody(resp.Body)
		if msg == "" {
			msg = resp.Status
		}
		return fmt.Errorf("otp service error: %s", msg)
	}

	return nil
}

func readBody(r io.Reader) string {
	data, err := io.ReadAll(io.LimitReader(r, 4096))
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func ensureLeadingSlash(path string) string {
	if path == "" {
		return "/"
	}
	if strings.HasPrefix(path, "/") {
		return path
	}
	return "/" + path
}
