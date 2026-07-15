import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL =
  window.location.protocol === 'file:' ? 'https://beten-backend.onrender.com/api/v1' : '/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
  changeEmail: (data: { currentPassword: string; newEmail: string }) =>
    api.put('/auth/change-email', data),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh-token', { refreshToken }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const housesAPI = {
  getAll: (params?: any) => api.get('/houses', { params }),
  getById: (id: string) => api.get(`/houses/${id}`),
  create: (data: any) => api.post('/houses', data),
  update: (id: string, data: any) => api.put(`/houses/${id}`, data),
  delete: (id: string) => api.delete(`/houses/${id}`),
  search: (query: string) => api.get('/houses/search', { params: { q: query } }),
};

export const roomsAPI = {
  getAll: (params?: any) => api.get('/rooms', { params }),
  getById: (id: string) => api.get(`/rooms/${id}`),
  create: (data: any) => api.post('/rooms', data),
  update: (id: string, data: any) => api.put(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
  getVacant: (houseId?: string) => api.get('/rooms/vacant', { params: { houseId } }),
};

export const tenantsAPI = {
  getAll: (params?: any) => api.get('/tenants', { params }),
  getById: (id: string) => api.get(`/tenants/${id}`),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post('/tenants', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/tenants', data);
  },
  update: (id: string, data: any) => api.put(`/tenants/${id}`, data),
  delete: (id: string) => api.delete(`/tenants/${id}`),
};

export const contractsAPI = {
  getAll: (params?: any) => api.get('/contracts', { params }),
  getById: (id: string) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  terminate: (id: string) => api.put(`/contracts/${id}/terminate`),
};

export const paymentsAPI = {
  getAll: (params?: any) => api.get('/payments', { params }),
  getById: (id: string) => api.get(`/payments/${id}`),
  create: (data: any) => api.post('/payments', data),
  update: (id: string, data: any) => api.put(`/payments/${id}`, data),
  payOverdue: (data: any) => api.post('/payments/pay-overdue', data),
  getBalance: (tenantId: string) => api.get(`/payments/balance/${tenantId}`),
};

export const expensesAPI = {
  getAll: (params?: any) => api.get('/expenses', { params }),
  getById: (id: string) => api.get(`/expenses/${id}`),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const reportsAPI = {
  getIncome: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/income', { params }),
  getExpenses: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/expenses', { params }),
  getOccupancy: () => api.get('/reports/occupancy'),
  exportPayments: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/export/payments', { params, responseType: 'blob' }),
  exportExpenses: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/export/expenses', { params, responseType: 'blob' }),
};
