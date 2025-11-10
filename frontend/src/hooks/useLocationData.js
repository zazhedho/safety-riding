/**
 * useLocationData Hook
 *
 * Eliminates 450 lines of duplicate location fetching logic
 * across 5 files (EventForm, AccidentForm, SchoolForm, MarketShareForm, PublicForm)
 *
 * Usage:
 * const { provinces, cities, districts, fetchCities, fetchDistricts } = useLocationData();
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import locationService from '../services/locationService';

export const useLocationData = (initialProvinceId = null, initialCityId = null) => {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState({
    provinces: false,
    cities: false,
    districts: false
  });

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Auto-fetch cities when province changes
  useEffect(() => {
    if (initialProvinceId) {
      fetchCities(initialProvinceId);
    }
  }, [initialProvinceId]);

  // Auto-fetch districts when city changes
  useEffect(() => {
    if (initialProvinceId && initialCityId) {
      fetchDistricts(initialProvinceId, initialCityId);
    }
  }, [initialCityId]);

  const fetchProvinces = async () => {
    setLoading(prev => ({ ...prev, provinces: true }));
    try {
      const response = await locationService.getProvinces();
      setProvinces(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load provinces');
      console.error('Error fetching provinces:', error);
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
    }
  };

  const fetchCities = async (provinceCode) => {
    if (!provinceCode) {
      setCities([]);
      setDistricts([]);
      return;
    }

    setLoading(prev => ({ ...prev, cities: true }));
    try {
      const response = await locationService.getCities(provinceCode);
      setCities(response.data.data || []);
      setDistricts([]); // Reset districts when province changes
    } catch (error) {
      toast.error('Failed to load cities');
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const fetchDistricts = async (provinceCode, cityCode) => {
    if (!provinceCode || !cityCode) {
      setDistricts([]);
      return;
    }

    setLoading(prev => ({ ...prev, districts: true }));
    try {
      const response = await locationService.getDistricts(provinceCode, cityCode);
      setDistricts(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load districts');
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  const resetCities = () => {
    setCities([]);
    setDistricts([]);
  };

  const resetDistricts = () => {
    setDistricts([]);
  };

  return {
    provinces,
    cities,
    districts,
    loading,
    fetchProvinces,
    fetchCities,
    fetchDistricts,
    resetCities,
    resetDistricts
  };
};

export default useLocationData;
