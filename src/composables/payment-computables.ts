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
  sortMode
} from '../stores/ui-state.store'

// Month name constants to avoid duplication
const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

// Helper function to get current date components
const getCurrentDateComponents = () => {
  const today = new Date()
  return {
    today,
    currentDay: today.getDate(),
    currentMonth: today.getMonth(),
    currentYear: today.getFullYear()
  }
}

// Computed property to sort payments based on current sort mode, excluding inventory items
export const sortedPayments = computed(() => {
  return [...payments.value]
    .filter(payment => payment.type !== 'inventory') // Exclude inventory items
    .sort((a, b) => {
      switch (sortMode.value) {
        case 'date-asc': {
          // Sort by date ascending (earliest first)
          const dateA = paymentService.parsePaymentDate(a.date)
          const dateB = paymentService.parsePaymentDate(b.date)

          if (!dateA || !dateB) {
            return a.date.localeCompare(b.date)
          }

          const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
          const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

          return dateObjA.getTime() - dateObjB.getTime()
        }

        case 'date-desc': {
          // Sort by date descending (latest first)
          const dateA = paymentService.parsePaymentDate(a.date)
          const dateB = paymentService.parsePaymentDate(b.date)

          if (!dateA || !dateB) {
            return b.date.localeCompare(a.date)
          }

          const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
          const dateObjB = new Date(dateB.year, dateB.month, dateB.day)

          return dateObjB.getTime() - dateObjA.getTime()
        }

        case 'amount-asc': {
          // Sort by amount ascending (lowest first)
          const amountA = parseFloat(a.amount.replace(/[$,]/g, '')) || 0
          const amountB = parseFloat(b.amount.replace(/[$,]/g, '')) || 0
          return amountA - amountB
        }

        case 'amount-desc': {
          // Sort by amount descending (highest first)
          const amountA = parseFloat(a.amount.replace(/[$,]/g, '')) || 0
          const amountB = parseFloat(b.amount.replace(/[$,]/g, '')) || 0
          return amountB - amountA
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
  return calendarService.getCalendarDates(
    payments.value,
    paymentTypes.value,
    currentMonth.value,
    currentYear.value,
    forgoneInstances.value
  )
})

// Next payments computed properties (expenses only)
export const nextPayments = computed(() => {
  const { today, currentDay, currentMonth, currentYear } = getCurrentDateComponents()

  // Define the range: from today to end of month
  const startDate = new Date(currentYear, currentMonth, currentDay)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  return paymentService.getNextPayments(payments.value, paymentTypes.value, startDate, endDate)
})

export const nextPaymentsTotal = computed(() => {
  const total = paymentService.calculateTotalAmount(nextPayments.value, forgoneInstances.value)
  return paymentService.formatTotalAmount(total)
})

export const nextPaymentsPeriod = computed(() => {
  const { currentDay, currentMonth, currentYear } = getCurrentDateComponents()

  const monthName = MONTH_NAMES_FULL[currentMonth]
  const year = currentYear

  return `${monthName} ${currentDay} - ${monthName} 31, ${year}`
})

// Earnings computed properties (earnings only)
export const nextEarnings = computed(() => {
  const { currentDay, currentMonth, currentYear } = getCurrentDateComponents()

  // Define the range: from today to end of month
  const startDate = new Date(currentYear, currentMonth, currentDay)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  return paymentService.getNextEarnings(payments.value, paymentTypes.value, startDate, endDate)
})

export const earningsTotal = computed(() => {
  const total = paymentService.calculateTotalAmount(nextEarnings.value, forgoneInstances.value)
  return paymentService.formatTotalAmount(total)
})

export const earningsPeriod = computed(() => {
  const { currentDay, currentMonth, currentYear } = getCurrentDateComponents()

  const monthName = MONTH_NAMES_FULL[currentMonth]
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
  const { currentMonth, currentYear } = getCurrentDateComponents()

  // Define the range: entire current month
  const startDate = new Date(currentYear, currentMonth, 1)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  return paymentService.getNextPayments(payments.value, paymentTypes.value, startDate, endDate)
})

// All earnings in current month (entire month, not just from current date)
export const allMonthEarnings = computed(() => {
  const { currentMonth, currentYear } = getCurrentDateComponents()

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
  const { currentMonth, currentYear } = getCurrentDateComponents()
  const monthName = MONTH_NAMES_FULL[currentMonth]
  const year = currentYear
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
export const getPaymentTypeClassForDay = (day: number) => {
  const params = getCalendarParams()
  return calendarService.getPaymentTypeClassForDay(
    params.payments,
    params.paymentTypes,
    day,
    params.currentMonth,
    params.currentYear
  )
}

// Helper function to get the style for a specific day based on payment types
export const getDayStyle = (day: number) => {
  const params = getCalendarParams()
  return calendarService.getDayStyle(
    params.payments,
    params.paymentTypes,
    day,
    params.currentMonth,
    params.currentYear
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

    // Get current date for filtering purchases
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate date comparison

    // Filter purchases to only include those on or before today
    const currentAndPastPurchases = itemGroup.filter(purchase => {
      const parsedDate = paymentService.parsePaymentDate(purchase.date)
      if (!parsedDate) return false

      const purchaseDate = new Date(parsedDate.year, parsedDate.month, parsedDate.day)
      purchaseDate.setHours(0, 0, 0, 0) // Reset time to start of day

      return purchaseDate.getTime() <= today.getTime()
    })

    // Calculate total cost from current and past purchases only
    const totalCost = currentAndPastPurchases.reduce((sum, payment) => {
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
  // Get current date for filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate date comparison

  // Get all purchases for this item that are on or before today
  const itemPurchases = payments.value.filter(payment => {
    if (payment.type !== 'inventory' || payment.itemName !== item.itemName) {
      return false
    }

    // Parse purchase date
    const parsedDate = paymentService.parsePaymentDate(payment.date)
    if (!parsedDate) return false

    const purchaseDate = new Date(parsedDate.year, parsedDate.month, parsedDate.day)
    purchaseDate.setHours(0, 0, 0, 0) // Reset time to start of day

    // Only include purchases that are on or before today
    return purchaseDate.getTime() <= today.getTime()
  })

  if (itemPurchases.length === 0) {
    return 0
  }

  // Calculate total portions from all purchases
  let totalPortions = 0
  itemPurchases.forEach(purchase => {
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

  itemPurchases.forEach(purchase => {
    // Parse purchase date
    const parsedDate = paymentService.parsePaymentDate(purchase.date)
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
      portionsCount: getPortionsRemaining(item),
      productCost: parseFloat(item.amount.replace('$', '')) || 0,
      depletionDate: getEstimatedDepletionDate(item),
      isTracked: Boolean(item.depletionRate)
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
    const month = MONTH_NAMES_SHORT[nextPurchaseDate.getMonth()]
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

// Annual cost estimation methods for inventory items
export const getAnnualCostFromPurchases = computed(() => {
  return (item: Payment): { cost: number; method: string; details: string } | null => {
    // Get all purchases for this item
    const itemPurchases = payments.value.filter(payment =>
      payment.type === 'inventory' &&
      payment.itemName === item.itemName
    )

    if (itemPurchases.length < 3) {
      return null // Need at least 3 purchases for reliable estimate
    }

    // Sort by date (oldest to newest)
    const sortedPurchases = itemPurchases.sort((a, b) => {
      const dateA = paymentService.parsePaymentDate(a.date)
      const dateB = paymentService.parsePaymentDate(b.date)

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
      const prevDate = paymentService.parsePaymentDate(lastThreePurchases[i-1].date)
      const currDate = paymentService.parsePaymentDate(lastThreePurchases[i].date)

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
      return sum + (parseFloat(purchase.amount.replace('$', '')) || 0)
    }, 0) / lastThreePurchases.length

    // Annual cost = (average cost per purchase / average days between purchases) × 365
    const annualCost = (averageCost / averageInterval) * 365

    return {
      cost: annualCost,
      method: 'Purchase Rate',
      details: `Based on ${lastThreePurchases.length} purchases, avg $${averageCost.toFixed(2)} every ${averageInterval.toFixed(1)} days`
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
      if (payment.type !== 'inventory' || payment.itemName !== item.itemName) {
        return false
      }

      const parsedDate = paymentService.parsePaymentDate(payment.date)
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
      const purchaseCost = parseFloat(purchase.amount.replace('$', '')) || 0
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
        portionsPerYear = item.depletionRate * 12
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
      details: `$${costPerPortion.toFixed(3)}/portion × ${portionsPerYear.toFixed(1)} portions/year`
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
  const useDepletionCost = itemCostMethodPrefs[item.id] || false
  return getCurrentAnnualCost(item, useDepletionCost)
}
