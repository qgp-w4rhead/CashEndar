// Payment service for business logic and data management
import { Payment, Earning, PaymentType } from '../types/payment.types'
import { paymentDB } from './payment-db.service'

export class PaymentService {
  // Helper function to parse payment date string
  parsePaymentDate(dateString: string) {
    // Handle format like "October 23rd, 2025"
    const parts = dateString.split(' ')
    if (parts.length >= 3) {
      const monthName = parts[0]
      const dayPart = parts[1].replace(/\D/g, '') // Remove "rd", "th", etc.
      const year = parseInt(parts[2])

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]

      const monthIndex = monthNames.indexOf(monthName)
      const day = parseInt(dayPart)

      if (monthIndex !== -1 && day && year) {
        return {
          month: monthIndex,
          day: day,
          year: year
        }
      }
    }

    // Fallback: try to parse as regular date
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

  // Helper function to get the next occurrence of a bi-monthly payment (every 2 weeks)
  getNextBiMonthlyDate(referenceTimestamp: number, dayOfWeek: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day

    const referenceDate = new Date(referenceTimestamp)
    referenceDate.setHours(0, 0, 0, 0)

    // Calculate the difference in milliseconds
    const diffTime = today.getTime() - referenceDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Calculate how many 2-week periods have passed
    const twoWeeksInDays = 14
    const periodsPassed = Math.floor(diffDays / twoWeeksInDays)

    // Calculate the next occurrence
    // If we're exactly on a payment day, calculate the one after
    let nextOccurrence: Date
    if (diffDays % twoWeeksInDays === 0 && diffDays >= 0) {
      // Today is a payment day, next one is in 2 weeks
      nextOccurrence = new Date(referenceDate.getTime() + ((periodsPassed + 1) * twoWeeksInDays * 24 * 60 * 60 * 1000))
    } else {
      // Calculate the next payment day
      nextOccurrence = new Date(referenceDate.getTime() + ((periodsPassed + 1) * twoWeeksInDays * 24 * 60 * 60 * 1000))
    }

    // If the calculated date is in the past, add 2 more weeks
    if (nextOccurrence.getTime() < today.getTime()) {
      nextOccurrence = new Date(nextOccurrence.getTime() + (twoWeeksInDays * 24 * 60 * 60 * 1000))
    }

    return nextOccurrence
  }

  // Helper function to get all bi-monthly occurrences within a date range
  getBiMonthlyOccurrencesInRange(payment: Payment, startDate: Date, endDate: Date) {
    if (!payment.referenceDate) return []

    const occurrences: Payment[] = []
    const referenceDate = new Date(payment.referenceDate)
    referenceDate.setHours(0, 0, 0, 0)

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const twoWeeksInDays = 14
    const twoWeeksInMs = twoWeeksInDays * 24 * 60 * 60 * 1000

    // Start from reference date and iterate forward
    let currentDate = new Date(referenceDate)
    let occurrenceCount = 0

    // Find all occurrences from reference date to end date
    while (currentDate.getTime() <= end.getTime()) {
      // Check if this occurrence is within our range
      if (currentDate.getTime() >= start.getTime()) {
        // Create a copy of the payment with updated date info
        const dayOfMonth = currentDate.getDate()
        const monthName = this.getMonthNames()[currentDate.getMonth()]
        const daySuffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th'

        occurrences.push({
          ...payment,
          id: `${payment.id}-${occurrenceCount}`,
          date: `${monthName} ${dayOfMonth}${daySuffix}, ${currentDate.getFullYear()}`,
          day: dayOfMonth
        })
      }

      // Move to next occurrence (2 weeks later)
      currentDate = new Date(currentDate.getTime() + twoWeeksInMs)
      occurrenceCount++

      // Safety check to prevent infinite loop
      if (occurrenceCount > 100) break
    }

    return occurrences
  }

  // Helper function to get all weekly occurrences within a date range
  getWeeklyOccurrencesInRange(payment: Payment, startDate: Date, endDate: Date) {
    if (!payment.referenceDate) return []

    const occurrences: Payment[] = []
    const referenceDate = new Date(payment.referenceDate)
    referenceDate.setHours(0, 0, 0, 0)

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const oneWeekInDays = 7
    const oneWeekInMs = oneWeekInDays * 24 * 60 * 60 * 1000

    // Start from reference date and iterate forward
    let currentDate = new Date(referenceDate)
    let occurrenceCount = 0

    // Find all occurrences from reference date to end date
    while (currentDate.getTime() <= end.getTime()) {
      // Check if this occurrence is within our range
      if (currentDate.getTime() >= start.getTime()) {
        // Create a copy of the payment with updated date info
        const dayOfMonth = currentDate.getDate()
        const monthName = this.getMonthNames()[currentDate.getMonth()]
        const daySuffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th'

        occurrences.push({
          ...payment,
          id: `${payment.id}-${occurrenceCount}`,
          date: `${monthName} ${dayOfMonth}${daySuffix}, ${currentDate.getFullYear()}`,
          day: dayOfMonth
        })
      }

      // Move to next occurrence (1 week later)
      currentDate = new Date(currentDate.getTime() + oneWeekInMs)
      occurrenceCount++

      // Safety check to prevent infinite loop
      if (occurrenceCount > 200) break
    }

    return occurrences
  }

  // Get month names array
  private getMonthNames() {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  }

  // Get all payments for a specific day, considering all frequency types
  getPaymentsForDay(payments: Payment[], day: number, currentMonth: number, currentYear: number) {
    const checkDate = new Date(currentYear, currentMonth, day)
    checkDate.setHours(0, 0, 0, 0)

    return payments.filter(payment => {
      // Check for regular payments (day-based) - recurring and one-time with day property
      if (payment.day === day) {
        return true
      }

      // Check for weekly payments (7-day interval)
      if (payment.frequency === 'weekly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
        const dayOfWeek = checkDate.getDay()

        if (payment.dayOfWeek !== dayOfWeek) {
          return false
        }

        const refDate = new Date(payment.referenceDate)
        refDate.setHours(0, 0, 0, 0)

        const diffTime = checkDate.getTime() - refDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        // Check if this date is on a 1-week interval (7 days)
        return diffDays >= 0 && diffDays % 7 === 0
      }

      // Check for bi-monthly payments (14-day interval)
      if (payment.frequency === 'bi-monthly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
        const dayOfWeek = checkDate.getDay()

        if (payment.dayOfWeek !== dayOfWeek) {
          return false
        }

        const refDate = new Date(payment.referenceDate)
        refDate.setHours(0, 0, 0, 0)

        const diffTime = checkDate.getTime() - refDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        // Check if this date is on a 2-week interval (14 days)
        return diffDays >= 0 && diffDays % 14 === 0
      }

      // Check for one-time payments by date
      if (payment.frequency === 'one-time') {
        const dateInfo = this.parsePaymentDate(payment.date)
        if (dateInfo) {
          const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
          return (
            paymentDay === day &&
            paymentMonth === currentMonth &&
            paymentYear === currentYear
          )
        }
      }

      return false
    })
  }

  // Get next payments (expenses only) within date range
  getNextPayments(payments: Payment[], paymentTypes: PaymentType[], startDate: Date, endDate: Date) {
    const futurePayments: Payment[] = []

    // Process each payment
    payments.forEach(payment => {
      // Find the payment type to check if it's an earning
      const paymentType = paymentTypes.find(type => type.value === payment.type)

      if (paymentType && paymentType.isEarning) {
        return // Skip earnings
      }

      // Handle different frequency types
      if (payment.frequency === 'one-time') {
        // For one-time payments, check if the original date is in the range
        const dateInfo = this.parsePaymentDate(payment.date)
        if (!dateInfo) return

        const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
        const paymentDate = new Date(paymentYear, paymentMonth, paymentDay)

        if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
          futurePayments.push(payment)
        }
      } else if (payment.frequency === 'weekly') {
        // For weekly payments, get all occurrences in the range
        const occurrences = this.getWeeklyOccurrencesInRange(payment, startDate, endDate)
        futurePayments.push(...occurrences)
      } else if (payment.frequency === 'bi-monthly') {
        // For bi-monthly payments, get all occurrences in the range
        const occurrences = this.getBiMonthlyOccurrencesInRange(payment, startDate, endDate)
        futurePayments.push(...occurrences)
      } else {
        // For recurring payments (monthly on same day)
        if (!payment.day) return

        // Check if this month's occurrence is in the future
        const today = new Date()
        const currentDay = today.getDate()

        if (payment.day >= currentDay) {
          futurePayments.push(payment)
        }
      }
    })

    // Sort payments by date (first to last)
    return futurePayments.sort((a, b) => {
      // Parse the date strings to compare them chronologically
      const dateA = this.parsePaymentDate(a.date)
      const dateB = this.parsePaymentDate(b.date)

      if (!dateA || !dateB) {
        // If parsing fails, fall back to string comparison
        return a.date.localeCompare(b.date)
      }

      // Create Date objects for comparison
      const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
      const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

      // Return comparison result (negative = a before b, positive = a after b)
      return dateObjA.getTime() - dateObjB.getTime()
    })
  }

  // Get next earnings within date range
  getNextEarnings(payments: Payment[], paymentTypes: PaymentType[], startDate: Date, endDate: Date) {
    const earnings: Payment[] = []

    // Process each payment
    payments.forEach(payment => {
      // Find the payment type to check if it's an earning
      const paymentType = paymentTypes.find(type => type.value === payment.type)

      if (!paymentType || !paymentType.isEarning) {
        return // Skip non-earnings
      }

      // Handle different frequency types for earnings
      if (payment.frequency === 'one-time') {
        // For one-time payments, check if the original date is in the range
        const dateInfo = this.parsePaymentDate(payment.date)
        if (!dateInfo) return

        const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
        const paymentDate = new Date(paymentYear, paymentMonth, paymentDay)

        if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
          earnings.push(payment)
        }
      } else if (payment.frequency === 'weekly') {
        // For weekly payments, get all occurrences in the range
        const occurrences = this.getWeeklyOccurrencesInRange(payment, startDate, endDate)
        earnings.push(...occurrences)
      } else if (payment.frequency === 'bi-monthly') {
        // For bi-monthly payments, get all occurrences in the range
        const occurrences = this.getBiMonthlyOccurrencesInRange(payment, startDate, endDate)
        earnings.push(...occurrences)
      } else {
        // For recurring payments (monthly on same day)
        if (!payment.day) return

        // Check if this month's occurrence is in the future
        const today = new Date()
        const currentDay = today.getDate()

        if (payment.day >= currentDay) {
          earnings.push(payment)
        }
      }
    })

    // Sort earnings by date (first to last)
    const sortedEarnings = earnings.sort((a, b) => {
      // Parse the date strings to compare them chronologically
      const dateA = this.parsePaymentDate(a.date)
      const dateB = this.parsePaymentDate(b.date)

      if (!dateA || !dateB) {
        // If parsing fails, fall back to string comparison
        return a.date.localeCompare(b.date)
      }

      // Create Date objects for comparison
      const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
      const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

      // Return comparison result (negative = a before b, positive = a after b)
      return dateObjA.getTime() - dateObjB.getTime()
    })

    return sortedEarnings
  }

  // Calculate total amount for payments
  calculateTotalAmount(payments: Payment[]) {
    return payments.reduce((sum, payment) => {
      const amount = parseFloat(payment.amount.replace('$', '')) || 0
      return sum + amount
    }, 0)
  }

  // Format total as currency string
  formatTotalAmount(total: number) {
    return `$${total.toFixed(2)}`
  }
}

// Export singleton instance
export const paymentService = new PaymentService()
