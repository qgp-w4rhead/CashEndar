import { MONTH_NAMES_FULL, MS_PER_DAY } from './constants'

export { MS_PER_DAY }

export interface ParsedDate {
  month: number
  day: number
  year: number
}

// Parse a payment date string into components. Supports YYYY-MM-DD, "Month Day, Year", and Date() fallback.
export function parsePaymentDate(dateString: string): ParsedDate | null {
  // Handle YYYY-MM-DD format (e.g., "2025-10-07")
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return {
      month: month - 1, // Convert to 0-indexed
      day: day,
      year: year
    }
  }

  const parts = dateString.split(' ')
  if (parts.length >= 3) {
    const monthName = parts[0]
    const dayPart = parts[1].replace(/\D/g, '')
    const year = parseInt(parts[2])

    const monthIndex = MONTH_NAMES_FULL.indexOf(monthName as any)
    const day = parseInt(dayPart)

    if (monthIndex !== -1 && day && year) {
      return {
        month: monthIndex,
        day: day,
        year: year
      }
    }
  }

  const fallbackDate = new Date(dateString)
  if (!isNaN(fallbackDate.getTime())) {
    return {
      month: fallbackDate.getMonth(),
      day: fallbackDate.getDate(),
      year: fallbackDate.getFullYear()
    }
  }

  return null
}

// Get the ordinal suffix for a day number (1st, 2nd, 3rd, 4th, etc.)
export function getDaySuffix(day: number): string {
  return day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
}

// Format a date as a human-readable string (e.g., "January 1st, 2025")
export function formatHumanReadableDate(year: number, month: number, day: number): string {
  const monthName = MONTH_NAMES_FULL[month]
  const suffix = getDaySuffix(day)
  return `${monthName} ${day}${suffix}, ${year}`
}

// Calculate the number of whole days between two dates
export function daysBetween(dateA: Date, dateB: Date): number {
  const a = new Date(dateA)
  a.setHours(0, 0, 0, 0)
  const b = new Date(dateB)
  b.setHours(0, 0, 0, 0)
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY)
}

// Get a Date at midnight for today
export function todayMidnight(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

// Get current date components
export function getCurrentDateComponents() {
  const today = new Date()
  return {
    today,
    currentDay: today.getDate(),
    currentMonth: today.getMonth(),
    currentYear: today.getFullYear()
  }
}

// Convert a depletion rate to portions per day
export function depletionRateToPortionsPerDay(rate: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'day':
      return rate
    case 'week':
      return rate / 7
    case 'month':
      return rate / 30
    default:
      return rate
  }
}

// Parse a dollar-prefixed amount string to a number
export function parseAmount(amount: string): number {
  return parseFloat(amount.replace(/[$,]/g, '')) || 0
}

// Format a number as a dollar string
export function formatAmount(total: number): string {
  return `$${total.toFixed(2)}`
}

// Format a net amount (positive or negative) as a dollar string
export function formatNetAmount(netTotal: number): string {
  return netTotal >= 0 ? `$${netTotal.toFixed(2)}` : `-$${Math.abs(netTotal).toFixed(2)}`
}
