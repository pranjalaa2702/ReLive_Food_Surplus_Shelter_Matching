import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const useRoleBasedAPI = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Admin API calls
  const getAdminStats = async () => {
    if (user?.role !== 'admin') throw new Error('Admin access required');
    return makeAuthenticatedRequest('/api/admin/stats');
  };

  const getAdminUsers = async () => {
    if (user?.role !== 'admin') throw new Error('Admin access required');
    return makeAuthenticatedRequest('/api/admin/users');
  };

  // Donor API calls
  const getDonorDonations = async () => {
    if (user?.role !== 'donor') throw new Error('Donor access required');
    return makeAuthenticatedRequest('/api/donor/donations');
  };

  // Volunteer API calls
  const getVolunteerTasks = async () => {
    if (user?.role !== 'volunteer') throw new Error('Volunteer access required');
    return makeAuthenticatedRequest('/api/volunteer/tasks');
  };

  // Shelter API calls
  const getShelterRequests = async () => {
    if (user?.role !== 'shelter') throw new Error('Shelter access required');
    return makeAuthenticatedRequest('/api/shelter/requests');
  };

  return {
    loading,
    error,
    makeAuthenticatedRequest,
    // Admin
    getAdminStats,
    getAdminUsers,
    // Donor
    getDonorDonations,
    // Volunteer
    getVolunteerTasks,
    // Shelter
    getShelterRequests,
  };
};
