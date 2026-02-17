'use client'

import { useState } from 'react'
import { deleteGoal } from '@/lib/db'
import { IDR } from '@/lib/money'
import type { Goal } from '@/types'
import { GoalForm } from './goal-form'

interface GoalRowProps {
  goal: Goal
  onUpdate: () => void
}

export function GoalRow({ goal, onUpdate }: GoalRowProps) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete goal "${goal.name}"? This cannot be undone.`)) return

    try {
      setDeleting(true)
      await deleteGoal(goal.id)
      onUpdate()
    } catch (err) {
      alert('Failed to delete goal')
      setDeleting(false)
    }
  }

  // Badge color by priority
  const priorityColor = {
    High: 'bg-red-100 text-red-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-green-100 text-green-800',
  }[goal.priority]

  // Badge color by status
  const statusColor = {
    upcoming: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  }[goal.status]

  return (
    <>
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{goal.name}</h3>
              <span className={`text-xs px-2 py-1 rounded ${priorityColor}`}>
                {goal.priority}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>
                {goal.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Category: {goal.category}</p>
              <p>Target: {IDR(goal.target_amount).format()}</p>
              <p>Deadline: {new Date(goal.deadline).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              {goal.funding_notes && (
                <p className="text-xs text-gray-500 mt-2">
                  Funding: {goal.funding_notes}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-600 rounded"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-600 rounded disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Goal</h2>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <GoalForm
              goal={goal}
              onSuccess={() => {
                setEditing(false)
                onUpdate()
              }}
            />
          </div>
        </div>
      )}
    </>
  )
}
