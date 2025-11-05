package database

import (
	"context"
	"fmt"
	"safety-riding/pkg/logger"
	"safety-riding/utils"
	"time"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

// InitRedis initializes Redis client connection
func InitRedis() (*redis.Client, error) {
	host := utils.GetEnv("REDIS_HOST", "localhost").(string)
	port := utils.GetEnv("REDIS_PORT", "6379").(string)
	password := utils.GetEnv("REDIS_PASSWORD", "").(string)
	db := utils.GetEnv("REDIS_DB", 0).(int)

	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", host, port),
		Password:     password,
		DB:           db,
		DialTimeout:  10 * time.Second,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		PoolSize:     10,
		PoolTimeout:  30 * time.Second,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := client.Ping(ctx).Result()
	if err != nil {
		logger.WriteLog(logger.LogLevelError, fmt.Sprintf("Failed to connect to Redis: %v", err))
		return nil, err
	}

	logger.WriteLog(logger.LogLevelInfo, fmt.Sprintf("✓ Connected to Redis at %s:%s", host, port))
	RedisClient = client
	return client, nil
}

// CloseRedis closes the Redis connection
func CloseRedis() error {
	if RedisClient != nil {
		return RedisClient.Close()
	}
	return nil
}

// GetRedisClient returns the Redis client instance
func GetRedisClient() *redis.Client {
	return RedisClient
}
