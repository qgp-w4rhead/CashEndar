// Calendar service for calendar logic and date management
import { Payment, PaymentType } from '../types/payment.types'
import { paymentService } from './payment.service'

export class CalendarService {
  private monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get calendar dates for current month
  getCalendarDates(
    payments: Payment[],
    paymentTypes: PaymentType[],
    currentMonth: number,
    currentYear: number,
    forgoneInstances?: Set<string>
  ) {
    const year = currentYear
    const month = currentMonth

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    // First day of the week (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()

    const dates = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonth = new Date(year, month, -firstDayOfWeek + i + 1)
      dates.push({
        day: prevMonth.getDate(),
        isCurrentMonth: false,
        date: prevMonth,
        hasPayment: false,
        paymentCount: 0,
        totalAmount: 0
      })
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)

      // Check for regular payments (day-based)
      let payment = payments.find(p => p.day === day)

      // If no regular payment found, check for weekly/bi-monthly payments
      if (!payment) {
        const dayOfWeek = date.getDay()

        // Check for weekly payments (7-day interval)
        payment = payments.find(p => {
          if (p.frequency !== 'weekly' || p.dayOfWeek !== dayOfWeek || !p.referenceDate) {
            return false
          }

          const refDate = new Date(p.referenceDate)
          refDate.setHours(0, 0, 0, 0)

          const checkDate = new Date(date)
          checkDate.setHours(0, 0, 0, 0)

          const diffTime = checkDate.getTime() - refDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

          // Check if this date is on a 1-week interval (7 days)
          return diffDays >= 0 && diffDays % 7 === 0
        })

        // If no weekly payment found, check for bi-monthly payments (14-day interval)
        if (!payment) {
          payment = payments.find(p => {
            if (p.frequency !== 'bi-monthly' || p.dayOfWeek !== dayOfWeek || !p.referenceDate) {
              return false
            }

            const refDate = new Date(p.referenceDate)
            refDate.setHours(0, 0, 0, 0)

            const checkDate = new Date(date)
            checkDate.setHours(0, 0, 0, 0)

            const diffTime = checkDate.getTime() - refDate.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

            // Check if this date is on a 2-week interval (14 days)
            return diffDays >= 0 && diffDays % 14 === 0
          })
        }
      }

      // Get all payments for this day
      const dayPayments = paymentService.getPaymentsForDay(payments, day, currentMonth, currentYear)
      const paymentCount = dayPayments.length
      const totalAmount = paymentService.calculateNetDailyTotal(dayPayments, paymentTypes, forgoneInstances)

      dates.push({
        day,
        isCurrentMonth: true,
        date,
        hasPayment: paymentCount > 0,
        paymentCount,
        totalAmount
      })
    }

    // Add days from next month to fill the grid (35 cells total for 5 rows)
    const remainingCells = 35 - dates.length
    for (let day = 1; day <= remainingCells && dates.length < 35; day++) {
      const nextMonth = new Date(year, month + 1, day)
      dates.push({
        day,
        isCurrentMonth: false,
        date: nextMonth,
        hasPayment: false,
        paymentCount: 0,
        totalAmount: 0
      })
    }

    return dates
  }

  // Get current month name
  getCurrentMonthName(currentMonth: number) {
    return this.monthNames[currentMonth]
  }

  // Get current month year string
  getCurrentMonthYear(currentMonth: number, currentYear: number) {
    const monthName = this.getCurrentMonthName(currentMonth)
    return `${monthName} ${currentYear}`
  }

  // Navigate to next/previous month
  navigateMonth(currentMonth: number, currentYear: number, direction: 'prev' | 'next') {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        return { month: 11, year: currentYear - 1 }
      } else {
        return { month: currentMonth - 1, year: currentYear }
      }
    } else {
      if (currentMonth === 11) {
        return { month: 0, year: currentYear + 1 }
      } else {
        return { month: currentMonth + 1, year: currentYear }
      }
    }
  }

  // Get the dominant payment type class for a specific day
  getPaymentTypeClassForDay(
    payments: Payment[],
    paymentTypes: PaymentType[],
    day: number,
    currentMonth: number,
    currentYear: number
  ) {
    // Get all payments for this day
    const dayPayments = paymentService.getPaymentsForDay(payments, day, currentMonth, currentYear)

    // If no payments for this day, return empty string
    if (dayPayments.length === 0) return ''

    // Find the dominant payment type (prioritize non-earnings, then by amount)
    const nonEarningPayments = dayPayments.filter(payment => {
      const paymentType = paymentTypes.find(type => type.value === payment.type)
      return !paymentType || !paymentType.isEarning
    })

    if (nonEarningPayments.length > 0) {
      // Return the type of the highest amount non-earning payment
      const highestPayment = nonEarningPayments.reduce((prev, current) => {
        const prevAmount = parseFloat(prev.amount.replace('$', '')) || 0
        const currentAmount = parseFloat(current.amount.replace('$', '')) || 0
        return currentAmount > prevAmount ? current : prev
      })
      return highestPayment.type
    } else {
      // If only earnings, return the type of the highest amount earning
      const highestEarning = dayPayments.reduce((prev, current) => {
        const prevAmount = parseFloat(prev.amount.replace('$', '')) || 0
        const currentAmount = parseFloat(current.amount.replace('$', '')) || 0
        return currentAmount > prevAmount ? current : prev
      })
      return highestEarning.type
    }
  }

  // Get the style for a specific day based on payment types
  getDayStyle(
    payments: Payment[],
    paymentTypes: PaymentType[],
    day: number,
    currentMonth: number,
    currentYear: number
  ) {
    const paymentTypeClass = this.getPaymentTypeClassForDay(payments, paymentTypes, day, currentMonth, currentYear)
    if (!paymentTypeClass) return {}

    // Find the payment type to get its color
    const paymentType = paymentTypes.find(type => type.value === paymentTypeClass)
    if (!paymentType) return {}

    return {
      '--payment-color': paymentType.color,
      'backgroundColor': `${paymentType.color}20`, // 20 is hex for 12.5% opacity
      'borderColor': paymentType.color,
      'color': paymentType.color
    }
  }

  // Helper function to get payment type class for styling
  getPaymentTypeClass(paymentType: string, paymentTypes: PaymentType[]) {
    const paymentTypeObj = paymentTypes.find(type => type.value === paymentType)
    return paymentTypeObj && paymentTypeObj.isEarning ? 'payment-earning' : 'payment-expense'
  }
}

// Export singleton instance
export const calendarService = new CalendarService()
