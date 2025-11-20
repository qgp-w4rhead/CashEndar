// Payment service for business logic and data management
import { Payment, Earning, PaymentType } from '../types/payment.types'
import { paymentDB } from './payment-db.service'

export class PaymentService {
  parsePaymentDate(dateString: string) {
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

  getNextBiMonthlyDate(referenceTimestamp: number, dayOfWeek: number) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const referenceDate = new Date(referenceTimestamp)
    referenceDate.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - referenceDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    const twoWeeksInDays = 14
    const periodsPassed = Math.floor(diffDays / twoWeeksInDays)

    let nextOccurrence: Date
    if (diffDays % twoWeeksInDays === 0 && diffDays >= 0) {
      nextOccurrence = new Date(referenceDate.getTime() + ((periodsPassed + 1) * twoWeeksInDays * 24 * 60 * 60 * 1000))
    } else {
      nextOccurrence = new Date(referenceDate.getTime() + ((periodsPassed + 1) * twoWeeksInDays * 24 * 60 * 60 * 1000))
    }

    if (nextOccurrence.getTime() < today.getTime()) {
      nextOccurrence = new Date(nextOccurrence.getTime() + (twoWeeksInDays * 24 * 60 * 60 * 1000))
    }

    return nextOccurrence
  }

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

    let currentDate = new Date(referenceDate)
    let occurrenceCount = 0

    while (currentDate.getTime() <= end.getTime()) {
      if (currentDate.getTime() >= start.getTime()) {
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

      currentDate = new Date(currentDate.getTime() + twoWeeksInMs)
      occurrenceCount++

      if (occurrenceCount > 100) break
    }

    return occurrences
  }

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

    let currentDate = new Date(referenceDate)
    let occurrenceCount = 0

    while (currentDate.getTime() <= end.getTime()) {
      if (currentDate.getTime() >= start.getTime()) {
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

      currentDate = new Date(currentDate.getTime() + oneWeekInMs)
      occurrenceCount++

      if (occurrenceCount > 200) break
    }

    return occurrences
  }

  private getMonthNames() {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  }

  getPaymentsForDay(payments: Payment[], day: number, currentMonth: number, currentYear: number) {
    const checkDate = new Date(currentYear, currentMonth, day)
    checkDate.setHours(0, 0, 0, 0)

    const dayPayments: Payment[] = []

    payments.forEach(payment => {
      if (payment.day === day) {
        dayPayments.push(payment)
        return
      }

      if (payment.frequency === 'weekly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
        const dayOfWeek = checkDate.getDay()

        if (payment.dayOfWeek !== dayOfWeek) {
          return
        }

        const refDate = new Date(payment.referenceDate)
        refDate.setHours(0, 0, 0, 0)

        const diffTime = checkDate.getTime() - refDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays >= 0 && diffDays % 7 === 0) {
          const occurrenceCount = Math.floor(diffDays / 7)
          const instancePayment = {
            ...payment,
            id: `${payment.id}-${occurrenceCount}`,
            date: `${this.getMonthNames()[currentMonth]} ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}, ${currentYear}`,
            day: day
          }
          dayPayments.push(instancePayment)
        }
        return
      }

      if (payment.frequency === 'bi-monthly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
        const dayOfWeek = checkDate.getDay()

        if (payment.dayOfWeek !== dayOfWeek) {
          return
        }

        const refDate = new Date(payment.referenceDate)
        refDate.setHours(0, 0, 0, 0)

        const diffTime = checkDate.getTime() - refDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays >= 0 && diffDays % 14 === 0) {
          const occurrenceCount = Math.floor(diffDays / 14)
          const instancePayment = {
            ...payment,
            id: `${payment.id}-${occurrenceCount}`,
            date: `${this.getMonthNames()[currentMonth]} ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}, ${currentYear}`,
            day: day
          }
          dayPayments.push(instancePayment)
        }
        return
      }

      if (payment.frequency === 'one-time') {
        const dateInfo = this.parsePaymentDate(payment.date)
        if (dateInfo) {
          const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
          if (paymentDay === day && paymentMonth === currentMonth && paymentYear === currentYear) {
            dayPayments.push(payment)
          }
        }
      }
    })

    return dayPayments
  }

  getNextPayments(payments: Payment[], paymentTypes: PaymentType[], startDate: Date, endDate: Date) {
    const futurePayments: Payment[] = []

    payments.forEach(payment => {
      const paymentType = paymentTypes.find(type => type.value === payment.type)

      if (paymentType && paymentType.isEarning) {
        return
      }

      if (payment.frequency === 'one-time') {
        const dateInfo = this.parsePaymentDate(payment.date)
        if (!dateInfo) return

        const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
        const paymentDate = new Date(paymentYear, paymentMonth, paymentDay)

        if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
          futurePayments.push(payment)
        }
      } else if (payment.frequency === 'weekly') {
        const occurrences = this.getWeeklyOccurrencesInRange(payment, startDate, endDate)
        futurePayments.push(...occurrences)
      } else if (payment.frequency === 'bi-monthly') {
        const occurrences = this.getBiMonthlyOccurrencesInRange(payment, startDate, endDate)
        futurePayments.push(...occurrences)
      } else {
        if (!payment.day) return

        const today = new Date()
        const currentDay = today.getDate()

        if (payment.day >= currentDay) {
          futurePayments.push(payment)
        }
      }
    })

    return futurePayments.sort((a, b) => {
      const dateA = this.parsePaymentDate(a.date)
      const dateB = this.parsePaymentDate(b.date)

      if (!dateA || !dateB) {
        return a.date.localeCompare(b.date)
      }

      const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
      const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

      return dateObjA.getTime() - dateObjB.getTime()
    })
  }

  getNextEarnings(payments: Payment[], paymentTypes: PaymentType[], startDate: Date, endDate: Date) {
    const earnings: Payment[] = []

    payments.forEach(payment => {
      const paymentType = paymentTypes.find(type => type.value === payment.type)

      if (!paymentType || !paymentType.isEarning) {
        return
      }

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
  calculateTotalAmount(payments: Payment[], forgoneInstances?: Set<string>) {
    return payments.reduce((sum, payment) => {
      // Skip forgone payment instances - they don't contribute to totals
      if (forgoneInstances && forgoneInstances.has(payment.id)) {
        return sum
      }

      const amount = parseFloat(payment.amount.replace('$', '')) || 0
      return sum + amount
    }, 0)
  }

  calculateNetDailyTotal(payments: Payment[], paymentTypes: PaymentType[], forgoneInstances?: Set<string>) {
    return payments.reduce((sum, payment) => {
      // Skip forgone payment instances - they don't contribute to the day total
      if (forgoneInstances && forgoneInstances.has(payment.id)) {
        return sum
      }

      const amount = parseFloat(payment.amount.replace('$', '')) || 0
      const paymentType = paymentTypes.find(type => type.value === payment.type)

      if (paymentType && paymentType.isEarning) {
        return sum + amount
      } else {
        return sum - amount
      }
    }, 0)
  }

  formatTotalAmount(total: number) {
    return `$${total.toFixed(2)}`
  }
}

export const paymentService = new PaymentService()
