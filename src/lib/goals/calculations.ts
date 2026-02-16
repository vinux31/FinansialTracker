import currency from 'currency.js'
import type { Goal, ProgressEntry } from '@/types'

/**
 * Calculate total saved amount for a goal from progress entries
 */
export function calculateGoalProgress(
  goal: Goal,
  progressEntries: ProgressEntry[]
): {
  totalSaved: number
  percentComplete: number
  monthsRemaining: number
} {
  const entries = progressEntries.filter(e => e.goal_id === goal.id)

  // Sum all actual amounts
  let totalSaved = 0
  for (const entry of entries) {
    totalSaved = currency(totalSaved).add(entry.actual_amount).intValue
  }

  // Calculate percentage
  const percentComplete = goal.target_amount > 0
    ? Math.min(100, Math.round((totalSaved / goal.target_amount) * 100))
    : 0

  // Calculate months remaining
  const deadlineDate = new Date(goal.deadline)
  const today = new Date()
  const monthsRemaining = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)))

  return { totalSaved, percentComplete, monthsRemaining }
}

/**
 * Calculate overall savings rate from goals and income
 */
export function calculateSavingsRate(
  goals: Goal[],
  progressEntries: ProgressEntry[],
  monthlyIncome: number
): number {
  if (monthlyIncome === 0) return 0

  // Sum all planned amounts for current month
  const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
  const monthEntries = progressEntries.filter(e => e.month === currentMonth)

  let totalPlanned = 0
  for (const entry of monthEntries) {
    totalPlanned = currency(totalPlanned).add(entry.planned_amount).intValue
  }

  return monthlyIncome > 0
    ? Math.round((totalPlanned / monthlyIncome) * 100)
    : 0
}

/**
 * Generate monthly timeline data structure
 */
export function buildMonthlyTimeline(
  goals: Goal[],
  progressEntries: ProgressEntry[],
  monthCount: number = 12
): Array<{
  month: string // YYYY-MM
  goals: Goal[] // Goals with deadline in this month
  plannedSavings: number
  actualSavings: number
}> {
  const timeline: Record<string, {
    month: string
    goals: Goal[]
    plannedSavings: number
    actualSavings: number
  }> = {}

  // Initialize months from today forward
  const today = new Date()
  for (let i = 0; i < monthCount; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const monthStr = date.toISOString().substring(0, 7)
    timeline[monthStr] = {
      month: monthStr,
      goals: [],
      plannedSavings: 0,
      actualSavings: 0,
    }
  }

  // Map goals to deadline months
  for (const goal of goals) {
    const goalMonth = goal.deadline.substring(0, 7) // Extract YYYY-MM
    if (timeline[goalMonth]) {
      timeline[goalMonth].goals.push(goal)
    }
  }

  // Aggregate progress entries
  for (const entry of progressEntries) {
    if (timeline[entry.month]) {
      timeline[entry.month].plannedSavings = currency(timeline[entry.month].plannedSavings)
        .add(entry.planned_amount)
        .intValue
      timeline[entry.month].actualSavings = currency(timeline[entry.month].actualSavings)
        .add(entry.actual_amount)
        .intValue
    }
  }

  return Object.values(timeline).sort((a, b) => a.month.localeCompare(b.month))
}
