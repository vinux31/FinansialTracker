'use client'

import { useEffect, useState } from 'react'
import { getGoals, getGoalProgress } from '@/lib/db'
import { calculateGoalProgress } from '@/lib/goals/calculations'
import { getTimelineRisk } from '@/lib/goals/status'
import { RiskIndicator } from './risk-indicator'
import type { Goal, ProgressEntry } from '@/types'

export function KPIDashboard() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const goalsData = await getGoals()
        setGoals(goalsData)

        const allProgress: ProgressEntry[] = []
        for (const goal of goalsData) {
          const progress = await getGoalProgress(goal.id)
          allProgress.push(...progress)
        }
        setProgressEntries(allProgress)
      } catch (err) {
        console.error('Failed to load KPI data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading goal metrics...</div>
  }

  if (goals.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800">
          Create financial goals to see your progress metrics
        </p>
      </div>
    )
  }

  // Calculate metrics
  const totalGoals = goals.length
  const completedGoals = goals.filter(g => {
    const { totalSaved } = calculateGoalProgress(g, progressEntries)
    return totalSaved >= g.target_amount
  }).length

  const overallProgress = goals.reduce((sum, goal) => {
    const { percentComplete } = calculateGoalProgress(goal, progressEntries)
    return sum + percentComplete
  }, 0) / totalGoals

  // Timeline adherence (count of on-track goals)
  const onTrackGoals = goals.filter(g => {
    const { totalSaved } = calculateGoalProgress(g, progressEntries)
    const risk = getTimelineRisk(g, totalSaved)
    return risk === 'LOW'
  }).length

  const adherencePercent = Math.round((onTrackGoals / totalGoals) * 100)

  // Determine overall timeline risk
  const timelineRisk: 'LOW' | 'MEDIUM' | 'HIGH' =
    adherencePercent >= 70 ? 'LOW' :
    adherencePercent >= 40 ? 'MEDIUM' : 'HIGH'

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Goal Progress KPI */}
      <div className="bg-white border rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Goal Progress</div>
        <div className="text-2xl font-bold mb-2">
          {Math.round(overallProgress)}%
        </div>
        <div className="text-xs text-gray-500">
          {completedGoals} of {totalGoals} goals completed
        </div>
      </div>

      {/* Timeline Adherence KPI */}
      <div className="bg-white border rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Timeline Adherence</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold">{adherencePercent}%</span>
          <RiskIndicator level={timelineRisk} />
        </div>
        <div className="text-xs text-gray-500">
          {onTrackGoals} of {totalGoals} goals on track
        </div>
      </div>

      {/* Active Goals KPI */}
      <div className="bg-white border rounded-lg p-4">
        <div className="text-sm text-gray-600 mb-1">Active Goals</div>
        <div className="text-2xl font-bold mb-2">{totalGoals}</div>
        <div className="text-xs text-gray-500">
          {goals.filter(g => g.status === 'in-progress').length} in progress
        </div>
      </div>
    </div>
  )
}
