'use client'

import { useState } from 'react'
import { incomeSchema, type IncomeInput } from '@/lib/validation'
import { addIncome } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface IncomeFormProps {
  onIncomeAdded?: () => void
}

export function IncomeForm({ onIncomeAdded }: IncomeFormProps) {
  const [formData, setFormData] = useState<IncomeInput>({
    amount: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = incomeSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    // Add income to storage
    addIncome({
      amount: result.data.amount,
      notes: result.data.notes,
    })

    // Reset form
    setFormData({ amount: '', notes: '' })

    // Notify parent
    onIncomeAdded?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="space-y-2">
        <Label htmlFor="income-amount">Income Amount (Rp)</Label>
        <Input
          id="income-amount"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="50000"
          className="border-green-300 focus-visible:ring-green-500"
        />
        {errors.amount && (
          <p className="text-sm text-red-600">{errors.amount}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-notes">Notes (optional)</Label>
        <Input
          id="income-notes"
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Salary, freelance work, etc."
          className="border-green-300 focus-visible:ring-green-500"
        />
        {errors.notes && (
          <p className="text-sm text-red-600">{errors.notes}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
        Add Income
      </Button>
    </form>
  )
}
