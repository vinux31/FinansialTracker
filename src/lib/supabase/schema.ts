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
