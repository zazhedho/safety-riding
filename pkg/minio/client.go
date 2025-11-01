package minio

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

type MinioClient struct {
	client     *minio.Client
	bucketName string
	baseURL    string
}

type MinioConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	UseSSL          bool
	BaseURL         string // Public URL to access files
}

// NewMinioClient creates a new MinIO client
func NewMinioClient(config MinioConfig) (*MinioClient, error) {
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

	return &MinioClient{
		client:     minioClient,
		bucketName: config.BucketName,
		baseURL:    config.BaseURL,
	}, nil
}

// UploadFile uploads a file to MinIO and returns the public URL
func (mc *MinioClient) UploadFile(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader, folder string) (string, error) {
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
	_, err := mc.client.PutObject(ctx, mc.bucketName, objectName, file, fileSize, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Construct public URL
	fileURL := fmt.Sprintf("%s/%s/%s", mc.baseURL, mc.bucketName, objectName)
	return fileURL, nil
}

// UploadFileFromBytes uploads file from byte array
func (mc *MinioClient) UploadFileFromBytes(ctx context.Context, data []byte, filename string, folder string, contentType string) (string, error) {
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
	_, err := mc.client.PutObject(ctx, mc.bucketName, objectName, reader, int64(len(data)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Construct public URL
	fileURL := fmt.Sprintf("%s/%s/%s", mc.baseURL, mc.bucketName, objectName)
	return fileURL, nil
}

// DeleteFile deletes a file from MinIO
func (mc *MinioClient) DeleteFile(ctx context.Context, fileURL string) error {
	// Extract object name from URL
	objectName := mc.extractObjectName(fileURL)
	if objectName == "" {
		return fmt.Errorf("invalid file URL")
	}

	err := mc.client.RemoveObject(ctx, mc.bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// extractObjectName extracts the object name from the full URL
func (mc *MinioClient) extractObjectName(fileURL string) string {
	// URL format: http://minio:9000/bucket-name/folder/filename.ext
	parts := strings.Split(fileURL, "/")
	if len(parts) < 2 {
		return ""
	}

	// Find bucket name index
	bucketIndex := -1
	for i, part := range parts {
		if part == mc.bucketName {
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

// GetFileURL returns the public URL for a file
func (mc *MinioClient) GetFileURL(objectName string) string {
	return fmt.Sprintf("%s/%s/%s", mc.baseURL, mc.bucketName, objectName)
}

// DownloadFile downloads a file from MinIO
func (mc *MinioClient) DownloadFile(ctx context.Context, objectName string) (io.ReadCloser, error) {
	object, err := mc.client.GetObject(ctx, mc.bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}
	return object, nil
}
