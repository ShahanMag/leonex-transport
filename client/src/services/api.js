import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally → clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==========================
// 🏢 Company Services
// ==========================
export const companyAPI = {
  getAll: () => api.get('/companies'),
  getById: (id) => api.get(`/companies/${id}`),
  search: (query) => api.get('/companies/search', { params: { query } }),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// ==========================
// 🚚 Vehicle Services
// ==========================
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  getByCompany: (companyId) => api.get(`/vehicles/company/${companyId}`),
  search: (query) => api.get('/vehicles/search', { params: { query } }),
  filter: (startDate, endDate) => api.get('/vehicles/filter', { params: { startDate, endDate } }),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

// ==========================
// 👷 Driver Services
// ==========================
export const driverAPI = {
  getAll: () => api.get('/drivers'),
  getById: (id) => api.get(`/drivers/${id}`),
  search: (query) => api.get('/drivers/search', { params: { query } }),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  delete: (id) => api.delete(`/drivers/${id}`),
};

// ==========================
// 📦 Load Services
// ==========================
export const loadAPI = {
  getAll: () => api.get('/loads'),
  getById: (id) => api.get(`/loads/${id}`),
  search: (query) => api.get('/loads/search', { params: { query } }),
  filter: (vehicle_type) => api.get('/loads/filter', { params: { vehicle_type } }),
  create: (data) => api.post('/loads', data),
  update: (id, data) => api.put(`/loads/${id}`, data),
  assignDriver: (id, data) => api.put(`/loads/${id}/assign-driver`, data),
  completeLoad: (id) => api.put(`/loads/${id}/complete`, { status: 'completed' }),
  delete: (id) => api.delete(`/loads/${id}`),
};

// ==========================
// 💰 Payment Services
// ==========================
export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  search: (query) => api.get('/payments/search', { params: { query } }),
  filterByStatus: (status) => api.get('/payments/filter', { params: { status } }),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  registerInstallment: (id, data) => api.post(`/payments/${id}/installments`, data),
  updateInstallment: (paymentId, installmentId, data) => api.put(`/payments/${paymentId}/installments/${installmentId}`, data),
  deleteInstallment: (paymentId, installmentId) => api.delete(`/payments/${paymentId}/installments/${installmentId}`),
  delete: (id) => api.delete(`/payments/${id}`),
};

// ==========================
// 📊 Report Services
// ==========================
export const reportAPI = {
  // --- 📄 JSON Reports ---
  // These endpoints return JSON data to display in tables
  getCompanyPayments: () => api.get('/reports/company-payments'),
  getRentalPayments: () => api.get('/reports/rental-payments'),
  getCombinedReport: () => api.get('/reports/combined-report'),
  getProfitLoss: () => api.get('/reports/profit-loss'),
  getVehicleUtilization: () => api.get('/reports/vehicle-utilization'),
  getDriverPerformance: () => api.get('/reports/driver-performance'),

  // --- 📥 Excel Download Reports ---
  // These endpoints return Excel files (blob)
  downloadCompanies: () => api.get('/reports/companies', { responseType: 'blob' }),
  downloadDrivers: () => api.get('/reports/drivers', { responseType: 'blob' }),
  downloadVehicles: () => api.get('/reports/vehicles', { responseType: 'blob' }),
  downloadLoads: () => api.get('/reports/loads', { responseType: 'blob' }),

  // --- 💰 Split Payment Reports (Excel) ---
  downloadCompanyPayments: () => api.get('/reports/payments/company', { responseType: 'blob' }),
  downloadRentalPayments: () => api.get('/reports/payments/rental', { responseType: 'blob' }),
  downloadCombinedReport: () => api.get('/reports/combined-report/excel', { responseType: 'blob' }),
  downloadProfitLoss: () => api.get('/reports/profit-loss/excel', { responseType: 'blob' }),

  // Bills (Income & Expense)
  getBillsReport: (params) => api.get('/reports/bills', { params }),
  downloadBillsReport: () => api.get('/reports/bills/excel', { responseType: 'blob' }),
};



// ==========================
// 🔄 Transaction Services
// ==========================
export const transactionAPI = {
  createRentalTransaction: (data) => api.post('/transactions/rental', data),
  bulkCreate: (rows) => api.post('/transactions/rental/bulk', { rows }),

  // ✅ Fetch all rental transactions
  getAll: () => api.get('/loads'),

  // ✅ Fetch a single rental transaction by ID
  getById: (id) => api.get(`/transactions/rental/${id}`),

  // ✅ Update a rental transaction
  update: (id, data) => api.put(`/transactions/rental/${id}`, data),
};

// ==========================
// 📊 Dashboard Services
// ==========================
export const dashboardAPI = {
  getMonthlyRentalAnalytics: (year) => api.get('/dashboard/monthly-rental-analytics', { params: { year } }),
};

// ==========================
// 👥 User Services
// ==========================
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  login: (data) => api.post('/users/login', data),
};

// ==========================
// 🚗 Vehicle Type Services
// ==========================
export const vehicleTypeAPI = {
  getAll: () => api.get('/vehicle-types'),
  getById: (id) => api.get(`/vehicle-types/${id}`),
  create: (data) => api.post('/vehicle-types', data),
  update: (id, data) => api.put(`/vehicle-types/${id}`, data),
  delete: (id) => api.delete(`/vehicle-types/${id}`),
};

// ==========================
// 💵 Bill (Income/Expense) Services
// ==========================
export const billAPI = {
  getAll: (type) => api.get('/bills', { params: type ? { type } : {} }),
  getById: (id) => api.get(`/bills/${id}`),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  addInstallment: (id, data) => api.post(`/bills/${id}/installments`, data),
  updateInstallment: (id, installmentId, data) => api.put(`/bills/${id}/installments/${installmentId}`, data),
  deleteInstallment: (id, installmentId) => api.delete(`/bills/${id}/installments/${installmentId}`),
};

// ==========================
// 👤 Customer Services
// ==========================
export const customerAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// ==========================
// 🧾 Receipt Services
// ==========================
export const receiptAPI = {
  // Generate company payment summary receipt (returns PDF)
  generateCompanyReceipt: (paymentId) => `${API_BASE_URL}/receipts/company/${paymentId}`,

  // Generate driver rental payment summary receipt (returns PDF)
  generateDriverReceipt: (paymentId) => `${API_BASE_URL}/receipts/driver/${paymentId}`,

  // Generate company payment installment receipt (returns PDF)
  generateCompanyInstallmentReceipt: (paymentId, installmentId) =>
    `${API_BASE_URL}/receipts/company/${paymentId}/installment/${installmentId}`,

  // Generate driver rental payment installment receipt (returns PDF)
  generateDriverInstallmentReceipt: (paymentId, installmentId) =>
    `${API_BASE_URL}/receipts/driver/${paymentId}/installment/${installmentId}`,
};

export default api;
