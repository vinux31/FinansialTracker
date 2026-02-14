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
