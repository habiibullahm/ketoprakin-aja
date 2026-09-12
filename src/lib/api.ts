const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to set token
export const setToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove token
export const removeToken = (): void => {
  localStorage.removeItem('authToken');
};

// Generic fetch wrapper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || error.error || 'API request failed');
  }

  return response.json();
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(response.token);
    return response;
  },

  register: async (email: string, password: string, name: string) => {
    const response = await apiRequest<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setToken(response.token);
    return response;
  },

  logout: () => {
    removeToken();
  },
};

// Menu API
export const menuApi = {
  getAll: () => apiRequest<any[]>('/menu'),

  getAvailable: () => apiRequest<any[]>('/menu/available'),

  getById: (id: number) => apiRequest<any>(`/menu/${id}`),

  create: (data: any) =>
    apiRequest<any>('/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    apiRequest<any>(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleAvailability: (id: number) =>
    apiRequest<any>(`/menu/${id}/toggle`, {
      method: 'PATCH',
    }),

  delete: (id: number) =>
    apiRequest<any>(`/menu/${id}`, {
      method: 'DELETE',
    }),
};

// Orders API
export const ordersApi = {
  getAll: () => apiRequest<any[]>('/orders'),

  getActive: () => apiRequest<any[]>('/orders/active'),

  getById: (id: number) => apiRequest<any>(`/orders/${id}`),

  create: (data: any) =>
    apiRequest<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: string) =>
    apiRequest<any>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updatePaymentStatus: (id: number, paymentStatus: string) =>
    apiRequest<any>(`/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    }),
};

// Expenses API
export const expensesApi = {
  getAll: () => apiRequest<any[]>('/expenses'),

  getById: (id: number) => apiRequest<any>(`/expenses/${id}`),

  create: (data: any) =>
    apiRequest<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    apiRequest<any>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<any>(`/expenses/${id}`, {
      method: 'DELETE',
    }),
};

// Debts API
export const debtsApi = {
  getAll: () => apiRequest<any[]>('/debts'),

  getUnpaid: () => apiRequest<any[]>('/debts/unpaid'),

  getPaid: () => apiRequest<any[]>('/debts/paid'),

  getById: (id: number) => apiRequest<any>(`/debts/${id}`),

  create: (data: any) =>
    apiRequest<any>('/debts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAsPaid: (id: number) =>
    apiRequest<any>(`/debts/${id}/pay`, {
      method: 'PATCH',
    }),

  markAsUnpaid: (id: number) =>
    apiRequest<any>(`/debts/${id}/unpay`, {
      method: 'PATCH',
    }),

  delete: (id: number) =>
    apiRequest<any>(`/debts/${id}`, {
      method: 'DELETE',
    }),
};
