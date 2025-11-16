import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Readings API
export const readingsAPI = {
  create: (data) => client.post('/readings', data),
  getAll: () => client.get('/readings'),
  getById: (id) => client.get(`/readings/${id}`),
  getLatest: () => client.get('/readings/latest'),
  update: (id, data) => client.put(`/readings/${id}`, data),
  delete: (id) => client.delete(`/readings/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDaily: (days = 30) => client.get(`/analytics/daily?days=${days}`),
  getWeekly: (weeks = 12) => client.get(`/analytics/weekly?weeks=${weeks}`),
  getMonthly: (months = 12) => client.get(`/analytics/monthly?months=${months}`),
  getPrediction: () => client.get('/analytics/prediction'),
};

export default client;

