'use client'

import { useMemo } from 'react'
import Currency from 'currency.js'
import type { DatabaseInvestment } from '@/lib/supabase/schema'

export interface CategoryMetrics {
  count: number
  totalValue: number
  totalContributed: number
  totalGain: number
}

export interface PortfolioMetrics {
  totalContributed: number
  totalValue: number
  totalGain: number
  gainPercent: number
  byCategory: Record<string, CategoryMetrics>
}

export function usePortfolioMetrics(investments: DatabaseInvestment[]): PortfolioMetrics {
  return useMemo(() => {
    // Initialize totals
    let totalValue = 0
    let totalContributed = 0

    // Initialize category buckets
    const byCategory: Record<string, CategoryMetrics> = {
      Saham: { count: 0, totalValue: 0, totalContributed: 0, totalGain: 0 },
      Emas: { count: 0, totalValue: 0, totalContributed: 0, totalGain: 0 },
      Reksadana: { count: 0, totalValue: 0, totalContributed: 0, totalGain: 0 },
    }

    // Aggregate all investments
    for (const inv of investments) {
      // Add to overall totals using currency.js
      totalValue = new Currency(totalValue).add(inv.current_value).intValue
      totalContributed = new Currency(totalContributed).add(inv.monthly_contribution).intValue

      // Add to category bucket
      const category = inv.category
      if (category in byCategory) {
        byCategory[category].count++
        byCategory[category].totalValue = new Currency(byCategory[category].totalValue)
          .add(inv.current_value).intValue
        byCategory[category].totalContributed = new Currency(byCategory[category].totalContributed)
          .add(inv.monthly_contribution).intValue
      }
    }

    // Calculate gains
    const totalGain = new Currency(totalValue).subtract(totalContributed).intValue
    const gainPercent = totalContributed > 0 ? (totalGain / totalContributed) * 100 : 0

    // Calculate category gains
    for (const category in byCategory) {
      const metrics = byCategory[category]
      metrics.totalGain = new Currency(metrics.totalValue).subtract(metrics.totalContributed).intValue
    }

    return {
      totalContributed,
      totalValue,
      totalGain,
      gainPercent,
      byCategory,
    }
  }, [investments])
}
