import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getAllClaims = async (page = 1, limit = 20, sortBy = 'timestamp', order = 'desc') => {
  try {
    const response = await api.get('/claims', {
      params: { page, limit, sortBy, order }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching claims:', error);
    throw error;
  }
};

export const searchClaims = async (query, page = 1, limit = 20) => {
  try {
    const response = await api.get('/claims/search', {
      params: { q: query, page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching claims:', error);
    throw error;
  }
};

export const getClaimsByCategory = async (category, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/claims/category/${category}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching claims by category:', error);
    throw error;
  }
};

export const getClaimsByVerification = async (verified, page = 1, limit = 20) => {
  try {
    const response = await api.get(`/claims/verified/${verified}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching claims by verification:', error);
    throw error;
  }
};

export const getStats = async () => {
  try {
    const response = await api.get('/claims/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export const getClaimById = async (id) => {
  try {
    const response = await api.get(`/claims/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching claim:', error);
    throw error;
  }
};

export const submitClaim = async (claimData) => {
  try {
    const response = await api.post('/claims/submit', claimData);
    return response.data;
  } catch (error) {
    console.error('Error submitting claim:', error);
    throw error;
  }
};

export default api;