'use client'

import { useState } from 'react'
import { TodaySummary } from '@/components/today-summary'
import { ExpenseForm } from '@/components/expense-form'
import { KPIDashboard } from '@/components/goals/kpi-dashboard'

export default function TodayPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleExpenseAdded = () => {
    // Increment refresh key to trigger TodaySummary re-fetch
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Financial Planning Goals</h2>
        <KPIDashboard />
      </div>
      <TodaySummary refreshKey={refreshKey} />
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />
    </div>
  )
}
