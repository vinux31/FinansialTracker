export type Category = 'Makan' | 'Transportasi' | 'Rokok' | 'Belanja' | 'Lainnya'

export const CATEGORIES: Category[] = ['Makan', 'Transportasi', 'Rokok', 'Belanja', 'Lainnya']

export interface Transaction {
  id: string                          // crypto.randomUUID()
  type: 'expense' | 'income'
  amount: number                      // Store as integer (no decimals for IDR)
  category: Category | 'Income'       // 'Income' for income entries
  notes: string                       // Empty string if none
  date: string                        // ISO 8601 date string (YYYY-MM-DD)
  timestamp: string                   // Full ISO 8601 datetime for ordering
  createdAt: string                   // Audit trail
}

export type NewExpense = {
  amount: number
  category: Category
  notes: string
  date?: string // YYYY-MM-DD, defaults to today if not provided
}

export type NewIncome = {
  amount: number
  notes: string
}

export interface MonthSummary {
  month: string                       // 'YYYY-MM' format
  totalExpenses: number
  totalIncome: number
  byCategory: Record<Category, number>
}

export interface FormState {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export interface Goal {
  id: string
  user_id: string
  name: string
  category: string
  target_amount: number
  deadline: string // YYYY-MM-DD
  priority: 'High' | 'Medium' | 'Low'
  status: 'upcoming' | 'in-progress' | 'completed' | 'overdue'
  status_override: string | null
  funding_notes: string
  created_at: string
  updated_at: string
}

export interface ProgressEntry {
  id: string
  user_id: string
  goal_id: string
  month: string // YYYY-MM
  planned_amount: number
  actual_amount: number
  notes: string
  created_at: string
  updated_at: string
}
