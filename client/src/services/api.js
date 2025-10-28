import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Company Services
export const companyAPI = {
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Vehicle Services
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  getByCompany: (companyId) => api.get(`/vehicles/company/${companyId}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

// Driver Services
export const driverAPI = {
  getAll: () => api.get('/drivers'),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
};

// Load Services
export const loadAPI = {
  getAll: () => api.get('/loads'),
  getById: (id) => api.get(`/loads/${id}`),
  create: (data) => api.post('/loads', data),
  update: (id, data) => api.put(`/loads/${id}`, data),
  assignDriver: (id, data) => api.put(`/loads/${id}/assign-driver`, data),
  delete: (id) => api.delete(`/loads/${id}`),
};

// Payment Services
export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Report Services
export const reportAPI = {
  getBalanceReport: () => api.get('/reports/balance'),
  getPaymentHistory: () => api.get('/reports/payment-history'),
  getVehicleUtilization: () => api.get('/reports/vehicle-utilization'),
  getDriverPerformance: () => api.get('/reports/driver-performance'),
};

export default api;
