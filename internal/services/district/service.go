package servicedistrict

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"safety-riding/internal/domain/district"
	"sort"
)

type DistrictService struct{}

func NewKecamatanService() *DistrictService {
	return &DistrictService{}
}

func (s *DistrictService) GetDistrict(year, lvl, pro, kab string) ([]domaindistrict.District, error) {
	url := fmt.Sprintf("https://sipedas.pertanian.go.id/api/wilayah/list_kec?thn=%s&lvl=%s&pro=%s&kab=%s", year, lvl, pro, kab)

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch district: %w", err)
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
	districts := make([]domaindistrict.District, 0, len(dataMap))
	for code, name := range dataMap {
		districts = append(districts, domaindistrict.District{
			Code: code,
			Name: name,
		})
	}

	// Sort by name in ascending order
	sort.Slice(districts, func(i, j int) bool {
		return districts[i].Name < districts[j].Name
	})

	return districts, nil
}
