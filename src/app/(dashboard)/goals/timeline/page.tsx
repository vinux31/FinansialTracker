'use client'

import { useEffect, useState } from 'react'
import { getGoals, getGoalProgress } from '@/lib/db'
import { TimelineView } from '@/components/goals/timeline-view'
import type { Goal, ProgressEntry } from '@/types'

export default function TimelinePage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const goalsData = await getGoals()
        setGoals(goalsData)

        // Load progress for all goals
        const allProgress: ProgressEntry[] = []
        for (const goal of goalsData) {
          const progress = await getGoalProgress(goal.id)
          allProgress.push(...progress)
        }
        setProgressEntries(allProgress)
      } catch (err) {
        console.error('Failed to load timeline data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-gray-500">Loading timeline...</div>
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Goal Timeline</h1>
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium">No goals to display</p>
          <p className="text-sm mt-2">Create financial goals first to see your timeline</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Goal Timeline</h1>
        <p className="text-gray-600 mt-1">
          Monthly breakdown of savings and goal deadlines
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <TimelineView goals={goals} progressEntries={progressEntries} />
      </div>
    </div>
  )
}
