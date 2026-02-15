import { z } from 'zod'
import { CATEGORIES } from '@/types'

// Database transaction schema (from Supabase)
export const DatabaseTransactionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.enum(['expense', 'income']),
  amount: z.number().int().positive(),
  category: z.enum([...CATEGORIES, 'Income'] as [string, ...string[]]),
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
  category: z.enum([...CATEGORIES, 'Income'] as [string, ...string[]]),
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
