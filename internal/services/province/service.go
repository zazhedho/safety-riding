package serviceprovince

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"safety-riding/internal/domain/province"
	interfaceprovince "safety-riding/internal/interfaces/province"
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
	provinces := make([]domainprovince.Province, 0, len(dataMap))
	if err := json.Unmarshal(body, &dataMap); err != nil {
		provinces = append(provinces, domainprovince.Province{
			Code: "52",
			Name: "NUSA TENGGARA BARAT",
		})
	}

	// Convert map to slice
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

var _ interfaceprovince.ServiceProvinceInterface = (*ProvinceService)(nil)
