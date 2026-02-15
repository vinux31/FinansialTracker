'use client'

import { createClient } from '@/lib/supabase/client'
import { Transaction, Category, NewExpense, NewIncome, MonthSummary, CATEGORIES } from '@/types'
import { todayDateString, getMonthFromDate, isToday } from '@/lib/date'
import { sumAmounts } from '@/lib/money'

const supabase = createClient()

// Get current user ID (must be called from authenticated context)
async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new Error('User not authenticated')
  }
  return data.user.id
}

// Read all transactions for current user
export async function getTransactions(): Promise<Transaction[]> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })

  if (error) throw error

  // Transform database records to Transaction type
  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    category: row.category,
    notes: row.notes,
    date: row.date,
    timestamp: row.timestamp,
    createdAt: row.created_at,
  }))
}

// Add expense helper
export async function addExpense(expense: NewExpense): Promise<Transaction> {
  const userId = await getUserId()
  const dateStr = todayDateString()
  const timestamp = new Date().toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'expense',
      amount: expense.amount,
      category: expense.category,
      notes: expense.notes,
      date: dateStr,
      timestamp: timestamp,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    type: data.type,
    amount: data.amount,
    category: data.category as Category,
    notes: data.notes,
    date: data.date,
    timestamp: data.timestamp,
    createdAt: data.created_at,
  }
}

// Add income helper
export async function addIncome(income: NewIncome): Promise<Transaction> {
  const userId = await getUserId()
  const dateStr = todayDateString()
  const timestamp = new Date().toISOString()

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'income',
      amount: income.amount,
      category: 'Income',
      notes: income.notes,
      date: dateStr,
      timestamp: timestamp,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    type: data.type,
    amount: data.amount,
    category: data.category as 'Income',
    notes: data.notes,
    date: data.date,
    timestamp: data.timestamp,
    createdAt: data.created_at,
  }
}

// Update an existing transaction
export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const userId = await getUserId()

  // Build update object with only allowed fields
  const updateData: Record<string, unknown> = {}
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.notes !== undefined) updateData.notes = updates.notes
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.timestamp !== undefined) updateData.timestamp = updates.timestamp

  const { error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId) // Ensure user owns this transaction

  if (error) throw error
}

// Delete a transaction
export async function deleteTransaction(id: string): Promise<void> {
  const userId = await getUserId()

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId) // Ensure user owns this transaction

  if (error) throw error
}

// Get today's transactions
export async function getTodayTransactions(): Promise<Transaction[]> {
  const transactions = await getTransactions()
  return transactions.filter(tx => isToday(tx.date))
}

// Get today's total spending
export async function getTodayTotal(): Promise<number> {
  const todayTxs = await getTodayTransactions()
  const todayExpenses = todayTxs.filter(tx => tx.type === 'expense')
  return sumAmounts(todayExpenses.map(tx => tx.amount))
}

// Get transactions for a specific month (YYYY-MM)
export async function getMonthTransactions(month: string): Promise<Transaction[]> {
  const transactions = await getTransactions()
  return transactions.filter(tx => getMonthFromDate(tx.date) === month)
}

// Calculate monthly summary
export async function getMonthSummary(month: string): Promise<MonthSummary> {
  const transactions = await getMonthTransactions(month)
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

// Migrate transactions helper (used by migration page)
export async function migrateTransactions(transactions: any[]): Promise<number> {
  const userId = await getUserId()

  // Transform and insert
  const dbTransactions = transactions.map(tx => ({
    user_id: userId,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    notes: tx.notes,
    date: tx.date,
    timestamp: tx.timestamp,
    created_at: tx.createdAt,
  }))

  const { error } = await supabase
    .from('transactions')
    .insert(dbTransactions)

  if (error) throw error

  // Return count for verification
  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count ?? 0
}
