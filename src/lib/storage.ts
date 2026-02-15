import { Transaction, Category, CATEGORIES, NewExpense, NewIncome, MonthSummary } from '@/types'
import { todayDateString, currentMonthString, getMonthFromDate, isToday } from '@/lib/date'
import { sumAmounts } from '@/lib/money'

const STORAGE_KEY = 'finance-tracker-transactions'

// SSR guard: returns empty on server
function isClient(): boolean {
  return typeof window !== 'undefined'
}

// Read all transactions from localStorage
export function getTransactions(): Transaction[] {
  if (!isClient()) return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// Save all transactions (internal use only)
function saveTransactions(transactions: Transaction[]): void {
  if (!isClient()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

// Append a new transaction (append-only ledger pattern)
export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const transactions = getTransactions()
  const newTx: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  transactions.push(newTx)
  saveTransactions(transactions)
  return newTx
}

// Add expense helper
export function addExpense(expense: NewExpense): Transaction {
  const dateStr = todayDateString()
  return addTransaction({
    type: 'expense',
    amount: expense.amount,
    category: expense.category,
    notes: expense.notes,
    date: dateStr,
    timestamp: new Date().toISOString(),
  })
}

// Add income helper
export function addIncome(income: NewIncome): Transaction {
  const dateStr = todayDateString()
  return addTransaction({
    type: 'income',
    amount: income.amount,
    category: 'Income',
    notes: income.notes,
    date: dateStr,
    timestamp: new Date().toISOString(),
  })
}

// Get today's transactions
export function getTodayTransactions(): Transaction[] {
  return getTransactions().filter(tx => isToday(tx.date))
}

// Get today's total spending
export function getTodayTotal(): number {
  const todayExpenses = getTodayTransactions().filter(tx => tx.type === 'expense')
  return sumAmounts(todayExpenses.map(tx => tx.amount))
}

// Get transactions for a specific month (YYYY-MM)
export function getMonthTransactions(month: string): Transaction[] {
  return getTransactions().filter(tx => getMonthFromDate(tx.date) === month)
}

// Calculate monthly summary
export function getMonthSummary(month: string): MonthSummary {
  const transactions = getMonthTransactions(month)
  const expenses = transactions.filter(tx => tx.type === 'expense')
  const income = transactions.filter(tx => tx.type === 'income')

  const byCategory = {} as Record<Category, number>
  for (const cat of CATEGORIES) {
    byCategory[cat] = sumAmounts(
      expenses.filter(tx => tx.category === cat).map(tx => tx.amount)
    )
  }

  return {
    month,
    totalExpenses: sumAmounts(expenses.map(tx => tx.amount)),
    totalIncome: sumAmounts(income.map(tx => tx.amount)),
    byCategory,
  }
}

// Update an existing transaction
export function updateTransaction(id: string, updates: Partial<Transaction>): void {
  if (!isClient()) return

  const transactions = getTransactions()
  const index = transactions.findIndex(tx => tx.id === id)

  if (index === -1) return

  // Merge updates with existing transaction, preserving id and createdAt
  const updatedTx = {
    ...transactions[index],
    ...updates,
    id: transactions[index].id,
    createdAt: transactions[index].createdAt,
  }

  transactions[index] = updatedTx
  saveTransactions(transactions)
}

// Delete a transaction
export function deleteTransaction(id: string): void {
  if (!isClient()) return

  const transactions = getTransactions()
  const filtered = transactions.filter(tx => tx.id !== id)
  saveTransactions(filtered)
}
