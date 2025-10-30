package servicecity

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"safety-riding/internal/domain/city"
	"sort"
)

type CityService struct{}

func NewCityService() *CityService {
	return &CityService{}
}

func (s *CityService) GetCity(year, lvl, pro string) ([]domaincity.City, error) {
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

	return cities, nil
}
