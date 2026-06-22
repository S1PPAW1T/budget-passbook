export type CategoryType = 'INCOME' | 'EXPENSE';

export interface Category {
  id: string;
  userId: string | null;
  type: CategoryType;
  name: string;
  icon: string;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD
  note: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: string; // YYYY-MM
  amount: number;
  category: Category;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SummaryMonth {
  totalIncome: number;
  totalExpense: number;
  net: number;
  incomeByCategory: { categoryId: string; category: Category; total: number }[];
  expenseByCategory: { categoryId: string; category: Category; total: number }[];
}

export interface TrendPoint {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
}
