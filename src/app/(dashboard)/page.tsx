'use client'

import { useState } from 'react'
import { TodaySummary } from '@/components/today-summary'
import { ExpenseForm } from '@/components/expense-form'

export default function TodayPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleExpenseAdded = () => {
    // Increment refresh key to trigger TodaySummary re-fetch
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <TodaySummary refreshKey={refreshKey} />
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />
    </div>
  )
}
