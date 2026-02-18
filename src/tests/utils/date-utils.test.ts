import { describe, it, expect } from 'vitest'
import {
  parsePaymentDate,
  getDaySuffix,
  formatHumanReadableDate,
  daysBetween,
  depletionRateToPortionsPerDay,
  parseAmount,
  formatAmount,
  formatNetAmount
} from '../../utils/date-utils'

describe('parsePaymentDate', () => {
  it('parses YYYY-MM-DD format correctly', () => {
    const result = parsePaymentDate('2025-10-07')
    expect(result).toEqual({ year: 2025, month: 9, day: 7 }) // month is 0-indexed
  })

  it('parses human-readable format correctly', () => {
    const result = parsePaymentDate('January 15th, 2025')
    expect(result).toEqual({ year: 2025, month: 0, day: 15 })
  })

  it('returns null for an unparsable string', () => {
    expect(parsePaymentDate('not-a-date')).toBeNull()
  })

  it('correctly handles month boundary in YYYY-MM-DD', () => {
    const result = parsePaymentDate('2025-01-01')
    expect(result).toEqual({ year: 2025, month: 0, day: 1 })
  })

  it('parses December correctly (0-indexed month = 11)', () => {
    const result = parsePaymentDate('2025-12-31')
    expect(result).toEqual({ year: 2025, month: 11, day: 31 })
  })

})

describe('getDaySuffix', () => {
  it('returns "st" for 1', () => expect(getDaySuffix(1)).toBe('st'))
  it('returns "nd" for 2', () => expect(getDaySuffix(2)).toBe('nd'))
  it('returns "rd" for 3', () => expect(getDaySuffix(3)).toBe('rd'))
  it('returns "th" for 4+', () => expect(getDaySuffix(4)).toBe('th'))
  it('returns "th" for 11', () => expect(getDaySuffix(11)).toBe('th'))
  it('returns "th" for 20', () => expect(getDaySuffix(20)).toBe('th'))
})

describe('formatHumanReadableDate', () => {
  it('formats a date to human-readable form', () => {
    expect(formatHumanReadableDate(2025, 0, 1)).toBe('January 1st, 2025')
    expect(formatHumanReadableDate(2025, 11, 25)).toBe('December 25th, 2025')
    expect(formatHumanReadableDate(2025, 1, 2)).toBe('February 2nd, 2025')
    expect(formatHumanReadableDate(2025, 2, 3)).toBe('March 3rd, 2025')
  })
})

describe('daysBetween', () => {
  it('returns 0 for the same date', () => {
    const d = new Date('2025-06-01')
    expect(daysBetween(d, d)).toBe(0)
  })

  it('returns 7 for one week apart', () => {
    const a = new Date('2025-06-01')
    const b = new Date('2025-06-08')
    expect(daysBetween(a, b)).toBe(7)
  })

  it('returns negative for dates before', () => {
    const a = new Date('2025-06-08')
    const b = new Date('2025-06-01')
    expect(daysBetween(a, b)).toBe(-7)
  })
})

describe('depletionRateToPortionsPerDay', () => {
  it('returns rate directly for "day" unit', () => {
    expect(depletionRateToPortionsPerDay(3, 'day')).toBe(3)
  })

  it('divides by 7 for "week" unit', () => {
    expect(depletionRateToPortionsPerDay(7, 'week')).toBe(1)
  })

  it('divides by 30 for "month" unit', () => {
    expect(depletionRateToPortionsPerDay(30, 'month')).toBe(1)
  })

  it('is case-insensitive', () => {
    expect(depletionRateToPortionsPerDay(14, 'WEEK')).toBe(2)
  })
})

describe('parseAmount', () => {
  it('strips the dollar sign and parses', () => {
    expect(parseAmount('$12.50')).toBe(12.5)
  })

  it('handles amounts without dollar sign', () => {
    expect(parseAmount('9.99')).toBe(9.99)
  })

  it('handles comma-formatted amounts', () => {
    expect(parseAmount('$1,200.00')).toBe(1200)
  })

  it('returns 0 for empty/invalid input', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
  })
})

describe('formatAmount', () => {
  it('formats a number as a dollar string', () => {
    expect(formatAmount(12.5)).toBe('$12.50')
    expect(formatAmount(0)).toBe('$0.00')
    expect(formatAmount(1000)).toBe('$1000.00')
  })
})

describe('formatNetAmount', () => {
  it('formats positive net as $X.XX', () => {
    expect(formatNetAmount(100)).toBe('$100.00')
  })

  it('formats negative net as -$X.XX', () => {
    expect(formatNetAmount(-50.75)).toBe('-$50.75')
  })

  it('formats zero as $0.00', () => {
    expect(formatNetAmount(0)).toBe('$0.00')
  })
})
