package serviceprovince

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"safety-riding/internal/domain/province"
	"sort"
)

type ProvinceService struct{}

func NewProvinceService() *ProvinceService {
	return &ProvinceService{}
}

func (s *ProvinceService) GetProvince(year string) ([]domainprovince.Province, error) {
	url := fmt.Sprintf("https://sipedas.pertanian.go.id/api/wilayah/list_pro?thn=%s", year)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch province: %w", err)
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
	provinces := make([]domainprovince.Province, 0, len(dataMap))
	for code, name := range dataMap {
		provinces = append(provinces, domainprovince.Province{
			Code: code,
			Name: name,
		})
	}

	// Sort by name in ascending order
	sort.Slice(provinces, func(i, j int) bool {
		return provinces[i].Name < provinces[j].Name
	})

	return provinces, nil
}
