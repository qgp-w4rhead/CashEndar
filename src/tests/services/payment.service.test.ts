import { describe, it, expect } from 'vitest'
import { PaymentService } from '../../services/payment.service'
import type { Payment, PaymentType } from '../../types/payment.types'

const svc = new PaymentService()

// --- Fixtures ---

const makePayment = (overrides: Partial<Payment> = {}): Payment => ({
  id: '1',
  title: 'Test',
  amount: '$100.00',
  date: 'January 15th, 2025',
  type: 'rent',
  frequency: 'recurring',
  day: 15,
  ...overrides
})

const earningType: PaymentType = { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
const expenseType: PaymentType = { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false }

// --- parsePaymentDate ---

describe('PaymentService.parsePaymentDate', () => {
  it('parses YYYY-MM-DD correctly', () => {
    const result = svc.parsePaymentDate('2025-03-10')
    expect(result).toEqual({ year: 2025, month: 2, day: 10 })
  })

  it('parses "Month Day, Year" correctly', () => {
    const result = svc.parsePaymentDate('March 10th, 2025')
    expect(result).toEqual({ year: 2025, month: 2, day: 10 })
  })

  it('returns null for garbage input', () => {
    expect(svc.parsePaymentDate('not a date')).toBeNull()
  })
})

// --- calculateTotalAmount ---

describe('PaymentService.calculateTotalAmount', () => {
  it('sums all payment amounts', () => {
    const payments = [makePayment({ amount: '$50.00' }), makePayment({ amount: '$30.00' })]
    expect(svc.calculateTotalAmount(payments)).toBe(80)
  })

  it('skips forgone instances', () => {
    const payments = [
      makePayment({ id: 'a', amount: '$50.00' }),
      makePayment({ id: 'b', amount: '$30.00' })
    ]
    const forgone = new Set(['b'])
    expect(svc.calculateTotalAmount(payments, forgone)).toBe(50)
  })

  it('returns 0 for empty list', () => {
    expect(svc.calculateTotalAmount([])).toBe(0)
  })
})

// --- calculateNetDailyTotal ---

describe('PaymentService.calculateNetDailyTotal', () => {
  it('adds earnings and subtracts expenses', () => {
    const payments = [
      makePayment({ id: 'a', amount: '$200.00', type: 'earnings' }),
      makePayment({ id: 'b', amount: '$100.00', type: 'rent' })
    ]
    const types = [earningType, expenseType]
    expect(svc.calculateNetDailyTotal(payments, types)).toBe(100) // 200 - 100
  })

  it('returns negative when expenses exceed earnings', () => {
    const payments = [makePayment({ id: 'a', amount: '$50.00', type: 'rent' })]
    expect(svc.calculateNetDailyTotal(payments, [expenseType])).toBe(-50)
  })

  it('skips forgone instances', () => {
    const payments = [
      makePayment({ id: 'a', amount: '$100.00', type: 'rent' }),
      makePayment({ id: 'b', amount: '$50.00', type: 'rent' })
    ]
    const forgone = new Set(['b'])
    expect(svc.calculateNetDailyTotal(payments, [expenseType], forgone)).toBe(-100)
  })
})

// --- getPaymentsForDay (one-time) ---

describe('PaymentService.getPaymentsForDay - one-time', () => {
  it('returns a one-time payment that falls on the queried day', () => {
    const payment = makePayment({ frequency: 'one-time', date: '2025-03-10', day: undefined })
    const results = svc.getPaymentsForDay([payment], 10, 2, 2025)
    expect(results).toHaveLength(1)
  })

  it('does NOT return a one-time payment on a different day', () => {
    const payment = makePayment({ frequency: 'one-time', date: '2025-03-10', day: undefined })
    const results = svc.getPaymentsForDay([payment], 15, 2, 2025)
    expect(results).toHaveLength(0)
  })

  it('does NOT return a one-time payment in a different month', () => {
    const payment = makePayment({ frequency: 'one-time', date: '2025-03-10', day: undefined })
    const results = svc.getPaymentsForDay([payment], 10, 4, 2025) // May
    expect(results).toHaveLength(0)
  })
})

// --- getPaymentsForDay (recurring by day) ---

describe('PaymentService.getPaymentsForDay - recurring', () => {
  it('returns a recurring payment whose day matches', () => {
    const payment = makePayment({ frequency: 'recurring', day: 10 })
    const results = svc.getPaymentsForDay([payment], 10, 2, 2025)
    expect(results).toHaveLength(1)
  })

  it('does NOT return a recurring payment on a different day', () => {
    const payment = makePayment({ frequency: 'recurring', day: 10 })
    const results = svc.getPaymentsForDay([payment], 15, 2, 2025)
    expect(results).toHaveLength(0)
  })
})

// --- getPaymentsForDay (weekly) ---

describe('PaymentService.getPaymentsForDay - weekly', () => {
  it('returns a weekly payment on its recurrence day', () => {
    // Monday 2025-06-02 is the reference date (local time to avoid timezone shift)
    const refDate = new Date(2025, 5, 2)
    const payment = makePayment({
      frequency: 'weekly',
      day: undefined,
      dayOfWeek: 1, // Monday
      referenceDate: refDate.getTime()
    })

    // 2025-06-09 is 7 days later (also Monday)
    const results = svc.getPaymentsForDay([payment], 9, 5, 2025) // June 9
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('1-1')
  })

  it('does NOT return a weekly payment on a non-occurrence day', () => {
    const refDate = new Date(2025, 5, 2) // Monday, local time
    const payment = makePayment({
      frequency: 'weekly',
      day: undefined,
      dayOfWeek: 1,
      referenceDate: refDate.getTime()
    })

    // June 10 is Tuesday — no match
    const results = svc.getPaymentsForDay([payment], 10, 5, 2025)
    expect(results).toHaveLength(0)
  })
})

// --- getNextPayments / getNextEarnings range filtering ---

describe('PaymentService.getNextPayments', () => {
  it('excludes earnings from next payments', () => {
    const earning = makePayment({ id: '2', type: 'earnings', frequency: 'one-time', date: '2025-06-10', day: undefined })
    const start = new Date('2025-06-01')
    const end = new Date('2025-06-30')
    const results = svc.getNextPayments([earning], [earningType], start, end)
    expect(results).toHaveLength(0)
  })

  it('includes expenses in next payments', () => {
    const expense = makePayment({ id: '1', type: 'rent', frequency: 'one-time', date: '2025-06-10', day: undefined })
    const start = new Date('2025-06-01')
    const end = new Date('2025-06-30')
    const results = svc.getNextPayments([expense], [expenseType], start, end)
    expect(results).toHaveLength(1)
  })

  it('returns results sorted by date ascending', () => {
    const p1 = makePayment({ id: '1', frequency: 'one-time', date: '2025-06-20', day: undefined })
    const p2 = makePayment({ id: '2', frequency: 'one-time', date: '2025-06-05', day: undefined })
    const start = new Date('2025-06-01')
    const end = new Date('2025-06-30')
    const results = svc.getNextPayments([p1, p2], [expenseType], start, end)
    expect(results[0].id).toBe('2')
    expect(results[1].id).toBe('1')
  })
})

describe('PaymentService.getNextEarnings', () => {
  it('includes only earnings', () => {
    const earning = makePayment({ id: '2', type: 'earnings', frequency: 'one-time', date: '2025-06-10', day: undefined })
    const expense = makePayment({ id: '1', type: 'rent', frequency: 'one-time', date: '2025-06-10', day: undefined })
    const start = new Date('2025-06-01')
    const end = new Date('2025-06-30')
    const results = svc.getNextEarnings([earning, expense], [earningType, expenseType], start, end)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('2')
  })
})

// --- Weekly occurrences in range ---

describe('PaymentService.getWeeklyOccurrencesInRange', () => {
  it('returns one occurrence per week in range', () => {
    const refDate = new Date(2025, 5, 2) // Monday, local time
    const payment = makePayment({
      frequency: 'weekly',
      dayOfWeek: 1,
      referenceDate: refDate.getTime()
    })
    const start = new Date(2025, 5, 1)
    const end = new Date(2025, 5, 30)
    const results = svc.getWeeklyOccurrencesInRange(payment, start, end)
    // Mondays in June: 2, 9, 16, 23, 30 = 5
    expect(results).toHaveLength(5)
  })
})

// --- Bi-monthly occurrences in range ---

describe('PaymentService.getBiMonthlyOccurrencesInRange', () => {
  it('returns one occurrence per 2 weeks in range', () => {
    const refDate = new Date(2025, 5, 2) // Monday, local time
    const payment = makePayment({
      frequency: 'bi-monthly',
      dayOfWeek: 1,
      referenceDate: refDate.getTime()
    })
    const start = new Date(2025, 5, 1)
    const end = new Date(2025, 5, 30)
    const results = svc.getBiMonthlyOccurrencesInRange(payment, start, end)
    // Jun 2, Jun 16, Jun 30 = 3 occurrences (every 14 days)
    expect(results).toHaveLength(3)
  })
})

// --- DST-crossing regression tests ---
// US DST 2026 starts March 8 (spring forward). A reference date before DST
// must still produce correct future occurrences after the clock change.

describe('Weekly payment across DST boundary (March 2026)', () => {
  it('getPaymentsForDay matches March 12 when ref is March 5', () => {
    // March 5, 2026 is a Thursday (before DST)
    const refDate = new Date(2026, 2, 5) // month 2 = March
    const payment = makePayment({
      frequency: 'weekly',
      day: undefined,
      dayOfWeek: refDate.getDay(), // Thursday = 4
      referenceDate: refDate.getTime()
    })

    // March 12, 2026 is the next Thursday (after DST spring-forward on March 8)
    const results = svc.getPaymentsForDay([payment], 12, 2, 2026)
    expect(results).toHaveLength(1)
  })

  it('getWeeklyOccurrencesInRange spans DST correctly', () => {
    const refDate = new Date(2026, 2, 5) // Thursday March 5
    const payment = makePayment({
      frequency: 'weekly',
      day: undefined,
      dayOfWeek: refDate.getDay(),
      referenceDate: refDate.getTime()
    })
    const start = new Date(2026, 2, 1)
    const end = new Date(2026, 2, 31)
    const results = svc.getWeeklyOccurrencesInRange(payment, start, end)
    // Thursdays in March 2026: 5, 12, 19, 26 = 4
    expect(results).toHaveLength(4)
  })
})

describe('Bi-monthly payment across DST boundary (March 2026)', () => {
  it('getPaymentsForDay matches March 19 when ref is March 5', () => {
    const refDate = new Date(2026, 2, 5)
    const payment = makePayment({
      frequency: 'bi-monthly',
      day: undefined,
      dayOfWeek: refDate.getDay(),
      referenceDate: refDate.getTime()
    })

    // 14 days after March 5 = March 19 (crosses DST)
    const results = svc.getPaymentsForDay([payment], 19, 2, 2026)
    expect(results).toHaveLength(1)
  })

  it('getBiMonthlyOccurrencesInRange spans DST correctly', () => {
    const refDate = new Date(2026, 2, 5)
    const payment = makePayment({
      frequency: 'bi-monthly',
      day: undefined,
      dayOfWeek: refDate.getDay(),
      referenceDate: refDate.getTime()
    })
    const start = new Date(2026, 2, 1)
    const end = new Date(2026, 2, 31)
    const results = svc.getBiMonthlyOccurrencesInRange(payment, start, end)
    // March 5, March 19 = 2 occurrences
    expect(results).toHaveLength(2)
  })
})
