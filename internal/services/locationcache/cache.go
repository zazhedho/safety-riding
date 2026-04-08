package locationcache

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"safety-riding/pkg/logger"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const TTL = 180 * 24 * time.Hour

func Key(entity string, parts ...string) string {
	return fmt.Sprintf("cache:location:%s:%s", entity, strings.Join(parts, ":"))
}

func Get[T any](redisClient *redis.Client, cacheKey string) ([]T, bool) {
	if redisClient == nil {
		return nil, false
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	cached, err := redisClient.Get(ctx, cacheKey).Result()
	if err != nil {
		if !errors.Is(err, redis.Nil) {
			logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("location cache get failed; key=%s; err=%v", cacheKey, err))
		}
		return nil, false
	}

	var data []T
	if err := json.Unmarshal([]byte(cached), &data); err != nil {
		logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("location cache unmarshal failed; key=%s; err=%v", cacheKey, err))
		return nil, false
	}

	return data, true
}

func Set[T any](redisClient *redis.Client, cacheKey string, data []T) {
	if redisClient == nil {
		return
	}

	payload, err := json.Marshal(data)
	if err != nil {
		logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("location cache marshal failed; key=%s; err=%v", cacheKey, err))
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := redisClient.Set(ctx, cacheKey, payload, TTL).Err(); err != nil {
		logger.WriteLog(logger.LogLevelDebug, fmt.Sprintf("location cache set failed; key=%s; err=%v", cacheKey, err))
	}
}
