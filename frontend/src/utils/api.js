import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    
    if (error.response?.status === 401 && !error.config.url.includes('/api/auth/login')) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    } else if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// API helper functions
export const apiHelpers = {
  // Products
  getProducts: (params) => api.get('/api/products', { params }),
  getProduct: (id) => api.get(`/api/products/${id}`),
  createProduct: (data) => api.post('/api/products', data),
  updateProduct: (id, data) => api.put(`/api/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/products/${id}`),
  updateStock: (id, data) => api.put(`/api/products/${id}/stock`, data),
  getCategories: () => api.get('/api/products/categories'),
  getLowStock: () => api.get('/api/products/low-stock'),

  // Customers
  getCustomers: (params) => api.get('/api/customers', { params }),
  getCustomer: (id) => api.get(`/api/customers/${id}`),
  createCustomer: (data) => api.post('/api/customers', data),
  updateCustomer: (id, data) => api.put(`/api/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/api/customers/${id}`),
  getCustomersWithDebt: () => api.get('/api/customers/with-debt'),
  getCustomerStatement: (id, params) => api.get(`/api/customers/${id}/statement`, { params }),

  // Suppliers
  getSuppliers: (params) => api.get('/api/suppliers', { params }),
  getSupplier: (id) => api.get(`/api/suppliers/${id}`),
  createSupplier: (data) => api.post('/api/suppliers', data),
  updateSupplier: (id, data) => api.put(`/api/suppliers/${id}`, data),
  deleteSupplier: (id) => api.delete(`/api/suppliers/${id}`),

  // Sales
  getSales: (params) => api.get('/api/sales', { params }),
  getSale: (id) => api.get(`/api/sales/${id}`),
  createSale: (data) => api.post('/api/sales', data),
  updatePayment: (id, data) => api.put(`/api/sales/${id}/payment`, data),
  cancelSale: (id) => api.put(`/api/sales/${id}/cancel`),
  getDailyReport: (date) => api.get('/api/sales/daily-report', { params: { date } }),

  // Dashboard
  getDashboardStats: () => api.get('/api/dashboard/stats'),
  getSalesChart: (period) => api.get('/api/dashboard/sales-chart', { params: { period } }),
  getTopProducts: () => api.get('/api/dashboard/top-products'),

  // Users (admin only)
  getUsers: () => api.get('/api/users'),
  createUser: (data) => api.post('/api/users', data),
  resetPassword: (id, data) => api.put(`/api/users/${id}/reset-password`, data),
  getUserActivity: (id) => api.get(`/api/users/${id}/activity`),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),

  // Login Audits (admin only)
  getLoginAudits: (params) => api.get('/api/login-audits', { params }),
  getLoginStats: (params) => api.get('/api/login-audits/stats', { params }),
  clearLoginAudits: (data) => api.delete('/api/login-audits', { data }),

  // Customer Payments
  getCustomerPayments: (params) => api.get('/api/customer-payments', { params }),
  createCustomerPayment: (data) => api.post('/api/customer-payments', data),
  updateCustomerPayment: (id, data) => api.put(`/api/customer-payments/${id}`, data),
  deleteCustomerPayment: (id) => api.delete(`/api/customer-payments/${id}`),
  syncCustomerPayments: () => api.post('/api/customer-payments/sync'),
  getCustomerPayment: (id) => api.get(`/api/customer-payments/${id}`),
  getCustomerOutstandingSales: (customerId) => api.get(`/api/customer-payments/outstanding/${customerId}`),
  getCustomerPaymentHistory: (customerId, params) => api.get(`/api/customer-payments/history/${customerId}`, { params }),
  downloadPaymentReceipt: (id) => api.get(`/api/customer-payments/${id}/receipt`, { responseType: 'blob' })
};
