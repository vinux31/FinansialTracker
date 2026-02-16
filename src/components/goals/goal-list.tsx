'use client'

import { useEffect, useState } from 'react'
import { getGoals } from '@/lib/db'
import type { Goal } from '@/types'
import { GoalRow } from './goal-row'

interface GoalListProps {
  onRefresh?: number // Refresh key for external updates
}

export function GoalList({ onRefresh }: GoalListProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getGoals()
        setGoals(data)
      } catch (err) {
        console.error('Failed to load goals:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [onRefresh])

  if (loading) {
    return <div className="text-gray-500">Loading goals...</div>
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-lg font-medium">No financial goals yet</p>
        <p className="text-sm mt-2">Create your first goal above to start planning!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {goals.map(goal => (
        <GoalRow key={goal.id} goal={goal} onUpdate={() => window.location.reload()} />
      ))}
    </div>
  )
}
