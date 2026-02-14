import { TZDate } from '@date-fns/tz'
import { format, startOfDay, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'

const TIMEZONE = 'Asia/Jakarta'

// Get current time in Jakarta timezone
export function now(): Date {
  return new TZDate(new Date(), TIMEZONE)
}

// Get today's date as YYYY-MM-DD
export function todayDateString(): string {
  return format(now(), 'yyyy-MM-dd')
}

// Get current month as YYYY-MM
export function currentMonthString(): string {
  return format(now(), 'yyyy-MM')
}

// Format a date string for display (e.g., "14 Feb 2026")
export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd MMM yyyy')
}

// Format a date string for display with time (e.g., "14 Feb 2026, 14:30")
export function formatDisplayDateTime(timestamp: string): string {
  return format(parseISO(timestamp), 'dd MMM yyyy, HH:mm')
}

// Check if a date string is today
export function isToday(dateStr: string): boolean {
  return dateStr === todayDateString()
}

// Get month string from a date (YYYY-MM)
export function getMonthFromDate(dateStr: string): string {
  return dateStr.substring(0, 7)
}

// Get all unique months from date strings, sorted descending
export function getUniqueMonths(dates: string[]): string[] {
  const months = [...new Set(dates.map(d => getMonthFromDate(d)))]
  return months.sort().reverse()
}

// Format month string for display (e.g., "February 2026")
export function formatMonth(monthStr: string): string {
  return format(parseISO(monthStr + '-01'), 'MMMM yyyy')
}
