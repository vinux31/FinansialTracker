import { Transaction, Category, CATEGORIES } from '@/types'
import currency from 'currency.js'

// Aggregate transactions by category for a specific month
// Returns total amounts per category using currency.js for precision
export function aggregateByCategory(
  transactions: Transaction[],
  month: string
): Record<Category, number> {
  // Filter for expenses in the selected month
  const monthExpenses = transactions.filter(
    (tx) => tx.type === 'expense' && tx.date.startsWith(month)
  )

  // Initialize all categories to 0
  const totals: Record<Category, number> = {
    Makan: 0,
    Transportasi: 0,
    Rokok: 0,
    Belanja: 0,
    Lainnya: 0,
  }

  // Sum amounts per category using currency.js for accuracy
  for (const tx of monthExpenses) {
    if (tx.category in totals) {
      totals[tx.category as Category] = currency(totals[tx.category as Category])
        .add(tx.amount)
        .value
    }
  }

  return totals
}

export interface MonthlyTotals {
  month: string
  income: number
  expense: number
  net: number
}

// Aggregate transactions by month for trend analysis
// Returns array of monthly totals for the last N months
export function aggregateByMonth(
  transactions: Transaction[],
  monthCount: number
): MonthlyTotals[] {
  // Get unique months from transactions
  const monthSet = new Set<string>()
  for (const tx of transactions) {
    const month = tx.date.substring(0, 7) // YYYY-MM
    monthSet.add(month)
  }

  // Sort months descending and take the last N months
  const months = Array.from(monthSet).sort().reverse().slice(0, monthCount)

  // Calculate totals for each month
  return months.map((month) => {
    const monthTxs = transactions.filter((tx) => tx.date.startsWith(month))

    const income = monthTxs
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => currency(sum).add(tx.amount).value, 0)

    const expense = monthTxs
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => currency(sum).add(tx.amount).value, 0)

    const net = currency(income).subtract(expense).value

    return { month, income, expense, net }
  })
}
