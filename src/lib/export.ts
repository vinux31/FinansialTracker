import Papa from 'papaparse'
import Currency from 'currency.js'
import { DatabaseTransaction, DatabaseInvestment } from '@/lib/supabase/schema'

const IDR = (value: number) => Currency(value, { precision: 0 })

export function exportFinancialData(
  transactions: DatabaseTransaction[],
  investments: DatabaseInvestment[]
): void {
  if (transactions.length === 0 && investments.length === 0) {
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
    // SUMMARY section
    ['SUMMARY'],
    ['Total Expenses', IDR(totalExpenses).format()],
    ['Total Income', IDR(totalIncome).format()],
    ['Total Investments', IDR(totalInvestments).format()]
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
