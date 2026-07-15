import { Platform } from 'react-native';
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as Storage from '../utils/storage';

const DEV_API_URL =
  Platform.OS === 'web' ? 'http://localhost:5000/api/v1' : 'http://localhost:5000/api/v1';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? DEV_API_URL : 'https://beten-backend.onrender.com/api/v1');

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await Storage.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await Storage.deleteItemAsync('token');
      await Storage.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { email: string; password: string; fullName: string; phone: string }) =>
    api.post('/auth/register', data),
  syncFirebaseUser: (data: { firebaseUid: string; email: string }) =>
    api.post('/auth/sync-firebase-user', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: { fullName?: string; phone?: string }) => api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
  changeEmail: (data: { currentPassword: string; newEmail: string }) =>
    api.put('/auth/change-email', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
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
  create: (data: any, headers?: any) => api.post('/tenants', data, { headers }),
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
  update: (id: string, data: any) => api.put(`/payments/${id}`, data),
  create: (data: any) => api.post('/payments', data),
  payOverdue: (data: any) => api.post('/payments/pay-overdue', data),
  getBalance: (tenantId: string) => api.get(`/payments/balance/${tenantId}`),
};

export const expensesAPI = {
  getAll: (params?: any) => api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
};

export const reportsAPI = {
  getIncome: (params: { startDate: string; endDate: string }) =>
    api.get('/reports/income', { params }),
  getOccupancy: () => api.get('/reports/occupancy'),
};

export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  registerPushToken: (token: string) => api.post('/notifications/push-token', { token }),
};
