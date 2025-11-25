import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const api = {
  // Auth
  async loginWithEmail(email, name) {
    const response = await axiosInstance.post('/auth/email', { email, name });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data.user;
  },

  async loginWithGoogle(token) {
    const response = await axiosInstance.post('/auth/google', { token });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data.user;
  },

  async getCurrentUser() {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  async logout() {
    const response = await axiosInstance.post('/auth/logout');
    localStorage.removeItem('authToken');
    return response.data;
  },

  async checkAuthStatus() {
    const response = await axiosInstance.get('/auth/status');
    return response.data;
  },

  // Causes
  async getCauses() {
    const response = await axiosInstance.get('/causes');
    return response.data;
  },

  async getMostActiveCauses(limit = 10) {
    const response = await axiosInstance.get(`/causes/most-active?limit=${limit}`);
    return response.data;
  },

  async getCause(id) {
    const response = await axiosInstance.get(`/causes/${id}`);
    return response.data;
  },

  async createCause(data) {
    const response = await axiosInstance.post('/causes', data);
    return response.data;
  },

  async updateCause(id, data) {
    const response = await axiosInstance.put(`/causes/${id}`, data);
    return response.data;
  },

  async deleteCause(id) {
    const response = await axiosInstance.delete(`/causes/${id}`);
    return response.data;
  },

  async supportCause(id, interval = 1) {
    const response = await axiosInstance.post(`/causes/${id}/support`, { interval });
    return response.data;
  },

  async unsupportCause(id) {
    const response = await axiosInstance.post(`/causes/${id}/unsupport`);
    return response.data;
  },

  async updateStepDistribution(id, interval) {
    const response = await axiosInstance.put(`/causes/${id}/distribution`, { interval });
    return response.data;
  },

  async getCauseSupportersWithSteps(id) {
    const response = await axiosInstance.get(`/causes/${id}/supporters-with-steps`);
    return response.data;
  },

  // Steps
  async recordSteps(steps) {
    const response = await axiosInstance.post('/steps', { steps });
    return response.data;
  },

  async getStepHistory() {
    const response = await axiosInstance.get('/steps/history');
    return response.data;
  },

  async getCauseSteps(causeId) {
    const response = await axiosInstance.get(`/steps/cause/${causeId}`);
    return response.data;
  },

  async getDailySteps(date) {
    const response = await axiosInstance.get(`/steps/daily/${date}`);
    return response.data;
  },

  async getStepStats() {
    const response = await axiosInstance.get('/steps/stats');
    return response.data;
  },

  // Users
  async getUserProfile() {
    const response = await axiosInstance.get('/users/profile');
    return response.data;
  },

  async updateUserProfile(data) {
    const response = await axiosInstance.put('/users/profile', data);
    return response.data;
  },

  async getUserCauses() {
    const response = await axiosInstance.get('/users/causes');
    return response.data;
  },

  async updateAvatar(config) {
    const response = await axiosInstance.put('/users/avatar', config);
    return response.data;
  },

  // AI
  async checkSimilarCause(causeData) {
    const response = await axiosInstance.post('/ai/check-similar-cause', causeData);
    return response.data;
  },

  async getAIStatus() {
    const response = await axiosInstance.get('/ai/status');
    return response.data;
  }
};

export default api;
