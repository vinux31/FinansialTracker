'use client'

import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Category } from '@/types'
import { CATEGORY_COLORS } from '@/lib/constants'
import { formatIDR } from '@/lib/money'

interface CategoryBreakdownProps {
  data: Record<Category, number>
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  // Convert data to array format for Recharts
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0) // Only show categories with expenses
    .map(([name, value]) => ({
      name,
      value,
    }))

  // Check if there's any data to display
  const hasData = chartData.length > 0

  if (!hasData) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No expenses yet</p>
          <p className="mt-2 text-sm">Start by adding an expense!</p>
        </div>
      </div>
    )
  }

  // Custom label to show percentage
  const renderLabel = (entry: any) => {
    const total = chartData.reduce((sum, item) => sum + item.value, 0)
    const percent = ((entry.value / total) * 100).toFixed(1)
    return `${percent}%`
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={renderLabel}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={CATEGORY_COLORS[entry.name as Category]}
            />
          ))}
        </Pie>
        <Legend
          formatter={(value) => {
            const item = chartData.find((d) => d.name === value)
            return `${value} - ${formatIDR(item?.value || 0)}`
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
