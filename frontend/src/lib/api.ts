import type { ApiDebt, ApiExpense, ApiMenuItem, ApiOrder, AuthUser, CreateDebtInput, CreateExpenseInput, CreateOrderInput, MerchantDashboard, MenuItemInput, UpdateExpenseInput } from "@/types/api"

const API_BASE_URL = import.meta.env.VITE_API_URL ?? (
  import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'
);

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

// Helper function to get token from localStorage
export const getToken = (): string | null => {
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
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.details || error.error || 'API request failed', response.status, error);
  }

  return response.json();
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{ user: AuthUser; token: string }>('/auth/login', {
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
  me: () => apiRequest<{ id: number; name: string; email: string; role: string }>("/auth/me"),

  logout: () => {
    removeToken();
  },
};

export const customerApi = {
  orders: () => apiRequest<ApiOrder[]>("/customer/orders"),
  loyalty: () => apiRequest<{ stamps: number; remaining: number; rewardAvailable: boolean }>("/customer/loyalty"),
};

// Menu API
export const menuApi = {
  getAll: () => apiRequest<ApiMenuItem[]>('/menu'),

  getAvailable: () => apiRequest<ApiMenuItem[]>('/menu/available'),

  getById: (id: number) => apiRequest<ApiMenuItem>(`/menu/${id}`),

  create: (data: MenuItemInput) =>
    apiRequest<ApiMenuItem>('/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<MenuItemInput>) =>
    apiRequest<ApiMenuItem>(`/menu/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  toggleAvailability: (id: number) =>
    apiRequest<ApiMenuItem>(`/menu/${id}/toggle`, {
      method: 'PATCH',
    }),

  updateStock: (id: number, data: { stockQuantity: number; lowStockThreshold: number }) =>
    apiRequest<ApiMenuItem>(`/menu/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<ApiMenuItem>(`/menu/${id}`, {
      method: 'DELETE',
    }),
};

// Orders API
export const ordersApi = {
  getAll: () => apiRequest<ApiOrder[]>('/orders'),

  getActive: () => apiRequest<ApiOrder[]>('/orders/active'),

  getById: (id: number) => apiRequest<ApiOrder>(`/orders/${id}`),

  getByTrackingToken: (trackingToken: string) =>
    apiRequest<ApiOrder>(`/orders/track/${encodeURIComponent(trackingToken)}`),

  createGuest: (data: CreateOrderInput & { whatsappNumber: string }) =>
    apiRequest<ApiOrder>('/orders/guest', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  create: (data: CreateOrderInput) =>
    apiRequest<ApiOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: string) =>
    apiRequest<ApiOrder>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updatePaymentStatus: (id: number, paymentStatus: string) =>
    apiRequest<ApiOrder>(`/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    }),

  performAction: (id: number, action: string) =>
    apiRequest<ApiOrder>(`/orders/${id}/action`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    }),
};

// Expenses API
export const expensesApi = {
  getAll: () => apiRequest<ApiExpense[]>('/expenses'),

  getToday: () => apiRequest<ApiExpense[]>('/expenses/today'),

  getById: (id: number) => apiRequest<ApiExpense>(`/expenses/${id}`),

  create: (data: CreateExpenseInput) =>
    apiRequest<ApiExpense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateExpenseInput) =>
    apiRequest<ApiExpense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/expenses/${id}`, {
      method: 'DELETE',
    }),
};

// Debts API
export const debtsApi = {
  getAll: () => apiRequest<ApiDebt[]>('/debts'),

  getUnpaid: () => apiRequest<ApiDebt[]>('/debts/unpaid'),

  getPaid: () => apiRequest<ApiDebt[]>('/debts/paid'),

  getById: (id: number) => apiRequest<ApiDebt>(`/debts/${id}`),

  create: (data: CreateDebtInput) =>
    apiRequest<ApiDebt>('/debts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAsPaid: (id: number) =>
    apiRequest<ApiDebt>(`/debts/${id}/pay`, {
      method: 'PATCH',
    }),

  markAsUnpaid: (id: number) =>
    apiRequest<ApiDebt>(`/debts/${id}/unpay`, {
      method: 'PATCH',
    }),

  delete: (id: number) =>
    apiRequest<{ message: string }>(`/debts/${id}`, {
      method: 'DELETE',
    }),
};

export const merchantApi = {
  getDashboard: (date?: string) => apiRequest<MerchantDashboard>(`/merchant/dashboard${date ? `?date=${encodeURIComponent(date)}` : ""}`),
}
