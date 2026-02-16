'use client'

import { useState } from 'react'
import type { DatabaseInvestment } from '@/lib/supabase/schema'
import { formatIDR } from '@/lib/money'
import { updateInvestment, deleteInvestment } from '@/lib/db'

interface InvestmentListProps {
  investments: DatabaseInvestment[]
  onUpdate: () => void
}

export function InvestmentList({ investments, onUpdate }: InvestmentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ current_value: '', notes: '' })
  const [isLoading, setIsLoading] = useState(false)
  if (investments.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        <p>No investments yet. Add your first investment above.</p>
      </div>
    )
  }

  // Edit handlers
  const handleEdit = (investment: DatabaseInvestment) => {
    setEditingId(investment.id)
    setEditForm({
      current_value: investment.current_value.toString(),
      notes: investment.notes,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ current_value: '', notes: '' })
  }

  const handleSaveEdit = async (id: string) => {
    setIsLoading(true)
    try {
      const currentValue = parseInt(editForm.current_value, 10)
      if (isNaN(currentValue) || currentValue <= 0) {
        alert('Please enter a valid positive number for current value')
        setIsLoading(false)
        return
      }

      await updateInvestment(id, {
        current_value: currentValue,
        notes: editForm.notes,
      })

      setEditingId(null)
      onUpdate()
    } catch (err) {
      console.error('Failed to update investment:', err)
      alert(err instanceof Error ? err.message : 'Failed to update investment')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete handler
  const handleDelete = async (investment: DatabaseInvestment) => {
    const confirmed = confirm(
      `Delete investment "${investment.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setIsLoading(true)
    try {
      await deleteInvestment(investment.id)
      onUpdate()
    } catch (err) {
      console.error('Failed to delete investment:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete investment')
    } finally {
      setIsLoading(false)
    }
  }

  // Category badge color mapping
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Saham':
        return 'bg-blue-100 text-blue-700'
      case 'Emas':
        return 'bg-yellow-100 text-yellow-700'
      case 'Reksadana':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {investments.map((investment) => {
        const isEditing = editingId === investment.id

        return (
          <div
            key={investment.id}
            className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{investment.name}</h3>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(
                    investment.category
                  )}`}
                >
                  {investment.category}
                </span>
              </div>
            </div>

            {isEditing ? (
              // Edit mode
              <div className="mt-4 space-y-3 rounded border border-blue-200 bg-blue-50 p-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Current Value (IDR)
                  </label>
                  <input
                    type="number"
                    value={editForm.current_value}
                    onChange={(e) => setEditForm({ ...editForm, current_value: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(investment.id)}
                    disabled={isLoading}
                    className="flex-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                    className="flex-1 rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Monthly Contribution:</span>
                    <span className="font-medium">{formatIDR(investment.monthly_contribution)}/month</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Value:</span>
                    <span className="text-lg font-bold text-gray-900">{formatIDR(investment.current_value)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Purchased:</span>
                    <span className="text-gray-700">{investment.purchase_date}</span>
                  </div>

                  {investment.notes && (
                    <div className="mt-3 border-t pt-2">
                      <p className="text-xs text-gray-500">{investment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex gap-3 border-t pt-3">
                  <button
                    onClick={() => handleEdit(investment)}
                    disabled={isLoading}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(investment)}
                    disabled={isLoading}
                    className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
