'use client'

import { useState } from 'react'
import { GoalForm } from '@/components/goals/goal-form'
import { GoalList } from '@/components/goals/goal-list'

export default function GoalsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleGoalCreated = () => {
    setRefreshKey(prev => prev + 1) // Trigger list refresh
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Financial Goals</h1>
        <p className="text-gray-600 mt-1">
          Plan and track your financial goals with target amounts and deadlines
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create goal form - left column on desktop */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Create Goal</h2>
            <GoalForm onSuccess={handleGoalCreated} />
          </div>
        </div>

        {/* Goal list - right 2 columns on desktop */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Your Goals</h2>
          <GoalList onRefresh={refreshKey} />
        </div>
      </div>
    </div>
  )
}
