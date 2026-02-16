'use client'

import { useRef, useState } from 'react'
import { createInvestment } from '@/lib/db'
import { INVESTMENT_CATEGORIES } from '@/lib/supabase/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InvestmentFormProps {
  onSuccess: () => void  // Callback after successful save
}

export function InvestmentForm({ onSuccess }: InvestmentFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get today's date in YYYY-MM-DD format for default value
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    // Parse form values
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const monthlyContributionStr = formData.get('monthly_contribution') as string
    const currentValueStr = formData.get('current_value') as string
    const purchaseDate = formData.get('purchase_date') as string
    const notes = formData.get('notes') as string

    // Parse integers
    const monthlyContribution = parseInt(monthlyContributionStr, 10)
    const currentValue = parseInt(currentValueStr, 10)

    // Basic validation
    if (!name || !category || !monthlyContribution || !currentValue || !purchaseDate) {
      setError('Please fill in all required fields')
      setIsSubmitting(false)
      return
    }

    if (isNaN(monthlyContribution) || monthlyContribution < 1) {
      setError('Monthly contribution must be at least 1')
      setIsSubmitting(false)
      return
    }

    if (isNaN(currentValue) || currentValue < 1) {
      setError('Current value must be at least 1')
      setIsSubmitting(false)
      return
    }

    try {
      await createInvestment({
        name,
        category,
        monthly_contribution: monthlyContribution,
        current_value: currentValue,
        purchase_date: purchaseDate,
        notes: notes || '',
      })

      // Reset form on success
      formRef.current?.reset()

      // Trigger callback
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save investment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Add New Investment</h2>

      <div className="space-y-2">
        <Label htmlFor="name">Investment Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="e.g., Apple Stock, Gold Bar"
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          required
        >
          {INVESTMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthly_contribution">Monthly Contribution (Rp)</Label>
        <Input
          id="monthly_contribution"
          name="monthly_contribution"
          type="number"
          inputMode="numeric"
          placeholder="0"
          min="1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="current_value">Current Value (Rp)</Label>
        <Input
          id="current_value"
          name="current_value"
          type="number"
          inputMode="numeric"
          placeholder="0"
          min="1"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchase_date">Purchase Date</Label>
        <Input
          id="purchase_date"
          name="purchase_date"
          type="date"
          defaultValue={getTodayDate()}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Additional details about this investment"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Adding...' : 'Add Investment'}
      </Button>
    </form>
  )
}
