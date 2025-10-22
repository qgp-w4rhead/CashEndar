// Payment computables for computed properties and calculations
import { computed } from 'vue'
import { Payment, PaymentType } from '../types/payment.types'
import { paymentService } from '../services/payment.service'
import { calendarService } from '../services/calendar.service'
import {
  payments,
  paymentTypes,
  currentMonth,
  currentYear,
  isNextPaymentsCollapsed,
  isEarningsCollapsed
} from '../stores/ui-state.store'

// Computed property to sort payments by date (first to last)
export const sortedPayments = computed(() => {
  return [...payments.value].sort((a, b) => {
    // Parse the date strings to compare them chronologically
    const dateA = paymentService.parsePaymentDate(a.date)
    const dateB = paymentService.parsePaymentDate(b.date)

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
})

// Computed properties for calendar
export const currentMonthName = computed(() => calendarService.getCurrentMonthName(currentMonth.value))
export const currentMonthYear = computed(() => calendarService.getCurrentMonthYear(currentMonth.value, currentYear.value))

// Calendar dates computed property
export const calendarDates = computed(() => {
  return calendarService.getCalendarDates(
    payments.value,
    paymentTypes.value,
    currentMonth.value,
    currentYear.value
  )
})

// Next payments computed properties (expenses only)
export const nextPayments = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Define the range: from today to end of month
  const startDate = new Date(currentYear, currentMonth, currentDay)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  return paymentService.getNextPayments(payments.value, paymentTypes.value, startDate, endDate)
})

export const nextPaymentsTotal = computed(() => {
  const total = paymentService.calculateTotalAmount(nextPayments.value)
  return paymentService.formatTotalAmount(total)
})

export const nextPaymentsPeriod = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthName = monthNames[currentMonth]
  const year = currentYear

  return `${monthName} ${currentDay} - ${monthName} 31, ${year}`
})

// Earnings computed properties (earnings only)
export const nextEarnings = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Define the range: from today to end of month
  const startDate = new Date(currentYear, currentMonth, currentDay)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  return paymentService.getNextEarnings(payments.value, paymentTypes.value, startDate, endDate)
})

export const earningsTotal = computed(() => {
  const total = paymentService.calculateTotalAmount(nextEarnings.value)
  return paymentService.formatTotalAmount(total)
})

export const earningsPeriod = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const monthName = monthNames[currentMonth]
  const year = currentYear

  return `${monthName} ${currentDay} - ${monthName} 31, ${year}`
})

// Total summary computed property
export const totalRemainingSummary = computed(() => {
  const paymentsAmount = parseFloat(nextPaymentsTotal.value.replace(/[$,]/g, '')) || 0
  const earningsAmount = parseFloat(earningsTotal.value.replace(/[$,]/g, '')) || 0

  const netTotal = earningsAmount - paymentsAmount // earnings minus payments (money in minus money out)

  return netTotal >= 0 ? `$${netTotal.toFixed(2)}` : `-$${Math.abs(netTotal).toFixed(2)}`
})

// All payments in current month (entire month, not just from current date)
export const allMonthPayments = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Define the range: entire current month
  const startDate = new Date(currentYear, currentMonth, 1)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  return paymentService.getNextPayments(payments.value, paymentTypes.value, startDate, endDate)
})

// All earnings in current month (entire month, not just from current date)
export const allMonthEarnings = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Define the range: entire current month
  const startDate = new Date(currentYear, currentMonth, 1)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  return paymentService.getNextEarnings(payments.value, paymentTypes.value, startDate, endDate)
})

// Total amount computed property (net total: earnings minus payments for entire month)
export const totalAmount = computed(() => {
  const paymentsAmount = paymentService.calculateTotalAmount(allMonthPayments.value)
  const earningsAmount = paymentService.calculateTotalAmount(allMonthEarnings.value)

  // Net total: earnings minus payments (payments are treated as negative)
  const netTotal = earningsAmount - paymentsAmount

  return netTotal >= 0 ? `$${netTotal.toFixed(2)}` : `-$${Math.abs(netTotal).toFixed(2)}`
})

// Chart data computed properties
interface ChartSlice {
  type: string;
  label: string;
  amount: number;
  color: string;
  percentage: number;
  formattedAmount: string;
}

export const chartData = computed((): ChartSlice[] => {
  // Group only expense payments by type and calculate totals (exclude earnings)
  const typeTotals = new Map<string, number>()

  payments.value.forEach(payment => {
    // Find the payment type to check if it's an earning
    const paymentType = paymentTypes.value.find(pt => pt.value === payment.type)

    // Skip earnings (only include expenses/spending)
    if (paymentType && paymentType.isEarning) {
      return
    }

    const amount = parseFloat(payment.amount.replace('$', '')) || 0
    const currentTotal = typeTotals.get(payment.type) || 0
    typeTotals.set(payment.type, currentTotal + amount)
  })

  // Convert to chart slices
  const total = Array.from(typeTotals.values()).reduce((sum, amount) => sum + amount, 0)
  const slices: ChartSlice[] = []

  typeTotals.forEach((amount, type) => {
    const paymentType = paymentTypes.value.find(pt => pt.value === type)
    if (paymentType && amount > 0 && !paymentType.isEarning) {
      const percentage = total > 0 ? Math.round((amount / total) * 100) : 0
      slices.push({
        type,
        label: paymentType.label,
        amount,
        color: paymentType.color,
        percentage,
        formattedAmount: `$${amount.toFixed(2)}`
      })
    }
  })

  // Sort by amount (largest first)
  return slices.sort((a, b) => b.amount - a.amount)
})

export const chartTotal = computed(() => {
  const total = chartData.value.reduce((sum, slice) => sum + slice.amount, 0)
  return `$${total.toFixed(2)}`
})

export const chartPeriod = computed(() => {
  const today = new Date()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthName = monthNames[today.getMonth()]
  const year = today.getFullYear()
  return `${monthName} ${year}`
})

export const largestCategory = computed(() => {
  const largest = chartData.value[0]
  return largest ? largest.label : 'None'
})

// Helper function to get payment type class for styling
export const getPaymentTypeClass = (paymentType: string) => {
  return calendarService.getPaymentTypeClass(paymentType, paymentTypes.value)
}

// Helper function to get the dominant payment type class for a specific day
export const getPaymentTypeClassForDay = (day: number) => {
  return calendarService.getPaymentTypeClassForDay(
    payments.value,
    paymentTypes.value,
    day,
    currentMonth.value,
    currentYear.value
  )
}

// Helper function to get the style for a specific day based on payment types
export const getDayStyle = (day: number) => {
  return calendarService.getDayStyle(
    payments.value,
    paymentTypes.value,
    day,
    currentMonth.value,
    currentYear.value
  )
}

// Generate SVG path for pie chart slice
export const getSlicePath = (slice: ChartSlice, index: number): string => {
  const total = chartData.value.reduce((sum, s) => sum + s.amount, 0)
  if (total === 0) return ''

  // Calculate angles
  let currentAngle = 0
  for (let i = 0; i < index; i++) {
    currentAngle += (chartData.value[i].amount / total) * 360
  }

  const sliceAngle = (slice.amount / total) * 360
  const startAngle = currentAngle
  const endAngle = currentAngle + sliceAngle

  // Convert to radians
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  // Calculate coordinates
  const centerX = 100
  const centerY = 100
  const radius = 60

  const x1 = centerX + radius * Math.cos(startRad)
  const y1 = centerY + radius * Math.sin(startRad)
  const x2 = centerX + radius * Math.cos(endRad)
  const y2 = centerY + radius * Math.sin(endRad)

  // Create SVG path for the slice
  const largeArcFlag = sliceAngle > 180 ? 1 : 0

  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
}
