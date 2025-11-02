import { useState, useEffect } from 'react';
import permissionService from '../services/permissionService';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await permissionService.getUserPermissions();
        setPermissions(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (resource, action) => {
    return permissions.some(
      (perm) => perm.resource === resource && perm.action === action
    );
  };

  const hasAnyPermission = (checks) => {
    return checks.some(({ resource, action }) => hasPermission(resource, action));
  };

  const hasAllPermissions = (checks) => {
    return checks.every(({ resource, action }) => hasPermission(resource, action));
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
