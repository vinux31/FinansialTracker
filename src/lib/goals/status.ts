import { isBefore, isToday, parseISO } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import type { Goal, ProgressEntry } from '@/types'

const TIMEZONE = 'Asia/Jakarta'

export type GoalStatus = 'upcoming' | 'in-progress' | 'completed' | 'overdue'

/**
 * Infer goal status from deadline and progress data
 */
export function inferGoalStatus(
  goal: Goal,
  totalSavedAmount: number
): GoalStatus {
  const today = new TZDate(new Date(), TIMEZONE)
  const deadline = parseISO(goal.deadline)

  // Completed takes priority
  if (totalSavedAmount >= goal.target_amount) {
    return 'completed'
  }

  // Check if deadline passed
  const isDeadlinePassed = isBefore(deadline, today) && !isToday(deadline)
  if (isDeadlinePassed) {
    return 'overdue'
  }

  // In future: upcoming if no progress, in-progress if started saving
  return totalSavedAmount > 0 ? 'in-progress' : 'upcoming'
}

/**
 * Get goal status with user override support
 */
export function getGoalStatus(
  goal: Goal,
  totalSavedAmount: number
): GoalStatus {
  // User override takes precedence
  if (goal.status_override) {
    return goal.status_override as GoalStatus
  }

  // Otherwise, infer from data
  return inferGoalStatus(goal, totalSavedAmount)
}

/**
 * Calculate timeline adherence risk level
 */
export function getTimelineRisk(
  goal: Goal,
  totalSavedAmount: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
  const { target_amount, deadline } = goal
  const today = new TZDate(new Date(), TIMEZONE)
  const deadlineDate = parseISO(deadline)

  // Months remaining
  const monthsRemaining = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)))

  // Progress percentage
  const progressPercent = target_amount > 0
    ? (totalSavedAmount / target_amount) * 100
    : 0

  // Expected progress if saving evenly
  const totalMonths = Math.max(1, Math.ceil((deadlineDate.getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)))
  const elapsedMonths = totalMonths - monthsRemaining
  const expectedProgress = totalMonths > 0
    ? (elapsedMonths / totalMonths) * 100
    : 0

  // Risk determination
  if (progressPercent >= expectedProgress * 0.9) {
    return 'LOW' // On track or ahead
  } else if (progressPercent >= expectedProgress * 0.6) {
    return 'MEDIUM' // Somewhat behind
  } else {
    return 'HIGH' // Significantly behind
  }
}
