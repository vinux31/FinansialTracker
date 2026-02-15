'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTransaction, deleteTransaction } from '@/lib/storage'
import { Transaction, Category, CATEGORIES } from '@/types'
import { expenseSchema, incomeSchema } from '@/lib/validation'
import { formatIDR } from '@/lib/money'

interface TransactionActionsProps {
  transaction: Transaction
  onUpdate: () => void
}

export function TransactionActions({ transaction, onUpdate }: TransactionActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: transaction.amount.toString(),
    category: transaction.category,
    notes: transaction.notes,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleDelete = () => {
    const confirmed = confirm('Are you sure you want to delete this transaction?')
    if (confirmed) {
      deleteTransaction(transaction.id)
      setIsMenuOpen(false)
      onUpdate()
    }
  }

  const handleEdit = () => {
    setIsMenuOpen(false)
    setIsEditOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate based on transaction type
    if (transaction.type === 'expense') {
      const result = expenseSchema.safeParse({
        amount: formData.amount,
        category: formData.category,
        notes: formData.notes,
      })

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

      // Update expense
      updateTransaction(transaction.id, {
        amount: result.data.amount,
        category: result.data.category,
        notes: result.data.notes,
      })
    } else {
      // Income validation
      const result = incomeSchema.safeParse({
        amount: formData.amount,
        notes: formData.notes,
      })

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

      // Update income
      updateTransaction(transaction.id, {
        amount: result.data.amount,
        notes: result.data.notes,
      })
    }

    setIsEditOpen(false)
    onUpdate()
  }

  const handleCancel = () => {
    setIsEditOpen(false)
    // Reset form data to original values
    setFormData({
      amount: transaction.amount.toString(),
      category: transaction.category,
      notes: transaction.notes,
    })
    setErrors({})
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Three-dot menu button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none px-2 py-1 text-lg font-bold"
        aria-label="Transaction actions"
      >
        ⋮
      </button>

      {/* Menu dropdown */}
      {isMenuOpen && (
        <div className="absolute right-0 top-8 z-10 w-32 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            <button
              onClick={handleEdit}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Edit modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Transaction type (read-only) */}
            <div>
              <Label>Type</Label>
              <p className="text-sm text-gray-700 font-medium capitalize mt-1">
                {transaction.type}
              </p>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Amount (IDR)</Label>
              <Input
                id="amount"
                type="text"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="50000"
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-600 mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Category (only for expenses) */}
            {transaction.type === 'expense' && (
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                  className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    errors.category ? 'border-red-500' : ''
                  }`}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-sm text-red-600 mt-1">{errors.category}</p>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes..."
                className={errors.notes ? 'border-red-500' : ''}
              />
              {errors.notes && (
                <p className="text-sm text-red-600 mt-1">{errors.notes}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
