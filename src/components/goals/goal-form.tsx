'use client'

import { useRef, useState } from 'react'
import { createGoal, updateGoal } from '@/lib/db'
import { GOAL_CATEGORIES, GOAL_PRIORITIES } from '@/lib/supabase/schema'
import type { Goal } from '@/types'

interface GoalFormProps {
  goal?: Goal // If editing
  onSuccess?: () => void
}

export function GoalForm({ goal, onSuccess }: GoalFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      const data = {
        name: formData.get('name') as string,
        category: formData.get('category') as string,
        target_amount: parseInt(formData.get('target_amount') as string),
        deadline: formData.get('deadline') as string,
        priority: formData.get('priority') as string,
        funding_notes: formData.get('funding_notes') as string || '',
      }

      if (goal) {
        await updateGoal(goal.id, data)
      } else {
        await createGoal(data)
        formRef.current?.reset()
      }

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Goal Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={goal?.name}
          placeholder="e.g., Wedding, House Down Payment"
          required
          maxLength={100}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={goal?.category}
          required
          className="w-full px-3 py-2 border rounded-md"
        >
          {GOAL_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="target_amount" className="block text-sm font-medium mb-1">
          Target Amount (IDR)
        </label>
        <input
          type="number"
          id="target_amount"
          name="target_amount"
          defaultValue={goal?.target_amount}
          placeholder="100000000"
          required
          min="1"
          step="1"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium mb-1">
          Deadline
        </label>
        <input
          type="date"
          id="deadline"
          name="deadline"
          defaultValue={goal?.deadline}
          required
          min={new Date().toISOString().split('T')[0]} // Future dates only
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium mb-1">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue={goal?.priority || 'Medium'}
          required
          className="w-full px-3 py-2 border rounded-md"
        >
          {GOAL_PRIORITIES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="funding_notes" className="block text-sm font-medium mb-1">
          Funding Sources (optional)
        </label>
        <textarea
          id="funding_notes"
          name="funding_notes"
          defaultValue={goal?.funding_notes}
          placeholder="e.g., Sell reksadana Rp 77jt + monthly savings Rp 4.5jt"
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Saving...' : (goal ? 'Update Goal' : 'Create Goal')}
      </button>
    </form>
  )
}
