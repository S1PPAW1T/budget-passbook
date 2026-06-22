import type {
  AuthResponse, User, Category, Transaction, BudgetWithSpent,
  SummaryMonth, TrendPoint, TransactionCreateInput, TransactionUpdateInput,
  CategoryCreateInput, ChangePasswordInput,
} from '@budget-passbook/shared';

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; displayName: string }) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<User>('/auth/me'),
    changePassword: (data: ChangePasswordInput) =>
      request<{ message: string }>('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
  },
  categories: {
    list: () => request<Category[]>('/categories'),
    create: (data: CategoryCreateInput) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  transactions: {
    list: (month?: string) =>
      request<Transaction[]>(`/transactions${month ? `?month=${month}` : ''}`),
    create: (data: TransactionCreateInput) =>
      request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: TransactionUpdateInput) =>
      request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/transactions/${id}`, { method: 'DELETE' }),
  },
  budgets: {
    list: (month?: string) =>
      request<BudgetWithSpent[]>(`/budgets${month ? `?month=${month}` : ''}`),
    upsert: (categoryId: string, data: { month: string; amount: number }) =>
      request<BudgetWithSpent>(`/budgets/${categoryId}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  summary: {
    month: (month?: string) =>
      request<SummaryMonth>(`/summary${month ? `?month=${month}` : ''}`),
    trend: (months = 12) =>
      request<TrendPoint[]>(`/summary/trend?months=${months}`),
    total: () =>
      request<{ totalIncome: number; totalExpense: number; net: number }>('/summary/total'),
  },
};
