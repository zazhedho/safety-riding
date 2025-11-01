package media

import (
	"fmt"
	"safety-riding/pkg/logger"
	minioclient "safety-riding/pkg/minio"
	"safety-riding/utils"
	"strconv"
)

// InitMinio initializes and returns a MinIO client
func InitMinio() (*minioclient.MinioClient, error) {
	logger.WriteLog(logger.LogLevelDebug, "InitMinio; Initializing MinIO client...")

	// Parse SSL configuration
	useSSL, _ := strconv.ParseBool(utils.GetEnv("MINIO_USE_SSL", "false").(string))

	// Build MinIO configuration from environment variables
	minioConfig := minioclient.MinioConfig{
		Endpoint:        utils.GetEnv("MINIO_ENDPOINT", "localhost:9000").(string),
		AccessKeyID:     utils.GetEnv("MINIO_ACCESS_KEY", "minioadmin").(string),
		SecretAccessKey: utils.GetEnv("MINIO_SECRET_KEY", "minioadmin").(string),
		BucketName:      utils.GetEnv("MINIO_BUCKET_NAME", "safety-riding").(string),
		UseSSL:          useSSL,
		BaseURL:         utils.GetEnv("MINIO_BASE_URL", "http://localhost:9000").(string),
	}

	// Initialize MinIO client
	minioClient, err := minioclient.NewMinioClient(minioConfig)
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("InitMinio; Failed to initialize MinIO client: %s", err.Error()))
		return nil, fmt.Errorf("failed to initialize MinIO client: %w", err)
	}

	logger.WriteLog(logger.LogLevelInfo, fmt.Sprintf("InitMinio; MinIO client initialized successfully. Endpoint: %s, Bucket: %s",
		minioConfig.Endpoint, minioConfig.BucketName))

	return minioClient, nil
}
