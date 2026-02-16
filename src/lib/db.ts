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

// ========================================
// Investment CRUD Operations
// ========================================

// Get all investments for current user
export async function getInvestments() {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch investments:', error)
    throw new Error('Failed to load investments')
  }

  // Transform and validate response
  return (data || []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category: row.category,
    monthly_contribution: row.monthly_contribution,
    current_value: row.current_value,
    purchase_date: row.purchase_date,
    notes: row.notes,
    timestamp: row.timestamp,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

// Create a new investment
export async function createInvestment(investment: {
  name: string
  category: string
  monthly_contribution: number
  current_value: number
  purchase_date: string
  notes?: string
}) {
  const userId = await getUserId()
  const timestamp = new Date().toISOString()

  // Validate input
  const { InsertInvestmentSchema } = await import('@/lib/supabase/schema')
  const validationResult = InsertInvestmentSchema.safeParse({
    user_id: userId,
    name: investment.name,
    category: investment.category,
    monthly_contribution: investment.monthly_contribution,
    current_value: investment.current_value,
    purchase_date: investment.purchase_date,
    notes: investment.notes || '',
    timestamp: timestamp,
  })

  if (!validationResult.success) {
    console.error('Investment validation failed:', validationResult.error)
    throw new Error('Invalid investment data')
  }

  const { data, error } = await supabase
    .from('investments')
    .insert({
      user_id: userId,
      name: investment.name,
      category: investment.category,
      monthly_contribution: investment.monthly_contribution,
      current_value: investment.current_value,
      purchase_date: investment.purchase_date,
      notes: investment.notes || '',
      timestamp: timestamp,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create investment:', error)
    throw new Error('Failed to create investment')
  }

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    category: data.category,
    monthly_contribution: data.monthly_contribution,
    current_value: data.current_value,
    purchase_date: data.purchase_date,
    notes: data.notes,
    timestamp: data.timestamp,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

// Update an existing investment
export async function updateInvestment(
  id: string,
  updates: {
    name?: string
    category?: string
    monthly_contribution?: number
    current_value?: number
    purchase_date?: string
    notes?: string
  }
) {
  const userId = await getUserId()

  // First verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('investments')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Failed to fetch investment for ownership check:', fetchError)
    throw new Error('Investment not found')
  }

  if (existing.user_id !== userId) {
    throw new Error('Unauthorized: Cannot update investment owned by another user')
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.monthly_contribution !== undefined) updateData.monthly_contribution = updates.monthly_contribution
  if (updates.current_value !== undefined) updateData.current_value = updates.current_value
  if (updates.purchase_date !== undefined) updateData.purchase_date = updates.purchase_date
  if (updates.notes !== undefined) updateData.notes = updates.notes
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('investments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update investment:', error)
    throw new Error('Failed to update investment')
  }

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    category: data.category,
    monthly_contribution: data.monthly_contribution,
    current_value: data.current_value,
    purchase_date: data.purchase_date,
    notes: data.notes,
    timestamp: data.timestamp,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

// Delete an investment
export async function deleteInvestment(id: string): Promise<void> {
  const userId = await getUserId()

  // First verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('investments')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('Failed to fetch investment for ownership check:', fetchError)
    throw new Error('Investment not found')
  }

  if (existing.user_id !== userId) {
    throw new Error('Unauthorized: Cannot delete investment owned by another user')
  }

  const { error } = await supabase
    .from('investments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete investment:', error)
    throw new Error('Failed to delete investment')
  }
}

// ========================================
// Goal CRUD Operations
// ========================================

// Get all goals for current user
export async function getGoals() {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('deadline', { ascending: true }) // Nearest deadline first

  if (error) throw new Error('Failed to load goals')
  return (data || []).map(row => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category: row.category,
    target_amount: row.target_amount,
    deadline: row.deadline,
    priority: row.priority,
    status: row.status,
    status_override: row.status_override,
    funding_notes: row.funding_notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
}

// Create a new goal
export async function createGoal(goal: {
  name: string
  category: string
  target_amount: number
  deadline: string
  priority: string
  funding_notes?: string
}) {
  const userId = await getUserId()
  const timestamp = new Date().toISOString()

  // Validate input
  const { InsertGoalSchema } = await import('@/lib/supabase/schema')
  const validationResult = InsertGoalSchema.safeParse({
    user_id: userId,
    name: goal.name,
    category: goal.category,
    target_amount: goal.target_amount,
    deadline: goal.deadline,
    priority: goal.priority,
    funding_notes: goal.funding_notes || '',
    status: 'upcoming', // Default status
  })

  if (!validationResult.success) {
    console.error('Goal validation failed:', validationResult.error)
    throw new Error('Invalid goal data')
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      name: goal.name,
      category: goal.category,
      target_amount: goal.target_amount,
      deadline: goal.deadline,
      priority: goal.priority,
      funding_notes: goal.funding_notes || '',
      status: 'upcoming', // Default status
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create goal:', error)
    // Check for unique constraint violation (duplicate goal name)
    if (error.code === '23505') {
      throw new Error('A goal with this name already exists')
    }
    throw new Error('Failed to create goal')
  }
  return data
}

// Update an existing goal
export async function updateGoal(id: string, updates: {
  name?: string
  category?: string
  target_amount?: number
  deadline?: string
  priority?: string
  status_override?: string | null
  funding_notes?: string
}) {
  const userId = await getUserId()

  // Verify ownership first
  const { data: existing, error: fetchError } = await supabase
    .from('goals')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Goal not found')
  if (existing.user_id !== userId) throw new Error('Unauthorized: Cannot update goal owned by another user')

  const updateData: Record<string, unknown> = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.target_amount !== undefined) updateData.target_amount = updates.target_amount
  if (updates.deadline !== undefined) updateData.deadline = updates.deadline
  if (updates.priority !== undefined) updateData.priority = updates.priority
  if (updates.status_override !== undefined) updateData.status_override = updates.status_override
  if (updates.funding_notes !== undefined) updateData.funding_notes = updates.funding_notes
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update goal')
  return data
}

// Delete a goal
export async function deleteGoal(id: string): Promise<void> {
  const userId = await getUserId()

  // Verify ownership first
  const { data: existing, error: fetchError } = await supabase
    .from('goals')
    .select('user_id')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error('Goal not found')
  if (existing.user_id !== userId) throw new Error('Unauthorized: Cannot delete goal owned by another user')

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete goal')
}

// Get progress entries for a goal
export async function getGoalProgress(goalId: string) {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goal_progress_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('goal_id', goalId)
    .order('month', { ascending: false })

  if (error) throw new Error('Failed to load progress entries')
  return data || []
}

// Create or update progress entry for a goal month
export async function upsertGoalProgress(entry: {
  goal_id: string
  month: string
  planned_amount: number
  actual_amount: number
  notes?: string
}) {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goal_progress_entries')
    .upsert({
      user_id: userId,
      goal_id: entry.goal_id,
      month: entry.month,
      planned_amount: entry.planned_amount,
      actual_amount: entry.actual_amount,
      notes: entry.notes || '',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,goal_id,month', // Unique constraint
    })
    .select()
    .single()

  if (error) throw new Error('Failed to save progress entry')
  return data
}
