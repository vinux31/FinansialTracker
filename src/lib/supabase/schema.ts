import { z } from 'zod'

// Database transaction schema (from Supabase)
export const DatabaseTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(['expense', 'income']),
  amount: z.number().int().positive(),
  category: z.enum(['Makan', 'Transportasi', 'Rokok', 'Belanja', 'Lainnya', 'Income']),
  notes: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  timestamp: z.string().datetime(), // ISO 8601 with timezone
  created_at: z.string().datetime(),
})

export type DatabaseTransaction = z.infer<typeof DatabaseTransactionSchema>

// Insert transaction schema (before database assigns id/created_at)
export const InsertTransactionSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['expense', 'income']),
  amount: z.number().int().positive(),
  category: z.enum(['Makan', 'Transportasi', 'Rokok', 'Belanja', 'Lainnya', 'Income']),
  notes: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timestamp: z.string().datetime(),
})

export type InsertTransaction = z.infer<typeof InsertTransactionSchema>

// Validate array of transactions (used during migration)
export function validateTransactions(transactions: unknown[]): InsertTransaction[] {
  const result = z.array(InsertTransactionSchema).safeParse(transactions)

  if (!result.success) {
    console.error('Transaction validation errors:', result.error.flatten())
    throw new Error('Invalid transaction data format')
  }

  return result.data
}

// Investment categories
export const INVESTMENT_CATEGORIES = ['Saham', 'Emas', 'Reksadana'] as const

// Database investment schema (from Supabase)
export const DatabaseInvestmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  category: z.enum(INVESTMENT_CATEGORIES),
  monthly_contribution: z.number().int().positive(),
  current_value: z.number().int().positive(),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  notes: z.string().default(''),
  timestamp: z.string().datetime(), // ISO 8601 with timezone
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type DatabaseInvestment = z.infer<typeof DatabaseInvestmentSchema>

// Insert investment schema (before database assigns id/created_at/updated_at)
export const InsertInvestmentSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1, 'Investment name required').max(255, 'Name too long'),
  category: z.enum(INVESTMENT_CATEGORIES),
  monthly_contribution: z.number().int().positive('Contribution must be positive'),
  current_value: z.number().int().positive('Value must be positive'),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().default(''),
  timestamp: z.string().datetime(),
})

export type InsertInvestment = z.infer<typeof InsertInvestmentSchema>

// Update investment schema (subset of fields for updates)
export const UpdateInvestmentSchema = InsertInvestmentSchema.partial().extend({
  id: z.string().uuid(),
})

export type UpdateInvestment = z.infer<typeof UpdateInvestmentSchema>

// Validate array of investments (used during migration or bulk operations)
export function validateInvestments(investments: unknown[]): InsertInvestment[] {
  const result = z.array(InsertInvestmentSchema).safeParse(investments)

  if (!result.success) {
    console.error('Investment validation errors:', result.error.flatten())
    throw new Error('Invalid investment data format')
  }

  return result.data
}

// Goal categories, priorities, and statuses
export const GOAL_CATEGORIES = ['Pernikahan', 'Kendaraan', 'Liburan', 'Pendidikan', 'Rumah', 'Dana Darurat', 'Lainnya'] as const
export const GOAL_PRIORITIES = ['High', 'Medium', 'Low'] as const
export const GOAL_STATUSES = ['upcoming', 'in-progress', 'completed', 'overdue'] as const

// Database goal schema (from Supabase)
export const DatabaseGoalSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: z.enum(GOAL_CATEGORIES),
  target_amount: z.number().int().positive(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  priority: z.enum(GOAL_PRIORITIES),
  status: z.enum(GOAL_STATUSES),
  status_override: z.enum(GOAL_STATUSES).nullable(),
  funding_notes: z.string().default(''),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type DatabaseGoal = z.infer<typeof DatabaseGoalSchema>

// Insert goal schema (before database assigns id/timestamps)
export const InsertGoalSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().min(1, 'Goal name required').max(100, 'Name too long'),
  category: z.enum(GOAL_CATEGORIES, { message: 'Please select a valid category' }),
  target_amount: z.number().int().positive('Target amount must be positive'),
  deadline: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .refine(date => new Date(date) > new Date(), 'Deadline must be in the future'),
  priority: z.enum(GOAL_PRIORITIES, { message: 'Please select a priority level' }),
  funding_notes: z.string().max(500, 'Notes must be under 500 characters').default(''),
})

export type InsertGoal = z.infer<typeof InsertGoalSchema>

// Update goal schema
export const UpdateGoalSchema = InsertGoalSchema.partial().extend({
  id: z.string().uuid(),
  status_override: z.enum(GOAL_STATUSES).nullable().optional(), // Allow manual status override
})

export type UpdateGoal = z.infer<typeof UpdateGoalSchema>

// Database progress entry schema (from Supabase)
export const DatabaseProgressEntrySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  goal_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  planned_amount: z.number().int().min(0),
  actual_amount: z.number().int().min(0),
  notes: z.string().default(''),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type DatabaseProgressEntry = z.infer<typeof DatabaseProgressEntrySchema>

// Insert progress entry schema
export const InsertProgressEntrySchema = z.object({
  user_id: z.string().uuid(),
  goal_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Invalid month format (YYYY-MM)'),
  planned_amount: z.number().int().min(0, 'Amount cannot be negative'),
  actual_amount: z.number().int().min(0, 'Amount cannot be negative'),
  notes: z.string().max(200, 'Notes must be under 200 characters').default(''),
})

export type InsertProgressEntry = z.infer<typeof InsertProgressEntrySchema>
