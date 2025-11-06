package storage

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// R2Adapter implements StorageProvider for Cloudflare R2
type R2Adapter struct {
	client     *minio.Client
	bucketName string
	baseURL    string
	accountID  string
}

// NewR2Adapter creates a new Cloudflare R2 storage adapter
func NewR2Adapter(config Config) (StorageProvider, error) {
	// R2 endpoint format: <account_id>.r2.cloudflarestorage.com (without https://)
	endpoint := config.Endpoint

	// Strip protocol if present
	endpoint = strings.TrimPrefix(endpoint, "https://")
	endpoint = strings.TrimPrefix(endpoint, "http://")

	// Build endpoint from account ID if not fully specified
	if config.AccountID != "" && !strings.Contains(endpoint, ".r2.cloudflarestorage.com") {
		endpoint = fmt.Sprintf("%s.r2.cloudflarestorage.com", config.AccountID)
	}

	// Initialize MinIO client (R2 is S3-compatible)
	// Note: R2 doesn't use regions like AWS S3, so we omit the Region option
	r2Client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(config.AccessKeyID, config.SecretAccessKey, ""),
		Secure: config.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create R2 client: %w", err)
	}

	// Note: R2 buckets must be created manually via Cloudflare Dashboard
	// We skip the BucketExists check because:
	// 1. R2 doesn't support bucket creation via S3 API
	// 2. BucketExists can cause 301 redirect issues with R2
	// 3. The bucket should already exist (prerequisite)

	// Set BaseURL for public access
	// R2 public URL format: https://pub-<hash>.r2.dev or custom domain
	baseURL := config.BaseURL
	if baseURL == "" {
		// Default to R2 dev subdomain if not specified
		baseURL = fmt.Sprintf("https://%s.r2.dev", config.BucketName)
	}

	return &R2Adapter{
		client:     r2Client,
		bucketName: config.BucketName,
		baseURL:    baseURL,
		accountID:  config.AccountID,
	}, nil
}

// UploadFile uploads a file to R2 and returns the public URL
func (r *R2Adapter) UploadFile(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader, folder string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(fileHeader.Filename)
	filename := fmt.Sprintf("%s_%s%s", time.Now().Format("20060102_150405"), uuid.New().String()[:8], ext)

	// Create object path with folder
	objectName := filename
	if folder != "" {
		objectName = fmt.Sprintf("%s/%s", strings.Trim(folder, "/"), filename)
	}

	// Get file size
	fileSize := fileHeader.Size

	// Detect content type
	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Upload file to R2
	_, err := r.client.PutObject(ctx, r.bucketName, objectName, file, fileSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to R2: %w", err)
	}

	// Construct public URL
	// R2 public URL format: https://pub-<hash>.r2.dev/objectName or https://custom-domain/objectName
	fileURL := fmt.Sprintf("%s/%s", strings.TrimRight(r.baseURL, "/"), objectName)
	return fileURL, nil
}

// UploadFileFromBytes uploads file from byte array to R2
func (r *R2Adapter) UploadFileFromBytes(ctx context.Context, data []byte, filename string, folder string, contentType string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(filename)
	uniqueFilename := fmt.Sprintf("%s_%s%s", time.Now().Format("20060102_150405"), uuid.New().String()[:8], ext)

	// Create object path with folder
	objectName := uniqueFilename
	if folder != "" {
		objectName = fmt.Sprintf("%s/%s", strings.Trim(folder, "/"), uniqueFilename)
	}

	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// Upload file to R2
	reader := strings.NewReader(string(data))
	_, err := r.client.PutObject(ctx, r.bucketName, objectName, reader, int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file to R2: %w", err)
	}

	// Construct public URL
	fileURL := fmt.Sprintf("%s/%s", strings.TrimRight(r.baseURL, "/"), objectName)
	return fileURL, nil
}

// DeleteFile deletes a file from R2
func (r *R2Adapter) DeleteFile(ctx context.Context, fileURL string) error {
	// Extract object name from URL
	objectName := r.extractObjectName(fileURL)
	if objectName == "" {
		return fmt.Errorf("invalid file URL")
	}

	err := r.client.RemoveObject(ctx, r.bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete file from R2: %w", err)
	}

	return nil
}

// GetFileURL returns the public URL for a file
func (r *R2Adapter) GetFileURL(objectName string) string {
	return fmt.Sprintf("%s/%s", strings.TrimRight(r.baseURL, "/"), objectName)
}

// DownloadFile downloads a file from R2
func (r *R2Adapter) DownloadFile(ctx context.Context, objectName string) (io.ReadCloser, error) {
	object, err := r.client.GetObject(ctx, r.bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to download file from R2: %w", err)
	}
	return object, nil
}

// extractObjectName extracts the object name from the full URL
func (r *R2Adapter) extractObjectName(fileURL string) string {
	// R2 URL formats:
	// 1. https://pub-<hash>.r2.dev/folder/filename.ext
	// 2. https://custom-domain.com/folder/filename.ext

	// Remove the base URL to get the object name
	objectName := strings.TrimPrefix(fileURL, r.baseURL)
	objectName = strings.TrimPrefix(objectName, "/")

	if objectName == "" || objectName == fileURL {
		// Fallback: try to extract from URL path
		parts := strings.Split(fileURL, "/")
		if len(parts) >= 4 { // https://domain.com/object
			objectName = strings.Join(parts[3:], "/")
		}
	}

	return objectName
}
