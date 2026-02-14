import { z } from 'zod'
import { CATEGORIES } from '@/types'

export const expenseSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+$/, 'Amount must be a whole number (IDR has no cents)')
    .transform(Number)
    .pipe(z.number().positive('Amount must be positive')),
  category: z.enum(['Makan', 'Transportasi', 'Rokok', 'Belanja', 'Lainnya'] as const, {
    message: 'Please select a category',
  }),
  notes: z.string().max(200, 'Notes must be under 200 characters').default(''),
})

export const incomeSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+$/, 'Amount must be a whole number')
    .transform(Number)
    .pipe(z.number().positive('Amount must be positive')),
  notes: z.string().max(200, 'Notes must be under 200 characters').default(''),
})

export type ExpenseInput = z.input<typeof expenseSchema>
export type IncomeInput = z.input<typeof incomeSchema>
