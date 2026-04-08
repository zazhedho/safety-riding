package servicecity

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"safety-riding/internal/domain/city"
	interfacecity "safety-riding/internal/interfaces/city"
	"safety-riding/internal/services/locationcache"
	"sort"

	"github.com/redis/go-redis/v9"
)

type CityService struct {
	Redis *redis.Client
}

func NewCityService(redisClients ...*redis.Client) *CityService {
	var redisClient *redis.Client
	if len(redisClients) > 0 {
		redisClient = redisClients[0]
	}

	return &CityService{Redis: redisClient}
}

func (s *CityService) GetCity(year, lvl, pro string) ([]domaincity.City, error) {
	cacheKey := locationcache.Key("city", year, lvl, pro)
	if data, ok := locationcache.Get[domaincity.City](s.Redis, cacheKey); ok {
		return data, nil
	}

	url := fmt.Sprintf("https://sipedas.pertanian.go.id/api/wilayah/list_kab?thn=%s&lvl=%s&pro=%s", year, lvl, pro)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch city: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Parse as map[string]string
	var dataMap map[string]string
	if err := json.Unmarshal(body, &dataMap); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Convert map to slice
	cities := make([]domaincity.City, 0, len(dataMap))
	for code, name := range dataMap {
		cities = append(cities, domaincity.City{
			Code: code,
			Name: name,
		})
	}

	// Sort by name in ascending order
	sort.Slice(cities, func(i, j int) bool {
		return cities[i].Name < cities[j].Name
	})

	locationcache.Set(s.Redis, cacheKey, cities)

	return cities, nil
}

var _ interfacecity.ServiceCityInterface = (*CityService)(nil)
