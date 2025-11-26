import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import userService from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/user');
      setUser(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only logout if it's an auth error (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      } else {
        // For other errors, just set loading to false without logging out
        setLoading(false);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/user/login', { email, password });
      const { token } = response.data.data;

      localStorage.setItem('token', token);
      setToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const user = await fetchUser();
      return { success: true, user };
    } catch (error) {
      let errorMessage = 'Login failed';
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.error) && error.response.data.error.length > 0) {
          errorMessage = error.response.data.error.map(err => err.message).join(', ');
        }
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/user/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      let errorMessage = 'Registration failed';
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.error) && error.response.data.error.length > 0) {
          errorMessage = error.response.data.error.map(err => err.message).join(', ');
        }
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/user/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/user', userData);
      setUser(response.data.data);
      return { success: true, data: response.data };
    } catch (error) {
      let errorMessage = 'Update failed';
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.error) && error.response.data.error.length > 0) {
          errorMessage = error.response.data.error.map(err => err.message).join(', ');
        }
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const updatePassword = async (passwordData) => {
    try {
      const formattedPasswordData = {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      };
      await userService.updatePassword(formattedPasswordData);
      await logout(); // Ensure logout completes before returning success
      return { success: true };
    } catch (error) {
      let errorMessage = 'Password update failed';
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.error) && error.response.data.error.length > 0) {
          errorMessage = error.response.data.error.map(err => err.message).join(', ');
        }
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/user/forgot-password', { email });
      return { success: true, data: response.data };
    } catch (error) {
      let errorMessage = 'Failed to send reset email';
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.error) && error.response.data.error.length > 0) {
          errorMessage = error.response.data.error.map(err => err.message).join(', ');
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await api.post('/user/reset-password', { token, new_password: newPassword });
      return { success: true, data: response.data };
    } catch (error) {
      let errorMessage = 'Failed to reset password';
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.error) && error.response.data.error.length > 0) {
          errorMessage = error.response.data.error.map(err => err.message).join(', ');
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  const deleteUser = async () => {
    try {
      await api.delete('/user');
      await logout();
      return { success: true };
    } catch (error) {
      let errorMessage = 'Failed to delete account';
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.error) && error.response.data.error.length > 0) {
          errorMessage = error.response.data.error.map(err => err.message).join(', ');
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    forgotPassword,
    resetPassword,
    deleteUser,
    hasRole,
    hasPermission,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};