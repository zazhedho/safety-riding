/**
 * LocationSelector Component
 *
 * Combines Province, City, and District dropdowns with auto-cascading
 * Eliminates duplicate location selector JSX across multiple forms
 *
 * Usage:
 * <LocationSelector
 *   provinceId={formData.province_id}
 *   cityId={formData.city_id}
 *   districtId={formData.district_id}
 *   onProvinceChange={(value, name) => handleChange({ target: { name, value } })}
 *   onCityChange={(value, name) => handleChange({ target: { name, value } })}
 *   onDistrictChange={(value, name) => handleChange({ target: { name, value } })}
 *   required={true}
 * />
 */

import React from 'react';
import PropTypes from 'prop-types';
import useLocationData from '../../hooks/useLocationData';

const LocationSelector = ({
  provinceId = '',
  provinceName = 'province_id',
  cityId = '',
  cityName = 'city_id',
  districtId = '',
  districtName = 'district_id',
  onProvinceChange,
  onCityChange,
  onDistrictChange,
  required = false,
  disabled = false,
  className = '',
  showLabels = true,
  provinceLabel = 'Province',
  cityLabel = 'City',
  districtLabel = 'District'
}) => {
  const { provinces, cities, districts, loading, fetchCities, fetchDistricts } = useLocationData();

  // Handle province change
  const handleProvinceChange = (e) => {
    const value = e.target.value;
    onProvinceChange(value, provinceName);

    // Fetch cities for selected province
    if (value) {
      fetchCities(value);
    }
  };

  // Handle city change
  const handleCityChange = (e) => {
    const value = e.target.value;
    onCityChange(value, cityName);

    // Fetch districts for selected city
    if (value && provinceId) {
      fetchDistricts(provinceId, value);
    }
  };

  // Handle district change
  const handleDistrictChange = (e) => {
    const value = e.target.value;
    onDistrictChange(value, districtName);
  };

  return (
    <div className={`row ${className}`}>
      {/* Province Dropdown */}
      <div className="col-md-4 mb-3">
        {showLabels && (
          <label htmlFor={provinceName} className="form-label">
            {provinceLabel}
            {required && <span className="text-danger">*</span>}
          </label>
        )}
        <select
          id={provinceName}
          name={provinceName}
          className="form-select"
          value={provinceId}
          onChange={handleProvinceChange}
          required={required}
          disabled={disabled || loading.provinces}
        >
          <option value="">Select {provinceLabel}</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.id}>
              {province.name}
            </option>
          ))}
        </select>
        {loading.provinces && (
          <div className="form-text">
            <span className="spinner-border spinner-border-sm me-1"></span>
            Loading provinces...
          </div>
        )}
      </div>

      {/* City Dropdown */}
      <div className="col-md-4 mb-3">
        {showLabels && (
          <label htmlFor={cityName} className="form-label">
            {cityLabel}
            {required && <span className="text-danger">*</span>}
          </label>
        )}
        <select
          id={cityName}
          name={cityName}
          className="form-select"
          value={cityId}
          onChange={handleCityChange}
          required={required}
          disabled={disabled || !provinceId || loading.cities}
        >
          <option value="">Select {cityLabel}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {loading.cities && (
          <div className="form-text">
            <span className="spinner-border spinner-border-sm me-1"></span>
            Loading cities...
          </div>
        )}
      </div>

      {/* District Dropdown */}
      <div className="col-md-4 mb-3">
        {showLabels && (
          <label htmlFor={districtName} className="form-label">
            {districtLabel}
            {required && <span className="text-danger">*</span>}
          </label>
        )}
        <select
          id={districtName}
          name={districtName}
          className="form-select"
          value={districtId}
          onChange={handleDistrictChange}
          required={required}
          disabled={disabled || !cityId || loading.districts}
        >
          <option value="">Select {districtLabel}</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
        {loading.districts && (
          <div className="form-text">
            <span className="spinner-border spinner-border-sm me-1"></span>
            Loading districts...
          </div>
        )}
      </div>
    </div>
  );
};

LocationSelector.propTypes = {
  provinceId: PropTypes.string,
  provinceName: PropTypes.string,
  cityId: PropTypes.string,
  cityName: PropTypes.string,
  districtId: PropTypes.string,
  districtName: PropTypes.string,
  onProvinceChange: PropTypes.func.isRequired,
  onCityChange: PropTypes.func.isRequired,
  onDistrictChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  showLabels: PropTypes.bool,
  provinceLabel: PropTypes.string,
  cityLabel: PropTypes.string,
  districtLabel: PropTypes.string
};

export default LocationSelector;
