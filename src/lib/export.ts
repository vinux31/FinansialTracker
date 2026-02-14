import Papa from 'papaparse'
import { getTransactions } from '@/lib/storage'
import { formatIDR } from '@/lib/money'

export function exportTransactionsCSV(): void {
  const transactions = getTransactions()

  if (transactions.length === 0) {
    alert('No transactions to export')
    return
  }

  // Map to human-readable format
  const rows = transactions.map(tx => ({
    Date: tx.date,
    Time: tx.timestamp,
    Type: tx.type,
    Category: tx.category,
    Amount: tx.amount,
    'Amount (Formatted)': formatIDR(tx.amount),
    Notes: tx.notes,
  }))

  const csv = Papa.unparse(rows, {
    header: true,
  })

  // Add BOM for Excel compatibility with Indonesian characters
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `finance-tracker-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
