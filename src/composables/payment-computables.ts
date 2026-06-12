// Payment computables for computed properties and calculations
import { computed, ref } from 'vue'
import { Payment, PaymentType } from '../types/payment.types'
import { paymentService } from '../services/payment.service'
import { calendarService } from '../services/calendar.service'
import {
  payments,
  paymentTypes,
  currentMonth,
  currentYear,
  isNextPaymentsCollapsed,
  isEarningsCollapsed,
  forgoneInstances,
  sortMode,
  showEarningsInNextPayments,
  selectedPaymentTypes,
  isFilteringEnabled,
  calendarViewMode,
  currentWeekStart
} from '../stores/ui-state.store'
import { MONTH_NAMES_FULL, MONTH_NAMES_SHORT } from '../utils/constants'
import { getCurrentDateComponents, parsePaymentDate, parseAmount, formatNetAmount, depletionRateToPortionsPerDay, todayMidnight } from '../utils/date-utils'
import { aliasLookup } from '../stores/catalog.store'
import { resolveCanonicalName } from '../services/alias.service'

// Resolve any stored itemName (legacy free text, receipt alias…) to its
// canonical catalog name so groupings survive name variations
export const canonicalItemName = (name?: string): string => {
  return name ? resolveCanonicalName(name, aliasLookup.value) : ''
}

export const isSameItemName = (a?: string, b?: string): boolean => {
  return !!a && !!b && canonicalItemName(a) === canonicalItemName(b)
}

// Computed property to sort and filter payments based on current sort mode and filter settings, excluding inventory items
export const sortedPayments = computed(() => {
  return [...payments.value]
    .filter(payment => {
      // Exclude inventory items
      if (payment.type === 'inventory') return false

      // If filtering is disabled, show all payments (except inventory)
      if (!isFilteringEnabled.value) return true

      // Filter by earnings vs payments
      const paymentType = paymentTypes.value.find(pt => pt.value === payment.type)
      if (!paymentType) return false

      const isEarning = paymentType.isEarning || false
      if (showEarningsInNextPayments.value && !isEarning) return false
      if (!showEarningsInNextPayments.value && isEarning) return false

      // Filter by selected payment types (if any are selected)
      if (selectedPaymentTypes.value.length > 0) {
        if (!selectedPaymentTypes.value.includes(payment.type)) return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortMode.value) {
        case 'date-asc': {
          // Sort by date ascending (earliest first)
          const dateA = parsePaymentDate(a.date)
          const dateB = parsePaymentDate(b.date)

          if (!dateA || !dateB) {
            return a.date.localeCompare(b.date)
          }

          const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
          const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

          return dateObjA.getTime() - dateObjB.getTime()
        }

        case 'date-desc': {
          // Sort by date descending (latest first)
          const dateA = parsePaymentDate(a.date)
          const dateB = parsePaymentDate(b.date)

          if (!dateA || !dateB) {
            return b.date.localeCompare(a.date)
          }

          const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
          const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

          return dateObjB.getTime() - dateObjA.getTime()
        }

        case 'amount-asc': {
          // Sort by amount ascending (lowest first)
          return parseAmount(a.amount) - parseAmount(b.amount)
        }

        case 'amount-desc': {
          // Sort by amount descending (highest first)
          return parseAmount(b.amount) - parseAmount(a.amount)
        }

        default:
          return 0
      }
    })
})

// Computed properties for calendar
export const currentMonthName = computed(() => calendarService.getCurrentMonthName(currentMonth.value))
export const currentMonthYear = computed(() => calendarService.getCurrentMonthYear(currentMonth.value, currentYear.value))

// Calendar dates computed property
export const calendarDates = computed(() => {
  // Apply the same filtering as sortedPayments to ensure calendar dates respect filter settings
  const filteredPayments = payments.value.filter(payment => {
    // If filtering is disabled, show all payments (including inventory)
    if (!isFilteringEnabled.value) return true

    // Handle inventory items - treat them as payments (purchases)
    if (payment.type === 'inventory') {
      // Include inventory when showing payments, exclude when showing earnings
      return !showEarningsInNextPayments.value
    }

    // Filter by earnings vs payments
    const paymentType = paymentTypes.value.find(pt => pt.value === payment.type)
    if (!paymentType) return false

    const isEarning = paymentType.isEarning || false
    if (showEarningsInNextPayments.value && !isEarning) return false
    if (!showEarningsInNextPayments.value && isEarning) return false

    // Filter by selected payment types (if any are selected)
    if (selectedPaymentTypes.value.length > 0) {
      if (!selectedPaymentTypes.value.includes(payment.type)) return false
    }

    return true
  })

  return calendarService.getCalendarDates(
    filteredPayments,
    paymentTypes.value,
    currentMonth.value,
    currentYear.value,
    forgoneInstances.value
  )
})

// Week view computed property - shows current week with detailed payment info
export const weekViewDates = computed(() => {
  // Apply the same filtering as calendarDates
  const filteredPayments = payments.value.filter(payment => {
    // If filtering is disabled, show all payments (including inventory)
    if (!isFilteringEnabled.value) return true

    // Handle inventory items - treat them as payments (purchases)
    if (payment.type === 'inventory') {
      // Include inventory when showing payments, exclude when showing earnings
      return !showEarningsInNextPayments.value
    }

    // Filter by earnings vs payments
    const paymentType = paymentTypes.value.find(pt => pt.value === payment.type)
    if (!paymentType) return false

    const isEarning = paymentType.isEarning || false
    if (showEarningsInNextPayments.value && !isEarning) return false
    if (!showEarningsInNextPayments.value && isEarning) return false

    // Filter by selected payment types (if any are selected)
    if (selectedPaymentTypes.value.length > 0) {
      if (!selectedPaymentTypes.value.includes(payment.type)) return false
    }

    return true
  })

  // Generate 7 days for the week starting from currentWeekStart
  const startDate = new Date(currentWeekStart.value)
  const dates = []
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const day = currentDate.getDate()
    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()
    
    // Get all payments for this day
    const dayPayments = paymentService.getPaymentsForDay(filteredPayments, day, month, year)
    const paymentCount = dayPayments.length
    const totalAmount = paymentService.calculateNetDailyTotal(dayPayments, paymentTypes.value, forgoneInstances.value)
    
    // Get detailed payment information for week view
    const detailedPayments = dayPayments.map(payment => {
      const paymentType = paymentTypes.value.find(pt => pt.value === payment.type)
      return {
        ...payment,
        paymentTypeLabel: paymentType?.label || payment.type,
        paymentTypeColor: paymentType?.color || '#ef4444',
        isEarning: paymentType?.isEarning || false
      }
    })

    dates.push({
      day,
      isCurrentMonth: month === currentMonth.value && year === currentYear.value,
      date: currentDate,
      hasPayment: paymentCount > 0,
      paymentCount,
      totalAmount,
      detailedPayments
    })
  }

  return dates
})

// Week range computed property for displaying the current week's date range
export const weekRange = computed(() => {
  const dates = weekViewDates.value
  if (dates.length === 0) return ''
  
  const startDate = dates[0].date
  const endDate = dates[dates.length - 1].date
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const startMonth = monthNames[startDate.getMonth()]
  const startDay = startDate.getDate()
  const startYear = startDate.getFullYear()
  
  const endMonth = monthNames[endDate.getMonth()]
  const endDay = endDate.getDate()
  const endYear = endDate.getFullYear()
  
  // If same month and year, show "Month Start - End, Year"
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`
  }
  // If same year but different months, show "StartMonth Start - EndMonth End, Year"
  else if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`
  }
  // If different years, show full dates
  else {
    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`
  }
})

// Next payments computed properties (expenses only)
export const nextPayments = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonthToday = today.getMonth()
  const currentYearToday = today.getFullYear()

  // Define the range: from today to end of selected calendar month
  // But if we're looking at a different month, show from the 1st of that month
  let startDate: Date
  if (currentMonth.value === currentMonthToday && currentYear.value === currentYearToday) {
    // Same month as today: start from today
    startDate = new Date(currentYear.value, currentMonth.value, currentDay)
  } else {
    // Different month: start from 1st of selected month
    startDate = new Date(currentYear.value, currentMonth.value, 1)
  }
  
  const endDate = new Date(currentYear.value, currentMonth.value + 1, 0) // Last day of selected month

  return paymentService.getNextPayments(payments.value, paymentTypes.value, startDate, endDate)
})

export const nextPaymentsTotal = computed(() => {
  const total = paymentService.calculateTotalAmount(nextPayments.value, forgoneInstances.value)
  return paymentService.formatTotalAmount(total)
})

export const nextPaymentsPeriod = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonthToday = today.getMonth()
  const currentYearToday = today.getFullYear()
  
  const monthName = MONTH_NAMES_FULL[currentMonth.value]
  const year = currentYear.value
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  if (currentMonth.value === currentMonthToday && currentYear.value === currentYearToday) {
    // Same month as today: show from today to end of month
    return `${monthName} ${currentDay} - ${monthName} ${lastDay}, ${year}`
  } else {
    // Different month: show full month
    return `${monthName} 1 - ${monthName} ${lastDay}, ${year}`
  }
})

// Earnings computed properties (earnings only)
export const nextEarnings = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonthToday = today.getMonth()
  const currentYearToday = today.getFullYear()

  // Define the range: from today to end of selected calendar month
  // But if we're looking at a different month, show from the 1st of that month
  let startDate: Date
  if (currentMonth.value === currentMonthToday && currentYear.value === currentYearToday) {
    // Same month as today: start from today
    startDate = new Date(currentYear.value, currentMonth.value, currentDay)
  } else {
    // Different month: start from 1st of selected month
    startDate = new Date(currentYear.value, currentMonth.value, 1)
  }
  
  const endDate = new Date(currentYear.value, currentMonth.value + 1, 0) // Last day of selected month

  return paymentService.getNextEarnings(payments.value, paymentTypes.value, startDate, endDate)
})

export const earningsTotal = computed(() => {
  const total = paymentService.calculateTotalAmount(nextEarnings.value, forgoneInstances.value)
  return paymentService.formatTotalAmount(total)
})

export const earningsPeriod = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonthToday = today.getMonth()
  const currentYearToday = today.getFullYear()
  
  const monthName = MONTH_NAMES_FULL[currentMonth.value]
  const year = currentYear.value
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()

  if (currentMonth.value === currentMonthToday && currentYear.value === currentYearToday) {
    // Same month as today: show from today to end of month
    return `${monthName} ${currentDay} - ${monthName} ${lastDay}, ${year}`
  } else {
    // Different month: show full month
    return `${monthName} 1 - ${monthName} ${lastDay}, ${year}`
  }
})

// Total summary computed property
export const totalRemainingSummary = computed(() => {
  const paymentsAmount = parseAmount(nextPaymentsTotal.value)
  const earningsAmount = parseAmount(earningsTotal.value)

  return formatNetAmount(earningsAmount - paymentsAmount)
})

// All payments in selected calendar month (entire month, not just from current date)
export const allMonthPayments = computed(() => {
  // Define the range: entire selected calendar month
  const startDate = new Date(currentYear.value, currentMonth.value, 1)
  const endDate = new Date(currentYear.value, currentMonth.value + 1, 0) // Last day of selected month

  return paymentService.getNextPayments(payments.value, paymentTypes.value, startDate, endDate)
})

// All earnings in selected calendar month (entire month, not just from current date)
export const allMonthEarnings = computed(() => {
  // Define the range: entire selected calendar month
  const startDate = new Date(currentYear.value, currentMonth.value, 1)
  const endDate = new Date(currentYear.value, currentMonth.value + 1, 0) // Last day of selected month

  return paymentService.getNextEarnings(payments.value, paymentTypes.value, startDate, endDate)
})

// Total amount computed property (net total: earnings minus payments for entire month)
export const totalAmount = computed(() => {
  const paymentsAmount = paymentService.calculateTotalAmount(allMonthPayments.value)
  const earningsAmount = paymentService.calculateTotalAmount(allMonthEarnings.value)

  return formatNetAmount(earningsAmount - paymentsAmount)
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

    const amount = parseAmount(payment.amount)
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
        formattedAmount: `$${+amount.toFixed(2)}`
      })
    }
  })

  // Sort by amount (largest first)
  return slices.sort((a, b) => b.amount - a.amount)
})

export const chartTotal = computed(() => {
  const total = chartData.value.reduce((sum, slice) => sum + slice.amount, 0)
  return `$${+total.toFixed(2)}`
})

export const chartPeriod = computed(() => {
  const monthName = MONTH_NAMES_FULL[currentMonth.value]
  const year = currentYear.value
  return `${monthName} ${year}`
})

export const largestCategory = computed(() => {
  const largest = chartData.value[0]
  return largest ? largest.label : 'None'
})

// Helper function to get common calendar parameters
const getCalendarParams = () => ({
  payments: payments.value,
  paymentTypes: paymentTypes.value,
  currentMonth: currentMonth.value,
  currentYear: currentYear.value
})

// Helper function to get payment type class for styling
export const getPaymentTypeClass = (paymentType: string) => {
  return calendarService.getPaymentTypeClass(paymentType, paymentTypes.value)
}

// Helper function to get the dominant payment type class for a specific day
export const getPaymentTypeClassForDay = (day: number, date?: Date) => {
  const params = getCalendarParams()
  // If date is provided, use its month/year, otherwise use selected month/year
  const month = date ? date.getMonth() : params.currentMonth
  const year = date ? date.getFullYear() : params.currentYear
  
  return calendarService.getPaymentTypeClassForDay(
    params.payments,
    params.paymentTypes,
    day,
    month,
    year
  )
}

// Helper function to get the style for a specific day based on payment types
export const getDayStyle = (day: number, date?: Date) => {
  const params = getCalendarParams()
  // If date is provided, use its month/year, otherwise use selected month/year
  const month = date ? date.getMonth() : params.currentMonth
  const year = date ? date.getFullYear() : params.currentYear
  
  return calendarService.getDayStyle(
    params.payments,
    params.paymentTypes,
    day,
    month,
    year
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

// Inventory items computed property (group inventory items by name and aggregate data)
export const inventoryItems = computed(() => {
  const inventoryPayments = payments.value.filter(payment => payment.type === 'inventory')

  // Group payments by itemName
  const groupedItems = new Map<string, Payment[]>()

  inventoryPayments.forEach(payment => {
    if (payment.itemName) {
      const key = canonicalItemName(payment.itemName)
      if (!groupedItems.has(key)) {
        groupedItems.set(key, [])
      }
      groupedItems.get(key)!.push(payment)
    }
  })

  // Create aggregated inventory items
  const aggregatedItems: Payment[] = []

  groupedItems.forEach((itemGroup, itemName) => {
    if (itemGroup.length === 0) return

    // Sort by date (newest first) to get the most recent item details
    const sortedGroup = itemGroup.sort((a, b) => {
      const dateA = parsePaymentDate(a.date)
      const dateB = parsePaymentDate(b.date)
      if (!dateA || !dateB) return 0
      const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
      const dateObjB = new Date(dateB.year, dateB.month, dateB.day)
      return dateObjB.getTime() - dateObjA.getTime()
    })

    // Use the most recent purchase as the base for item details
    const latestPurchase = sortedGroup[0]

    // Get current date for filtering purchases
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate date comparison

    // Filter purchases to only include those on or before today
    const currentAndPastPurchases = itemGroup.filter(purchase => {
      const parsedDate = parsePaymentDate(purchase.date)
      if (!parsedDate) return false

      const purchaseDate = new Date(parsedDate.year, parsedDate.month, parsedDate.day)
      purchaseDate.setHours(0, 0, 0, 0) // Reset time to start of day

      return purchaseDate.getTime() <= today.getTime()
    })

    // Calculate total cost from current and past purchases only
    const totalCost = currentAndPastPurchases.reduce((sum, payment) => {
      return sum + parseAmount(payment.amount)
    }, 0)

    // Create aggregated item with latest details and total cost
    const aggregatedItem: Payment = {
      ...latestPurchase, // Start with most recent purchase details
      amount: `$${+totalCost.toFixed(2)}`, // Show total cost
      // Keep all other inventory-specific fields from the most recent purchase
      id: latestPurchase.id, // Keep original ID for editing/management
      date: latestPurchase.date // Keep latest purchase date
    }

    aggregatedItems.push(aggregatedItem)
  })

  return aggregatedItems
})

// Computed property for estimated portions based on itemSize / portionSize
export const getEstimatedPortions = computed(() => {
  return (item: Payment): number => {
    if (!item.itemSize || !item.portionSize || item.portionSize === 0) {
      return 0
    }
    // Account for quantity if available, default to 1 if not provided
    const quantity = item.quantity || 1
    return Math.round((item.itemSize / item.portionSize) * quantity * 100) / 100 // Round to 2 decimal places
  }
})

// Variant that accepts data object (for stepper component usage)
export const getEstimatedPortionsFromData = computed(() => {
  return (data: { itemSize?: number | null, portionSize?: number | null, quantity?: number | null }): number => {
    // Debug logging
    console.log('getEstimatedPortionsFromData - input data:', data)
    
    if (!data.itemSize || !data.portionSize || data.portionSize === 0) {
      console.log('getEstimatedPortionsFromData - missing data, returning 0')
      return 0
    }
    
    // Account for quantity if available, default to 1 if not provided
    const quantity = data.quantity || 1
    const portions = Math.round((data.itemSize / data.portionSize) * quantity * 100) / 100 // Round to 2 decimal places
    
    console.log('getEstimatedPortionsFromData - calculated portions:', portions, `(itemSize: ${data.itemSize}, portionSize: ${data.portionSize}, quantity: ${quantity})`)
    
    return portions
  }
})

// Helper function to check if a purchase is expired
export const isPurchaseExpired = (purchase: Payment): boolean => {
  if (!purchase.calculatedExpirationDate) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day
  
  const expirationDate = new Date(purchase.calculatedExpirationDate)
  expirationDate.setHours(0, 0, 0, 0) // Reset time to start of day
  
  return expirationDate.getTime() <= today.getTime()
}

// Helper function to calculate portions remaining for inventory item
export const getPortionsRemaining = (item: Payment) => {
  // Get current date for filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate date comparison

  // Get all purchases for this item that are on or before today
  const itemPurchases = payments.value.filter(payment => {
    if (payment.type !== 'inventory' || !isSameItemName(payment.itemName, item.itemName)) {
      return false
    }

    // Parse purchase date
    const parsedDate = parsePaymentDate(payment.date)
    if (!parsedDate) return false

    const purchaseDate = new Date(parsedDate.year, parsedDate.month, parsedDate.day)
    purchaseDate.setHours(0, 0, 0, 0) // Reset time to start of day

    // Only include purchases that are on or before today
    return purchaseDate.getTime() <= today.getTime()
  })

  // Filter out expired purchases
  const nonExpiredPurchases = itemPurchases.filter(purchase => !isPurchaseExpired(purchase))

  if (nonExpiredPurchases.length === 0) {
    return 0
  }

  // Calculate total portions from non-expired purchases only
  let totalPortions = 0
  nonExpiredPurchases.forEach(purchase => {
    // Use portionsCount if it exists, otherwise calculate from itemSize/portionSize
    if (purchase.portionsCount !== null && purchase.portionsCount !== undefined) {
      totalPortions += purchase.portionsCount
    } else if (purchase.itemSize && purchase.portionSize && purchase.portionSize > 0) {
      totalPortions += Math.floor(purchase.itemSize / purchase.portionSize)
    }
  })

  // If no depletion rate is set, return total portions
  if (!item.depletionRate || !item.depletionUnit) {
    return totalPortions
  }

  // Calculate consumed portions based on time elapsed since each purchase
  let totalConsumedPortions = 0

  nonExpiredPurchases.forEach(purchase => {
    // Parse purchase date
    const parsedDate = parsePaymentDate(purchase.date)
    if (!parsedDate) return

    const purchaseDate = new Date(parsedDate.year, parsedDate.month, parsedDate.day)
    purchaseDate.setHours(0, 0, 0, 0) // Reset time to start of day

    // Calculate days elapsed since purchase
    const daysElapsed = Math.max(0, Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)))

    // Convert depletion rate to portions per day
    let portionsPerDay: number
    switch (item.depletionUnit.toLowerCase()) {
      case 'day':
        portionsPerDay = item.depletionRate
        break
      case 'week':
        portionsPerDay = item.depletionRate / 7
        break
      case 'month':
        portionsPerDay = item.depletionRate / 30 // Approximate month as 30 days
        break
      default:
        portionsPerDay = item.depletionRate
        break
    }

    // Calculate portions consumed from this purchase
    const portionsFromThisPurchase = purchase.portionsCount ||
      (purchase.itemSize && purchase.portionSize && purchase.portionSize > 0 ?
        Math.floor(purchase.itemSize / purchase.portionSize) : 0)

    const consumedFromThisPurchase = Math.min(portionsFromThisPurchase, daysElapsed * portionsPerDay)
    totalConsumedPortions += consumedFromThisPurchase
  })

  // Return remaining portions (total minus consumed), never go below 0
  return Math.max(0, totalPortions - totalConsumedPortions)
}

// Helper function to calculate estimated depletion time in days
export const getEstimatedDepletionDate = (item: Payment) => {
  const remainingPortions = getPortionsRemaining(item)

  if (!item.depletionRate || remainingPortions <= 0 || !item.depletionUnit) return null

  // Convert depletion rate to portions per day
  let portionsPerDay: number
  switch (item.depletionUnit.toLowerCase()) {
    case 'day':
      portionsPerDay = item.depletionRate
      break
    case 'week':
      portionsPerDay = item.depletionRate / 7
      break
    case 'month':
      portionsPerDay = item.depletionRate / 30 // Approximate month as 30 days
      break
    default:
      return null
  }

  if (portionsPerDay <= 0) return null

  // Calculate days remaining: remaining portions divided by portions consumed per day
  const daysRemaining = remainingPortions / portionsPerDay

  // Return as formatted string (e.g., "8 days")
  const roundedDays = Math.ceil(daysRemaining)
  return `${roundedDays} day${roundedDays === 1 ? '' : 's'}`
}

// Item chart data computed properties
interface ItemChartItem {
  item: Payment
  itemName: string
  portionSize: string // Formatted display string (e.g., "250 grams")
  portionsCount: number
  productCost: number
  depletionDate: string | null
  isTracked: boolean
}

// Helper function to parse portion size into numeric value for comparison
export const parsePortionSize = (portionSize: string): number => {
  if (!portionSize) return 0

  // Extract numeric value and unit (e.g., "250g" -> 250, "1L" -> 1000)
  const match = portionSize.match(/^(\d*\.?\d+)\s*(g|kg|l|ml|pieces?|count|dozen|box)?$/i)
  if (match) {
    const value = parseFloat(match[1])
    const unit = match[2]?.toLowerCase()

    // Normalize to grams or ml for comparison
    switch (unit) {
      case 'kg':
        return value * 1000
      case 'l':
      case 'liter':
        return value * 1000
      case 'dozen':
        return value * 12
      case 'ml':
      case 'g':
      case 'pieces':
      case 'piece':
      case 'count':
      case 'box':
      default:
        return value
    }
  }
  return 0
}

// Helper function to simplify fractions
export const simplifyFraction = (numerator: number, denominator: number): { num: number, den: number } => {
  if (denominator === 0) return { num: numerator, den: denominator }

  // Function to find greatest common divisor
  const gcd = (a: number, b: number): number => {
    while (b !== 0) {
      const t = b
      b = a % b
      a = t
    }
    return a
  }

  const g = gcd(Math.abs(numerator), Math.abs(denominator))
  return {
    num: numerator / g,
    den: denominator / g
  }
}

// Helper function to format fraction display
export const getSimplifiedFraction = (itemSize: number, portionSize: number): string => {
  if (!itemSize || !portionSize) return 'N/A'

  // For now, show ratio as is but simplified
  const { num, den } = simplifyFraction(itemSize, portionSize)

  // If denominator is 1, just show the whole number
  if (den === 1) {
    return num.toString()
  }

  // Otherwise show as fraction
  return `${num}/${den}`
}



// Helper function to calculate total portions for an item
export const getTotalPortions = computed(() => {
  return (item: Payment): number => {
    // Get all purchases for this item on or before today
    const itemPurchases = payments.value.filter(payment => {
      if (payment.type !== 'inventory' || !isSameItemName(payment.itemName, item.itemName)) return false

      const parsedDate = parsePaymentDate(payment.date)
      if (!parsedDate) return false

      const purchaseDate = new Date(parsedDate.year, parsedDate.month, parsedDate.day)
      purchaseDate.setHours(0, 0, 0, 0)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      return purchaseDate.getTime() <= today.getTime()
    })

    // Calculate total portions from all purchases
    let totalPortions = 0
    itemPurchases.forEach(purchase => {
      if (purchase.portionsCount !== null && purchase.portionsCount !== undefined) {
        totalPortions += purchase.portionsCount
      } else if (purchase.itemSize && purchase.portionSize && purchase.portionSize > 0) {
        totalPortions += Math.floor(purchase.itemSize / purchase.portionSize)
      }
    })

    return totalPortions
  }
})



// Item chart items computed property
export const itemChartItems = computed((): ItemChartItem[] => {
  return inventoryItems.value.map(item => {
    // Format portion size as display string (using itemSizeUnit)
    let formattedPortionSize = ''
    if (item.portionSize && item.itemSizeUnit) {
      let unitDisplay: string
      if (item.itemSizeUnit === 'single') {
        unitDisplay = 'single'
      } else if (item.portionSize === 1) {
        unitDisplay = item.itemSizeUnit
      } else {
        // Pluralize the unit (simple approach - could be enhanced)
        unitDisplay = item.itemSizeUnit
      }
      formattedPortionSize = `${item.portionSize} ${unitDisplay}`.trim()
    } else if (item.portionSize) {
      formattedPortionSize = item.portionSize.toString()
    }

    return {
      item,
      itemName: item.itemName || 'Unnamed Item',
      portionSize: formattedPortionSize,
      portionsCount: getPortionsRemaining(item),
      productCost: parseAmount(item.amount),
      depletionDate: getEstimatedDepletionDate(item),
      isTracked: Boolean(item.depletionRate)
    }
  })
})

// Computed property to calculate depletion time in the selected unit
export const getDepletionTimeInDays = computed(() => {
  return (item: Payment): number => {
    const estimatedPortions = getEstimatedPortions.value(item)
    if (!estimatedPortions || !item.depletionRate || !item.depletionUnit) {
      return 0
    }

    if (item.depletionRate === 0) {
      return 0
    }

    // Calculate depletion time in the selected unit (not converting to days)
    // depletionRate is in portions per depletionUnit
    const depletionTime = estimatedPortions / item.depletionRate

    return Math.round(depletionTime * 100) / 100 // Round to 2 decimal places
  }
})

// Variant that accepts data object (for stepper component usage)
export const getDepletionTimeInDaysFromData = computed(() => {
  return (data: { depletionRate?: number | null, depletionUnit?: string, itemSize?: number | null, portionSize?: number | null, quantity?: number | null }): number => {
    // Debug logging
    console.log('getDepletionTimeInDaysFromData - input data:', data)
    
    const estimatedPortions = getEstimatedPortionsFromData.value(data)
    console.log('getDepletionTimeInDaysFromData - estimatedPortions:', estimatedPortions)
    
    if (!estimatedPortions || !data.depletionRate || !data.depletionUnit) {
      console.log('getDepletionTimeInDaysFromData - missing required data, returning 0')
      return 0
    }

    if (data.depletionRate === 0) {
      console.log('getDepletionTimeInDaysFromData - depletion rate is 0, returning 0')
      return 0
    }

    // Calculate depletion time in the selected unit (not converting to days)
    // depletionRate is in portions per depletionUnit
    const depletionTime = estimatedPortions / data.depletionRate

    console.log('getDepletionTimeInDaysFromData - calculated depletionTime:', depletionTime, `(${estimatedPortions} / ${data.depletionRate} ${data.depletionUnit})`)

    const result = Math.round(depletionTime * 100) / 100 // Round to 2 decimal places
    console.log('getDepletionTimeInDaysFromData - final result:', result)
    
    return result
  }
})

// Computed property to get portion size as fraction (DepletionRate/DepletionTime)
export const getPortionSizeFraction = computed(() => {
  return (item: Payment): string | null => {
    const estimatedPortions = getEstimatedPortions.value(item)
    if (!estimatedPortions || !item.depletionRate || item.depletionRate === 0) {
      return null
    }

    // DepletionTime = totalPortions / depletionRate
    const depletionTime = estimatedPortions / item.depletionRate

    if (depletionTime === 0) {
      return null
    }

    // Fraction = DepletionRate / DepletionTime
    const fraction = item.depletionRate / depletionTime

    // Round to 2 decimal places and simplify fraction if possible
    const roundedFraction = Math.round(fraction * 100) / 100

    if (roundedFraction === Math.floor(roundedFraction)) {
      // Whole number
      return roundedFraction.toString()
    } else if (fraction === 0.5 || Math.abs(fraction - 0.5) < 0.01) {
      return '1/2'
    } else if (fraction === 0.33 || Math.abs(fraction - 0.33) < 0.01) {
      return '1/3'
    } else if (fraction === 0.25 || Math.abs(fraction - 0.25) < 0.01) {
      return '1/4'
    } else if (fraction === 0.67 || Math.abs(fraction - 0.67) < 0.01) {
      return '2/3'
    } else if (fraction === 0.75 || Math.abs(fraction - 0.75) < 0.01) {
      return '3/4'
    } else {
      return roundedFraction.toString()
    }
  }
})

// Last purchases computed properties for inventory items
export const getLastPurchases = computed(() => {
  return (itemName: string, currentItemDate: string): Payment[] => {
    // Find all payments with the same item name - this helps with prediction
    const allItemPurchases = payments.value.filter(payment =>
      payment.type === 'inventory' &&
      isSameItemName(payment.itemName, itemName)
    )

    // For add forms (empty currentItemDate), show all purchases
    // For edit forms, we keep all purchases including same-day ones for better prediction
    // The assumption is that when editing, seeing all historical data including
    // multiple purchases from the same day helps with purchase frequency analysis

    // Sort by date (most recent first)
    const sortedPurchases = allItemPurchases.sort((a, b) => {
      const dateA = parsePaymentDate(a.date)
      const dateB = parsePaymentDate(b.date)

      if (!dateA || !dateB) return 0

      const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
      const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

      return dateObjB.getTime() - dateObjA.getTime() // Newest first
    })

    // Return all purchases (no limit) - UI will handle scrolling
    return sortedPurchases
  }
})

export const getEstimatedNextPurchaseDate = computed(() => {
  return (lastPurchases: Payment[]): string | null => {
    if (lastPurchases.length < 3) {
      return null // Need at least 3 purchases to calculate average
    }

    // Parse dates and convert to timestamps for calculation
    const purchaseDates: number[] = []
    for (const purchase of lastPurchases) {
      const parsedDate = parsePaymentDate(purchase.date)
      if (parsedDate) {
        const dateObj = new Date(parsedDate.year, parsedDate.month, parsedDate.day)
        purchaseDates.push(dateObj.getTime())
      }
    }

    if (purchaseDates.length < 3) return null

    // Sort dates chronologically (oldest to newest)
    purchaseDates.sort((a, b) => a - b)

    // Calculate intervals between consecutive purchases (in days)
    const intervals: number[] = []
    for (let i = 1; i < purchaseDates.length; i++) {
      const interval = (purchaseDates[i] - purchaseDates[i - 1]) / (1000 * 60 * 60 * 24) // Convert to days
      intervals.push(interval)
    }

    if (intervals.length === 0) return null

    // Calculate average interval
    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length

    // Calculate next purchase date (from the most recent purchase)
    const mostRecentPurchase = Math.max(...purchaseDates)
    const nextPurchaseTime = mostRecentPurchase + (averageInterval * 1000 * 60 * 60 * 24)
    const nextPurchaseDate = new Date(nextPurchaseTime)

    // Format date
    const month = MONTH_NAMES_SHORT[nextPurchaseDate.getMonth()]
    const day = nextPurchaseDate.getDate()
    const year = nextPurchaseDate.getFullYear()

    return `${month} ${day}, ${year}`
  }
})



// Selected item for detailed comparison
export const selectedChartItem = ref<ItemChartItem | null>(null)

// Annual cost estimation methods for inventory items
export const getAnnualCostFromPurchases = computed(() => {
  return (item: Payment): { cost: number; method: string; details: string } | null => {
    // Get all purchases for this item
    const itemPurchases = payments.value.filter(payment =>
      payment.type === 'inventory' &&
      isSameItemName(payment.itemName, item.itemName)
    )

    if (itemPurchases.length === 0) {
      return null // Need at least one purchase
    }

    // Check if this item has a scheduled recurring frequency
    const hasRecurringFrequency = ['weekly', 'bi-monthly', 'recurring'].includes(item.frequency)

    if (hasRecurringFrequency) {
      // Use scheduled frequency approach
      // Get the most recent purchase amount as the base purchase amount
      const sortedPurchases = itemPurchases.sort((a, b) => {
        const dateA = parsePaymentDate(a.date)
        const dateB = parsePaymentDate(b.date)

        if (!dateA || !dateB) return 0

        const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
        const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

        return dateObjB.getTime() - dateObjA.getTime() // Newest first
      })

      const mostRecentPurchase = sortedPurchases[0]
      const purchaseAmount = parseAmount(mostRecentPurchase.amount)

      // Calculate frequency multiplier
      let frequencyMultiplier: number
      let frequencyDescription: string

      switch (item.frequency) {
        case 'weekly':
          frequencyMultiplier = 52 // 52 weeks per year
          frequencyDescription = 'weekly'
          break
        case 'bi-monthly':
          frequencyMultiplier = 26 // 26 bi-weekly periods per year
          frequencyDescription = 'bi-monthly'
          break
        case 'recurring':
          frequencyMultiplier = 12 // 12 months per year
          frequencyDescription = 'monthly'
          break
        default:
          return null // Should not reach here due to hasRecurringFrequency check
      }

      // Annual cost = purchase amount × frequency multiplier
      const annualCost = purchaseAmount * frequencyMultiplier

      return {
        cost: annualCost,
        method: 'Scheduled Frequency',
        details: `$${+purchaseAmount.toFixed(2)} × ${frequencyMultiplier} ${frequencyDescription} purchases/year`
      }
    } else {
      // Fall back to historical purchase rate calculation (original logic)
      if (itemPurchases.length < 3) {
        return null // Need at least 3 purchases for reliable estimate
      }

      // Sort by date (oldest to newest)
      const sortedPurchases = itemPurchases.sort((a, b) => {
        const dateA = parsePaymentDate(a.date)
        const dateB = parsePaymentDate(b.date)

        if (!dateA || !dateB) return 0

        const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
        const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

        return dateObjA.getTime() - dateObjB.getTime()
      })

      // Get last 3 purchases
      const lastThreePurchases = sortedPurchases.slice(-3)

      // Calculate intervals between purchases (in days)
      const intervals: number[] = []
      for (let i = 1; i < lastThreePurchases.length; i++) {
        const prevDate = parsePaymentDate(lastThreePurchases[i-1].date)
        const currDate = parsePaymentDate(lastThreePurchases[i].date)

        if (prevDate && currDate) {
          const prevDateObj = new Date(prevDate.year, prevDate.month, prevDate.day)
          const currDateObj = new Date(currDate.year, currDate.month, currDate.day)

          const intervalDays = (currDateObj.getTime() - prevDateObj.getTime()) / (1000 * 60 * 60 * 24)
          intervals.push(intervalDays)
        }
      }

      if (intervals.length === 0) return null

      // Calculate average interval and cost
      const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      const averageCost = lastThreePurchases.reduce((sum, purchase) => {
        return sum + parseAmount(purchase.amount)
      }, 0) / lastThreePurchases.length

      // Annual cost = (average cost per purchase / average days between purchases) × 365
      const annualCost = (averageCost / averageInterval) * 365

      return {
        cost: annualCost,
        method: 'Purchase Rate',
        details: `Based on ${lastThreePurchases.length} purchases, avg $${+averageCost.toFixed(2)} every ${+averageInterval.toFixed(1)} days`
      }
    }
  }
})

export const getAnnualCostFromDepletion = computed(() => {
  return (item: Payment): { cost: number; method: string; details: string } | null => {
    if (!item.depletionRate || !item.depletionUnit || !item.portionSize) {
      return null // Missing depletion data
    }

    // Get all current and past purchases for this item
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const itemPurchases = payments.value.filter(payment => {
      if (payment.type !== 'inventory' || !isSameItemName(payment.itemName, item.itemName)) {
        return false
      }

      const parsedDate = parsePaymentDate(payment.date)
      if (!parsedDate) return false

      const purchaseDate = new Date(parsedDate.year, parsedDate.month, parsedDate.day)
      purchaseDate.setHours(0, 0, 0, 0)

      return purchaseDate.getTime() <= today.getTime()
    })

    if (itemPurchases.length === 0) return null

    // Calculate total portions and total cost from all purchases
    let totalPortions = 0
    let totalCost = 0

    itemPurchases.forEach(purchase => {
      const purchaseCost = parseAmount(purchase.amount)
      totalCost += purchaseCost

      // Calculate portions for this purchase
      let portionsInPurchase = 0
      if (purchase.portionsCount !== null && purchase.portionsCount !== undefined) {
        portionsInPurchase = purchase.portionsCount
      } else if (purchase.itemSize && purchase.portionSize && purchase.portionSize > 0) {
        portionsInPurchase = Math.floor(purchase.itemSize / purchase.portionSize)
      }

      totalPortions += portionsInPurchase
    })

    if (totalPortions === 0 || totalCost === 0) return null

    // Calculate cost per portion
    const costPerPortion = totalCost / totalPortions

    // Calculate portions consumed per year based on depletion rate
    let portionsPerYear: number
    switch (item.depletionUnit.toLowerCase()) {
      case 'day':
        portionsPerYear = item.depletionRate * 365
        break
      case 'week':
        portionsPerYear = item.depletionRate * 52 // Approximate weeks per year
        break
      case 'month':
        portionsPerYear = item.depletionRate * 12 // This is actually correct - depletion rate is per month, so ×12 for annual
        break
      default:
        portionsPerYear = item.depletionRate * 365
        break
    }

    // Annual cost = portions per year × cost per portion
    const annualCost = portionsPerYear * costPerPortion

    return {
      cost: annualCost,
      method: 'Depletion Rate',
      details: `$${+costPerPortion.toFixed(2)}/portion × ${+portionsPerYear.toFixed(2)} portions/year`
    }
  }
})

// Helper function to get the current annual cost based on toggle state
// This function needs access to the reactive itemCostMethodPrefs from the component
// We'll create a version that takes the preferences as a parameter
export const getCurrentAnnualCost = (item: Payment, useDepletionCost: boolean): { cost: number; method: string; details: string } | null => {
  if (useDepletionCost) {
    // Try depletion rate first
    const depletionCost = getAnnualCostFromDepletion.value(item)
    if (depletionCost) {
      return depletionCost
    }
    // Fall back to purchase rate if depletion not available
    return getAnnualCostFromPurchases.value(item)
  } else {
    // Try purchase rate first
    const purchaseCost = getAnnualCostFromPurchases.value(item)
    if (purchaseCost) {
      return purchaseCost
    }
    // Fall back to depletion rate if purchase not available
    return getAnnualCostFromDepletion.value(item)
  }
}

// Computed property to get current annual cost for an item with reactive preferences
// This will be used in the component to ensure reactivity
export const getCurrentAnnualCostReactive = (item: Payment, itemCostMethodPrefs: Record<string, boolean>) => {
  const useDepletionCost = itemCostMethodPrefs[item.id] ?? true
  return getCurrentAnnualCost(item, useDepletionCost)
}

// Price history chart data structures
export interface PricePoint {
  date: Date
  price: number
  formattedDate: string
}

export interface PriceHistoryData {
  points: PricePoint[]
  low: number
  high: number
  peak: number
  last: number
  best: number
}

// Function to get purchase history data for an item (last 30 days only)
export const getPurchaseHistoryData = computed(() => {
  return (itemName: string): PriceHistoryData => {
    return getPurchaseHistoryDataForPeriod(itemName, 'month')
  }
})

// Function to get purchase history data for an item with specific time period
export const getPurchaseHistoryDataForPeriod = (itemName: string, period: 'month' | 'year'): PriceHistoryData => {
  // Get all purchases for this item
  const itemPurchases = payments.value.filter(payment =>
    payment.type === 'inventory' &&
    isSameItemName(payment.itemName, itemName)
  )

  if (itemPurchases.length === 0) {
    return {
      points: [],
      low: 0,
      high: 0,
      peak: 0,
      last: 0,
      best: 0
    }
  }

  // Filter based on time period
  const now = new Date()
  let startDate: Date
  
  if (period === 'month') {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - 28)
    startDate.setHours(0, 0, 0, 0) // Start of day 28 days ago
  } else {
    startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    startDate.setHours(0, 0, 0, 0) // Start of day 1 year ago
  }
  
  const filteredPurchases = itemPurchases.filter(purchase => {
    const purchaseDate = parsePaymentDate(purchase.date)
    if (!purchaseDate) return false
      
    const purchaseDateTime = new Date(purchaseDate.year, purchaseDate.month, purchaseDate.day)
    return purchaseDateTime >= startDate && purchaseDateTime <= now
  })

  if (filteredPurchases.length === 0) {
    return {
      points: [],
      low: 0,
      high: 0,
      peak: 0,
      last: 0,
      best: 0
    }
  }

  // Sort by date (oldest to newest)
  const sortedPurchases = filteredPurchases.sort((a, b) => {
    const dateA = parsePaymentDate(a.date)
    const dateB = parsePaymentDate(b.date)

    if (!dateA || !dateB) return 0

    const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
    const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

    return dateObjA.getTime() - dateObjB.getTime()
  })

  // Create points for the chart
  const points = sortedPurchases.map(purchase => {
    const purchaseDate = parsePaymentDate(purchase.date)
    if (!purchaseDate) return null

    const dateObj = new Date(purchaseDate.year, purchaseDate.month, purchaseDate.day)
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })

    // Use stored unitCost if available, otherwise fall back to amount / quantity for legacy records
    const price = purchase.unitCost !== undefined
      ? purchase.unitCost
      : parseAmount(purchase.amount) / (purchase.quantity && purchase.quantity > 0 ? purchase.quantity : 1)

    return {
      date: dateObj,
      price,
      formattedDate
    }
  }).filter(point => point !== null) as PricePoint[]

  if (points.length === 0) {
    return {
      points: [],
      low: 0,
      high: 0,
      peak: 0,
      last: 0,
      best: 0
    }
  }

  // Calculate statistics for the selected period
  const prices = points.map(p => p.price)
  const low = Math.min(...prices)
  const high = Math.max(...prices)
  const last = prices[prices.length - 1] // Most recent purchase in period

  // Calculate all-time BEST and PEAK from all purchases (not just filtered period)
  const allTimePrices = itemPurchases.map(purchase => {
    // Use stored unitCost if available, otherwise fall back to amount / quantity for legacy records
    const price = purchase.unitCost !== undefined
      ? purchase.unitCost
      : parseAmount(purchase.amount) / (purchase.quantity && purchase.quantity > 0 ? purchase.quantity : 1)
    return price
  })
  
  const best = Math.min(...allTimePrices) // Best price of all time
  const peak = Math.max(...allTimePrices) // Peak price of all time

  return {
    points,
    low,
    high,
    peak,
    last,
    best
  }
}
