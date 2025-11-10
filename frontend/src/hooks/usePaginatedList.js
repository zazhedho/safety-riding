/**
 * usePaginatedList Hook
 *
 * Eliminates ~240 lines of duplicate pagination and list fetching logic
 * across 6 files (EventList, AccidentList, SchoolList, UserList, MarketShareList, BudgetList)
 *
 * Usage:
 * const {
 *   items,
 *   loading,
 *   pagination,
 *   handlePageChange,
 *   handleLimitChange,
 *   refreshList
 * } = usePaginatedList(service.getAll, { search: '' });
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

export const usePaginatedList = (
  fetchFunction,
  initialFilters = {},
  initialLimit = 10,
  autoFetch = true
) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  // Fetch items with pagination
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...appliedFilters
      };

      const response = await fetchFunction(params);

      setItems(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_data || 0,
        totalPages: response.data.total_pages || 0
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load data');
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pagination.page, pagination.limit, appliedFilters]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchItems();
    }
  }, [fetchItems, autoFetch]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle limit change
  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply filters and reset to page 1
  const applyFilters = () => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Refresh current page
  const refreshList = () => {
    fetchItems();
  };

  // Reset pagination to page 1
  const resetPagination = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return {
    items,
    setItems,
    loading,
    pagination,
    filters,
    appliedFilters,
    handlePageChange,
    handleLimitChange,
    handleFilterChange,
    applyFilters,
    clearFilters,
    refreshList,
    resetPagination,
    fetchItems
  };
};

export default usePaginatedList;
