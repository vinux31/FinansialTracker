'use client'

import { useRef, useState } from 'react'
import { upsertGoalProgress } from '@/lib/db'
import type { Goal } from '@/types'

interface ProgressModalProps {
  goal: Goal
  month: string // YYYY-MM
  onClose: () => void
  onSuccess: () => void
}

export function ProgressModal({ goal, month, onClose, onSuccess }: ProgressModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement)
      await upsertGoalProgress({
        goal_id: goal.id,
        month: month,
        planned_amount: parseInt(formData.get('planned_amount') as string),
        actual_amount: parseInt(formData.get('actual_amount') as string),
        notes: formData.get('notes') as string || '',
      })
      onSuccess()
      onClose()
    } catch (err) {
      alert('Failed to save progress')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">
          Log Progress: {goal.name}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Month: {new Date(month + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
        </p>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Planned Amount (IDR)
            </label>
            <input
              type="number"
              name="planned_amount"
              placeholder="5000000"
              required
              min="0"
              step="1"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Actual Amount (IDR)
            </label>
            <input
              type="number"
              name="actual_amount"
              placeholder="4500000"
              required
              min="0"
              step="1"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              placeholder="e.g., Saved less due to unexpected expense"
              maxLength={200}
              rows={2}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
