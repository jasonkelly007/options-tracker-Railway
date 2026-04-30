import axios from 'axios';
import type {
  Position,
  OptionsPosition,
  CreateCoveredCallDto,
  CreateCashSecuredPutDto,
  RollOptionDto,
  RollHistory,
  DashboardSummary,
  CsvImportResult
} from '../types';

const API_BASE_URL = typeof import.meta !== 'undefined' && import.meta.env 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the password header
apiClient.interceptors.request.use((config) => {
  const password = localStorage.getItem('app_password');
  if (password) {
    config.headers['X-App-Password'] = password;
  }
  return config;
});

// Add a response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('app_password');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Positions API
export const positionsApi = {
  getAll: (account?: string) => 
    apiClient.get<Position[]>('/positions', { params: { account } }),
  
  getById: (id: number) => 
    apiClient.get<Position>(`/positions/${id}`),
  
  create: (data: { symbol: string; quantity: number; price: number; account: string }) =>
    apiClient.post<Position>('/positions', data),
  
  updatePrice: (id: number, currentPrice: number) =>
    apiClient.put(`/positions/${id}/price`, { currentPrice }),
  
  delete: (id: number) =>
    apiClient.delete(`/positions/${id}`),
};

// Options API
export const optionsApi = {
  getAll: (account?: string, status?: string) =>
    apiClient.get<OptionsPosition[]>('/options', { params: { account, status } }),
  
  getById: (id: number) =>
    apiClient.get<OptionsPosition>(`/options/${id}`),
  
  createCoveredCall: (data: CreateCoveredCallDto) =>
    apiClient.post<OptionsPosition>('/options/covered-calls', data),
  
  createCashSecuredPut: (data: CreateCashSecuredPutDto) =>
    apiClient.post<OptionsPosition>('/options/cash-secured-puts', data),
  
  roll: (data: RollOptionDto) =>
    apiClient.post<RollHistory>('/options/roll', data),
  
  getRollHistory: (optionsPositionId?: number) =>
    apiClient.get<RollHistory[]>('/options/roll-history', { params: { optionsPositionId } }),
  
  close: (id: number, closingPrice: number) =>
    apiClient.post(`/options/${id}/close`, { closingPrice }),
  
  getDashboard: (account?: string) =>
    apiClient.get<DashboardSummary>('/options/dashboard', { params: { account } }),
};

// Import API
export const importApi = {
  uploadCsv: (file: File, broker: string, account: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('broker', broker);
    formData.append('account', account);
    
    return apiClient.post<CsvImportResult>('/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getSupportedBrokers: () =>
    apiClient.get<string[]>('/import/brokers'),
};

export default apiClient;
