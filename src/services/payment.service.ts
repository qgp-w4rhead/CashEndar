// Payment service for business logic and data management
import { Payment, PaymentType } from '../types/payment.types'
import { parsePaymentDate, formatHumanReadableDate, parseAmount, formatAmount, MS_PER_DAY } from '../utils/date-utils'
import type { ParsedDate } from '../utils/date-utils'

// Re-export parsePaymentDate so existing callers via paymentService.parsePaymentDate still work
export { parsePaymentDate }

// Helper: collect recurring occurrences in a date range at a fixed interval
function getRecurringOccurrencesInRange(
  payment: Payment,
  startDate: Date,
  endDate: Date,
  intervalDays: number,
  maxIterations: number
): Payment[] {
  if (!payment.referenceDate) return []

  const occurrences: Payment[] = []
  const referenceDate = new Date(payment.referenceDate)
  referenceDate.setHours(0, 0, 0, 0)

  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  let currentDate = new Date(referenceDate)
  let occurrenceCount = 0

  while (currentDate.getTime() <= end.getTime()) {
    if (currentDate.getTime() >= start.getTime()) {
      const dayOfMonth = currentDate.getDate()

      occurrences.push({
        ...payment,
        id: `${payment.id}-${occurrenceCount}`,
        date: formatHumanReadableDate(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth),
        day: dayOfMonth
      })
    }

    // Use calendar-day arithmetic (DST-safe) instead of ms addition
    currentDate = new Date(currentDate)
    currentDate.setDate(currentDate.getDate() + intervalDays)
    currentDate.setHours(0, 0, 0, 0)
    occurrenceCount++

    if (occurrenceCount > maxIterations) break
  }

  return occurrences
}

// Helper: check if a date falls on a recurring interval from a reference date
function matchesRecurringInterval(checkDate: Date, payment: Payment, intervalDays: number): { matches: boolean; occurrenceCount: number } {
  if (payment.dayOfWeek === undefined || !payment.referenceDate) {
    return { matches: false, occurrenceCount: 0 }
  }

  const dayOfWeek = checkDate.getDay()
  if (payment.dayOfWeek !== dayOfWeek) {
    return { matches: false, occurrenceCount: 0 }
  }

  const refDate = new Date(payment.referenceDate)
  refDate.setHours(0, 0, 0, 0)

  const diffTime = checkDate.getTime() - refDate.getTime()
  // Use Math.round to handle DST transitions (±1 hour won't truncate the day count)
  const diffDays = Math.round(diffTime / MS_PER_DAY)

  if (diffDays >= 0 && diffDays % intervalDays === 0) {
    return { matches: true, occurrenceCount: Math.floor(diffDays / intervalDays) }
  }

  return { matches: false, occurrenceCount: 0 }
}

// Helper: sort payments array by parsed date
function sortByDate(items: Payment[], ascending = true): Payment[] {
  return items.sort((a, b) => {
    const dateA = parsePaymentDate(a.date)
    const dateB = parsePaymentDate(b.date)

    if (!dateA || !dateB) {
      return a.date.localeCompare(b.date)
    }

    const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
    const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

    return ascending
      ? dateObjA.getTime() - dateObjB.getTime()
      : dateObjB.getTime() - dateObjA.getTime()
  })
}

export class PaymentService {
  parsePaymentDate(dateString: string): ParsedDate | null {
    return parsePaymentDate(dateString)
  }

  getNextBiMonthlyDate(referenceTimestamp: number, dayOfWeek: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const referenceDate = new Date(referenceTimestamp)
    referenceDate.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - referenceDate.getTime()
    // Use Math.round to handle DST transitions
    const diffDays = Math.round(diffTime / MS_PER_DAY)

    const twoWeeksInDays = 14
    const periodsPassed = Math.floor(diffDays / twoWeeksInDays)

    // Use calendar-day arithmetic (DST-safe) instead of ms addition
    let nextOccurrence = new Date(referenceDate)
    nextOccurrence.setDate(nextOccurrence.getDate() + ((periodsPassed + 1) * twoWeeksInDays))
    nextOccurrence.setHours(0, 0, 0, 0)

    if (nextOccurrence.getTime() < today.getTime()) {
      nextOccurrence.setDate(nextOccurrence.getDate() + twoWeeksInDays)
      nextOccurrence.setHours(0, 0, 0, 0)
    }

    return nextOccurrence
  }

  getBiMonthlyOccurrencesInRange(payment: Payment, startDate: Date, endDate: Date) {
    return getRecurringOccurrencesInRange(payment, startDate, endDate, 14, 100)
  }

  getWeeklyOccurrencesInRange(payment: Payment, startDate: Date, endDate: Date) {
    return getRecurringOccurrencesInRange(payment, startDate, endDate, 7, 200)
  }

  getPaymentsForDay(payments: Payment[], day: number, currentMonth: number, currentYear: number) {
    const checkDate = new Date(currentYear, currentMonth, day)
    checkDate.setHours(0, 0, 0, 0)

    const dayPayments: Payment[] = []

    payments.forEach(payment => {
      if (payment.frequency === 'weekly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
        const result = matchesRecurringInterval(checkDate, payment, 7)
        if (result.matches) {
          dayPayments.push({
            ...payment,
            id: `${payment.id}-${result.occurrenceCount}`,
            date: formatHumanReadableDate(currentYear, currentMonth, day),
            day: day
          })
        }
        return
      }

      if (payment.frequency === 'bi-monthly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
        const result = matchesRecurringInterval(checkDate, payment, 14)
        if (result.matches) {
          dayPayments.push({
            ...payment,
            id: `${payment.id}-${result.occurrenceCount}`,
            date: formatHumanReadableDate(currentYear, currentMonth, day),
            day: day
          })
        }
        return
      }

      if (payment.frequency === 'one-time') {
        const dateInfo = parsePaymentDate(payment.date)
        if (dateInfo) {
          const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
          if (paymentDay === day && paymentMonth === currentMonth && paymentYear === currentYear) {
            dayPayments.push(payment)
          }
        }
        return
      }

      // Handle recurring monthly payments
      if (payment.frequency === 'recurring' && payment.day === day) {
        dayPayments.push({
          ...payment,
          date: formatHumanReadableDate(currentYear, currentMonth, day),
          day: day
        })
        return
      }
    })

    return dayPayments
  }

  // Collect future payments (expenses only) in a date range
  getNextPayments(payments: Payment[], paymentTypes: PaymentType[], startDate: Date, endDate: Date) {
    const futurePayments: Payment[] = []

    payments.forEach(payment => {
      const paymentType = paymentTypes.find(type => type.value === payment.type)

      if (paymentType && paymentType.isEarning) {
        return
      }

      this._collectPaymentInRange(payment, startDate, endDate, futurePayments)
    })

    return sortByDate(futurePayments)
  }

  // Collect future earnings in a date range
  getNextEarnings(payments: Payment[], paymentTypes: PaymentType[], startDate: Date, endDate: Date) {
    const earnings: Payment[] = []

    payments.forEach(payment => {
      const paymentType = paymentTypes.find(type => type.value === payment.type)

      if (!paymentType || !paymentType.isEarning) {
        return
      }

      this._collectPaymentInRange(payment, startDate, endDate, earnings)
    })

    return sortByDate(earnings)
  }

  // Shared logic for collecting a payment's occurrences in a date range
  private _collectPaymentInRange(payment: Payment, startDate: Date, endDate: Date, target: Payment[]) {
    if (payment.frequency === 'one-time') {
      const dateInfo = parsePaymentDate(payment.date)
      if (!dateInfo) return

      const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
      const paymentDate = new Date(paymentYear, paymentMonth, paymentDay)

      if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
        target.push(payment)
      }
    } else if (payment.frequency === 'weekly') {
      target.push(...this.getWeeklyOccurrencesInRange(payment, startDate, endDate))
    } else if (payment.frequency === 'bi-monthly') {
      target.push(...this.getBiMonthlyOccurrencesInRange(payment, startDate, endDate))
    } else if (payment.frequency === 'recurring') {
      // Handle recurring monthly payments
      if (!payment.day) return

      // For recurring payments, check if the payment day falls within the date range
      // for each month in the range
      const startMonth = startDate.getMonth()
      const startYear = startDate.getFullYear()
      const endMonth = endDate.getMonth()
      const endYear = endDate.getFullYear()
      
      // Check each month in the date range
      let currentMonth = startMonth
      let currentYear = startYear
      
      while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        const paymentDate = new Date(currentYear, currentMonth, payment.day)
        
        // Check if this payment date falls within the range
        if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
          target.push({
            ...payment,
            date: formatHumanReadableDate(currentYear, currentMonth, payment.day),
            day: payment.day
          })
        }
        
        // Move to next month
        if (currentMonth === 11) {
          currentMonth = 0
          currentYear++
        } else {
          currentMonth++
        }
      }
    } else {
      // Unknown frequency - ignore
      return
    }
  }

  // Calculate total amount for payments
  calculateTotalAmount(payments: Payment[], forgoneInstances?: Set<string>) {
    return payments.reduce((sum, payment) => {
      if (forgoneInstances && forgoneInstances.has(payment.id)) {
        return sum
      }

      return sum + parseAmount(payment.amount)
    }, 0)
  }

  calculateNetDailyTotal(payments: Payment[], paymentTypes: PaymentType[], forgoneInstances?: Set<string>) {
    return payments.reduce((sum, payment) => {
      if (forgoneInstances && forgoneInstances.has(payment.id)) {
        return sum
      }

      const amount = parseAmount(payment.amount)
      const paymentType = paymentTypes.find(type => type.value === payment.type)

      if (paymentType && paymentType.isEarning) {
        return sum + amount
      } else {
        return sum - amount
      }
    }, 0)
  }

  formatTotalAmount(total: number) {
    return formatAmount(total)
  }
}

export const paymentService = new PaymentService()
