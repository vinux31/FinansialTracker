import Papa from 'papaparse'
import Currency from 'currency.js'
import { DatabaseInvestment } from '@/lib/supabase/schema'
import type { Transaction, Goal, ProgressEntry } from '@/types'

const IDR = (value: number) => Currency(value, { precision: 0 })

export function exportFinancialData(
  transactions: Transaction[],
  investments: DatabaseInvestment[],
  goals: Goal[],
  progressEntries: ProgressEntry[]
): void {
  if (transactions.length === 0 && investments.length === 0 && goals.length === 0) {
    alert('No data to export')
    return
  }

  // Calculate totals
  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalInvestments = investments
    .reduce((sum, inv) => sum + inv.current_value, 0)

  const totalGoalTargets = goals
    .reduce((sum, goal) => sum + goal.target_amount, 0)

  // Build CSV data with sections
  const exportData: any[] = [
    // TRANSACTIONS section
    ['TRANSACTIONS'],
    ['Date', 'Type', 'Amount (IDR)', 'Category', 'Notes'],
    ...transactions.map(tx => [
      tx.date,
      tx.type,
      tx.amount,
      tx.category,
      tx.notes || ''
    ]),
    [],
    // INVESTMENTS section
    ['INVESTMENTS'],
    ['Name', 'Category', 'Monthly Contribution (IDR)', 'Current Value (IDR)', 'Purchase Date', 'Notes'],
    ...investments.map(inv => [
      inv.name,
      inv.category,
      inv.monthly_contribution,
      inv.current_value,
      inv.purchase_date,
      inv.notes || ''
    ]),
    [],
    // GOALS section
    ['GOALS'],
    ['Name', 'Category', 'Target Amount', 'Deadline', 'Priority', 'Status', 'Funding Notes'],
    ...goals.map(goal => [
      goal.name,
      goal.category,
      goal.target_amount,
      goal.deadline,
      goal.priority,
      goal.status,
      goal.funding_notes
    ]),
    [],
    // GOAL PROGRESS section
    ['GOAL PROGRESS'],
    ['Goal Name', 'Month', 'Planned Amount', 'Actual Amount', 'Notes'],
    ...(() => {
      // Map goal IDs to names for readability
      const goalNames = new Map(goals.map(g => [g.id, g.name]))
      return progressEntries.map(entry => [
        goalNames.get(entry.goal_id) || 'Unknown Goal',
        entry.month,
        entry.planned_amount,
        entry.actual_amount,
        entry.notes
      ])
    })(),
    [],
    // SUMMARY section
    ['SUMMARY'],
    ['Total Expenses', IDR(totalExpenses).format()],
    ['Total Income', IDR(totalIncome).format()],
    ['Total Investments', IDR(totalInvestments).format()],
    ['Total Goal Targets', IDR(totalGoalTargets).format()]
  ]

  const csv = Papa.unparse(exportData)

  // Add BOM for Excel compatibility with Indonesian characters
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `finansial-export-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
