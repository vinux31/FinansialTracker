'use client'

import { useMemo } from 'react'
import { buildMonthlyTimeline } from '@/lib/goals/calculations'
import { IDR } from '@/lib/money'
import type { Goal, ProgressEntry } from '@/types'

interface TimelineViewProps {
  goals: Goal[]
  progressEntries: ProgressEntry[]
}

export function TimelineView({ goals, progressEntries }: TimelineViewProps) {
  const timeline = useMemo(() => {
    return buildMonthlyTimeline(goals, progressEntries, 12)
  }, [goals, progressEntries])

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-2 text-left font-semibold">Month</th>
            <th className="px-4 py-2 text-right font-semibold">Planned Savings</th>
            <th className="px-4 py-2 text-right font-semibold">Actual Savings</th>
            <th className="px-4 py-2 text-left font-semibold">Goal Events</th>
          </tr>
        </thead>
        <tbody>
          {timeline.map(month => (
            <tr key={month.month} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">
                {new Date(month.month + '-01').toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long'
                })}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {IDR(month.plannedSavings).format()}
              </td>
              <td className="px-4 py-3 text-right">
                <span className={
                  month.actualSavings >= month.plannedSavings
                    ? 'text-green-700 font-medium'
                    : 'text-red-700'
                }>
                  {IDR(month.actualSavings).format()}
                </span>
              </td>
              <td className="px-4 py-3">
                {month.goals.length > 0 ? (
                  <div className="space-y-1">
                    {month.goals.map(goal => (
                      <div key={goal.id} className="text-xs">
                        <span className="font-semibold">{goal.name}</span>
                        <span className="text-gray-600 ml-2">{IDR(goal.target_amount).format()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
