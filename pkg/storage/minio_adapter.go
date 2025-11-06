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

// MinIOAdapter implements StorageProvider for MinIO
type MinIOAdapter struct {
	client     *minio.Client
	bucketName string
	baseURL    string
}

// NewMinIOAdapter creates a new MinIO storage adapter
func NewMinIOAdapter(config Config) (StorageProvider, error) {
	// Initialize MinIO client
	minioClient, err := minio.New(config.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(config.AccessKeyID, config.SecretAccessKey, ""),
		Secure: config.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	// Check if bucket exists, create if not
	ctx := context.Background()
	exists, err := minioClient.BucketExists(ctx, config.BucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to check bucket existence: %w", err)
	}

	if !exists {
		err = minioClient.MakeBucket(ctx, config.BucketName, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create bucket: %w", err)
		}

		// Set bucket policy to public read
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"AWS": ["*"]},
				"Action": ["s3:GetObject"],
				"Resource": ["arn:aws:s3:::%s/*"]
			}]
		}`, config.BucketName)

		err = minioClient.SetBucketPolicy(ctx, config.BucketName, policy)
		if err != nil {
			return nil, fmt.Errorf("failed to set bucket policy: %w", err)
		}
	}

	return &MinIOAdapter{
		client:     minioClient,
		bucketName: config.BucketName,
		baseURL:    config.BaseURL,
	}, nil
}

// UploadFile uploads a file to MinIO and returns the public URL
func (m *MinIOAdapter) UploadFile(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader, folder string) (string, error) {
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

	// Upload file
	_, err := m.client.PutObject(ctx, m.bucketName, objectName, file, fileSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Construct public URL
	fileURL := fmt.Sprintf("%s/%s/%s", m.baseURL, m.bucketName, objectName)
	return fileURL, nil
}

// UploadFileFromBytes uploads file from byte array
func (m *MinIOAdapter) UploadFileFromBytes(ctx context.Context, data []byte, filename string, folder string, contentType string) (string, error) {
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

	// Upload file
	reader := strings.NewReader(string(data))
	_, err := m.client.PutObject(ctx, m.bucketName, objectName, reader, int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Construct public URL
	fileURL := fmt.Sprintf("%s/%s/%s", m.baseURL, m.bucketName, objectName)
	return fileURL, nil
}

// DeleteFile deletes a file from MinIO
func (m *MinIOAdapter) DeleteFile(ctx context.Context, fileURL string) error {
	// Extract object name from URL
	objectName := m.extractObjectName(fileURL)
	if objectName == "" {
		return fmt.Errorf("invalid file URL")
	}

	err := m.client.RemoveObject(ctx, m.bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// GetFileURL returns the public URL for a file
func (m *MinIOAdapter) GetFileURL(objectName string) string {
	return fmt.Sprintf("%s/%s/%s", m.baseURL, m.bucketName, objectName)
}

// DownloadFile downloads a file from MinIO
func (m *MinIOAdapter) DownloadFile(ctx context.Context, objectName string) (io.ReadCloser, error) {
	object, err := m.client.GetObject(ctx, m.bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}
	return object, nil
}

// extractObjectName extracts the object name from the full URL
func (m *MinIOAdapter) extractObjectName(fileURL string) string {
	// URL format: http://minio:9000/bucket-name/folder/filename.ext
	parts := strings.Split(fileURL, "/")
	if len(parts) < 2 {
		return ""
	}

	// Find bucket name index
	bucketIndex := -1
	for i, part := range parts {
		if part == m.bucketName {
			bucketIndex = i
			break
		}
	}

	if bucketIndex == -1 || bucketIndex >= len(parts)-1 {
		return ""
	}

	// Join everything after bucket name
	return strings.Join(parts[bucketIndex+1:], "/")
}
