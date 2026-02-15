'use client'

import { useRef, useState } from 'react'
import { expenseSchema } from '@/lib/validation'
import { addExpense } from '@/lib/db'
import { CATEGORIES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExpenseFormProps {
  onExpenseAdded?: () => void
}

export function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      amount: formData.get('amount') as string,
      category: formData.get('category') as string,
      notes: formData.get('notes') as string,
    }

    const result = expenseSchema.safeParse(data)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    try {
      // Add expense to database
      await addExpense({
        amount: result.data.amount,
        category: result.data.category,
        notes: result.data.notes,
      })

      // Reset form
      formRef.current?.reset()

      // Notify parent to refresh
      onExpenseAdded?.()
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save expense' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Add Expense</h2>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (Rp)</Label>
        <Input
          id="amount"
          name="amount"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="15000"
          autoFocus
          className={errors.amount ? 'border-red-500' : ''}
        />
        {errors.amount && (
          <p className="text-sm text-red-600">{errors.amount}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          defaultValue="Makan"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-sm text-red-600">{errors.category}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          name="notes"
          type="text"
          placeholder="e.g., lunch at warung"
          className={errors.notes ? 'border-red-500' : ''}
        />
        {errors.notes && (
          <p className="text-sm text-red-600">{errors.notes}</p>
        )}
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Expense'}
      </Button>
    </form>
  )
}
