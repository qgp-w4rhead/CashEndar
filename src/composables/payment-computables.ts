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
  isEarningsCollapsed
} from '../stores/ui-state.store'

// Computed property to sort payments by date (first to last), excluding inventory items
export const sortedPayments = computed(() => {
  return [...payments.value]
    .filter(payment => payment.type !== 'inventory') // Exclude inventory items
    .sort((a, b) => {
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

// Inventory items computed property (group inventory items by name and aggregate data)
export const inventoryItems = computed(() => {
  const inventoryPayments = payments.value.filter(payment => payment.type === 'inventory')

  // Group payments by itemName
  const groupedItems = new Map<string, Payment[]>()

  inventoryPayments.forEach(payment => {
    if (payment.itemName) {
      const key = payment.itemName
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
      const dateA = paymentService.parsePaymentDate(a.date)
      const dateB = paymentService.parsePaymentDate(b.date)
      if (!dateA || !dateB) return 0
      const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
      const dateObjB = new Date(dateB.year, dateB.month, dateB.day)
      return dateObjB.getTime() - dateObjA.getTime()
    })

    // Use the most recent purchase as the base for item details
    const latestPurchase = sortedGroup[0]

    // Calculate total cost from all purchases of this item
    const totalCost = itemGroup.reduce((sum, payment) => {
      return sum + (parseFloat(payment.amount.replace('$', '')) || 0)
    }, 0)

    // Create aggregated item with latest details and total cost
    const aggregatedItem: Payment = {
      ...latestPurchase, // Start with most recent purchase details
      amount: `$${totalCost.toFixed(2)}`, // Show total cost
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
    return Math.floor(item.itemSize / item.portionSize)
  }
})

// Helper function to calculate portions remaining for inventory item
export const getPortionsRemaining = (item: Payment) => {
  // Use portionsCount if it exists (legacy data or manually set), otherwise calculate from itemSize/portionsSize
  if (item.portionsCount !== null && item.portionsCount !== undefined) {
    return item.portionsCount
  }

  // Calculate estimated portions from item size and portion size
  if (!item.itemSize || !item.portionSize || item.portionSize === 0) {
    return 0
  }

  return Math.floor(item.itemSize / item.portionSize)
}

// Helper function to calculate estimated depletion date
export const getEstimatedDepletionDate = (item: Payment) => {
  if (!item.depletionRate || !item.portionsCount || !item.depletionUnit) return null

  // Use the numeric depletionRate and depletionUnit
  const portionsPerPeriod = item.depletionRate
  const period = item.depletionUnit

  if (portionsPerPeriod <= 0 || item.portionsCount <= 0) return null

  // Calculate days per period
  let daysPerPeriod: number
  switch (period.toLowerCase()) {
    case 'day':
      daysPerPeriod = 1
      break
    case 'week':
      daysPerPeriod = 7
      break
    case 'month':
      daysPerPeriod = 30 // Approximate
      break
    default:
      return null
  }

  // Calculate remaining periods
  const remainingPeriods = item.portionsCount / portionsPerPeriod

  // Calculate days remaining
  const daysRemaining = remainingPeriods * daysPerPeriod

  // Calculate target date
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysRemaining)

  // Format date
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const month = monthNames[targetDate.getMonth()]
  const day = targetDate.getDate()
  const year = targetDate.getFullYear()

  return `${month} ${day}, ${year}`
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

// Helper function to get unique portion sizes for slider comparison
export const getPortionSizeRange = () => {
  const inventoryItems = payments.value.filter(p => p.type === 'inventory' && p.portionSize)
  const sizes = inventoryItems.map(item => item.portionSize || 0)
  const min = Math.min(...sizes) || 0
  const max = Math.max(...sizes) || 100
  return { min, max }
}

// Helper function to get portions count range
export const getPortionsCountRange = () => {
  const inventoryItems = payments.value.filter(p => p.type === 'inventory' && p.portionsCount)
  const counts = inventoryItems.map(item => item.portionsCount || 0)
  const min = Math.min(...counts) || 1
  const max = Math.max(...counts) || 20
  return { min, max }
}

// Item chart items computed property
export const itemChartItems = computed((): ItemChartItem[] => {
  return inventoryItems.value.map(item => {
    // Format portion size as display string (using itemSizeUnit for both)
    let formattedPortionSize = ''
    if (item.portionSize && item.itemSizeUnit) {
      formattedPortionSize = `${item.portionSize} ${item.itemSizeUnit}${item.portionSize === 1 ? '' : 's'}`
    } else if (item.portionSize) {
      formattedPortionSize = item.portionSize.toString()
    }

    return {
      item,
      itemName: item.itemName || 'Unnamed Item',
      portionSize: formattedPortionSize,
      portionsCount: item.portionsCount || 0,
      productCost: parseFloat(item.amount.replace('$', '')) || 0,
      depletionDate: getEstimatedDepletionDate(item),
      isTracked: Boolean(item.depletionRate && item.portionsCount)
    }
  })
})

// Computed property to calculate depletion time in days
export const getDepletionTimeInDays = computed(() => {
  return (item: Payment): number => {
    const estimatedPortions = getEstimatedPortions.value(item)
    if (!estimatedPortions || !item.depletionRate || !item.depletionUnit) {
      return 0
    }

    // Convert depletion rate to portions per day
    let portionsPerDay: number
    switch (item.depletionUnit.toLowerCase()) {
      case 'day':
        portionsPerDay = item.depletionRate
        break
      case 'week':
        portionsPerDay = item.depletionRate / 7 // portions/week to portions/day
        break
      case 'month':
        portionsPerDay = item.depletionRate / 28 // portions/month to portions/day (approx 28 days)
        break
      default:
        portionsPerDay = item.depletionRate
        break
    }

    if (portionsPerDay === 0) {
      return 0
    }

    // Calculate depletion time in days
    const depletionTimeDays = estimatedPortions / portionsPerDay

    return Math.round(depletionTimeDays * 100) / 100 // Round to 2 decimal places
  }
})

// Last purchases computed properties for inventory items
export const getLastPurchases = computed(() => {
  return (itemName: string, currentItemDate: string): Payment[] => {
    // Find all payments with the same item name - this helps with prediction
    const allItemPurchases = payments.value.filter(payment =>
      payment.type === 'inventory' &&
      payment.title === itemName
    )

    // For add forms (empty currentItemDate), show all purchases
    // For edit forms, we keep all purchases including same-day ones for better prediction
    // The assumption is that when editing, seeing all historical data including
    // multiple purchases from the same day helps with purchase frequency analysis

    // Sort by date (most recent first)
    const sortedPurchases = allItemPurchases.sort((a, b) => {
      const dateA = paymentService.parsePaymentDate(a.date)
      const dateB = paymentService.parsePaymentDate(b.date)

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
      const parsedDate = paymentService.parsePaymentDate(purchase.date)
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
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    const month = monthNames[nextPurchaseDate.getMonth()]
    const day = nextPurchaseDate.getDate()
    const year = nextPurchaseDate.getFullYear()

    return `${month} ${day}, ${year}`
  }
})

// Slider value for portion size comparison (0-100 range)
export const portionSizeSliderValue = ref(50)

// Slider value for portions count comparison (0-100 range)
export const portionsCountSliderValue = ref(50)

// Selected item for detailed comparison
export const selectedChartItem = ref<ItemChartItem | null>(null)
