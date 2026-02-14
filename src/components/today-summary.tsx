'use client'

import { useEffect, useState } from 'react'
import { getTodayTransactions, getTodayTotal } from '@/lib/storage'
import { formatIDR } from '@/lib/money'
import { formatDisplayDateTime } from '@/lib/date'
import { Transaction } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TodaySummaryProps {
  refreshKey: number
}

export function TodaySummary({ refreshKey }: TodaySummaryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [todayDate, setTodayDate] = useState('')

  useEffect(() => {
    // Load data from localStorage (hydration guard)
    const txs = getTodayTransactions()
    const todayTotal = getTodayTotal()

    setTransactions(txs)
    setTotal(todayTotal)

    // Format today's date
    const now = new Date()
    const formatted = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now)
    setTodayDate(formatted)
  }, [refreshKey])

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-gray-600">{todayDate}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Today's Spending</p>
          <p className="text-4xl font-bold text-gray-900">{formatIDR(total)}</p>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No expenses today</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Today's Transactions</p>
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between border-l-2 border-gray-200 pl-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(tx.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                        {tx.category}
                      </span>
                    </div>
                    {tx.notes && (
                      <p className="text-sm text-gray-600 mt-1">{tx.notes}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 ml-4">
                    {formatIDR(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
