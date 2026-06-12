// Payment handlers for event handling and user interactions
import { watch, ref } from 'vue'
import { Payment } from '../types/payment.types'
import { getAllPayments, addPayment as addPaymentToDB, updatePayment as updatePaymentInDB, deletePayment as deletePaymentFromDB } from '../repositories/payment.repository'
import { getNextPaymentId } from '../repositories/counter.repository'
import { paymentService } from '../services/payment.service'
import { paymentTypeService } from '../services/payment-type.service'
import { loadCatalog, backfillCatalogFromPayments } from '../services/catalog.service'
import { isSameItemName } from './payment-computables'
import { MONTH_NAMES_FULL } from '../utils/constants'
import { formatHumanReadableDate, getDaySuffix, parsePaymentDate } from '../utils/date-utils'
import { formatCurrencyAmount as formatCurrencyAmountUtil } from '../utils/validation-utils'
import {
  payments,
  paymentTypes,
  currentMonth,
  currentYear,
  isTransitioning,
  showEditMenu,
  editingPayment,
  editForm,
  showAddMenu,
  addForm,
  isSavingPayment,
  saveMessage,
  saveMessageType,
  selectedDate,
  selectedDayPayments,
  preSelectedDay,
  pulsatingDays,
  pulsatingTimer,
  showPaymentTypeModal,
  editingPaymentType,
  paymentTypeForm,
  showGearMenu,
  showPieChartModal,
  showItemChartModal,
  hoveredSlice,
  modalStack,
  isNextPaymentsCollapsed,
  isEarningsCollapsed,
  isInventoryCollapsed,
  forgoneInstances,
  currentWeekStart
} from '../stores/ui-state.store'

// Modal management functions
export const openModal = (modalName: string) => {
  modalStack.value.push(modalName)
}

export const closeModal = (modalName: string) => {
  const index = modalStack.value.indexOf(modalName)
  if (index !== -1) {
    modalStack.value.splice(index, 1)
  }
}

// Handle escape key to close modals one by one
export const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && modalStack.value.length > 0) {
    const topModal = modalStack.value[modalStack.value.length - 1]

    switch (topModal) {
      case 'edit':
        closeEditMenu()
        break
      case 'unified':
        closeAddMenu()
        break
      case 'paymentType':
        closePaymentTypeModal()
        break
      case 'gear':
        closeGearMenu()
        break
      case 'pieChart':
        closePieChartModal()
        break
      case 'itemChart':
        closeItemChartModal()
        break
    }
  }
}

// Gear menu functionality
export const openGearMenu = () => {
  console.log('Opening gear menu...')
  showGearMenu.value = true
  openModal('gear')
  console.log('Gear menu state:', showGearMenu.value)
}

export const closeGearMenu = () => {
  showGearMenu.value = false
  closeModal('gear')
}

// Gear menu functions
export const exportPayments = () => {
  try {
    const dataStr = JSON.stringify(payments.value, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `payments-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    closeGearMenu()
  } catch (error) {
    console.error('Error exporting payments:', error)
    alert('Error exporting payments. Please try again.')
  }
}

export const importPayments = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedPayments = JSON.parse(text)

      if (!Array.isArray(importedPayments)) {
        throw new Error('Invalid file format')
      }

      // Validate that imported data has the correct structure
      for (const payment of importedPayments) {
        if (!payment.id || !payment.title || !payment.amount || !payment.date || !payment.type) {
          throw new Error('Invalid payment data structure')
        }
      }

      // Clear existing payments
      payments.value.length = 0

      // Add imported payments to database and local array
      for (const payment of importedPayments) {
        const savedPayment = await addPaymentToDB(payment)
        payments.value.push(savedPayment)
      }

      closeGearMenu()
      alert(`Successfully imported ${importedPayments.length} payments`)
    } catch (error) {
      console.error('Error importing payments:', error)
      alert('Error importing payments. Please check the file format.')
    }
  }

  input.click()
}

export const resetCalendarView = () => {
  const now = new Date()
  currentMonth.value = now.getMonth()
  currentYear.value = now.getFullYear()
  selectedDate.value = null
  closeGearMenu()
}

export const clearAllPayments = async () => {
  if (confirm('Are you sure you want to delete all payments? This action cannot be undone.')) {
    try {
      const allPayments = await getAllPayments()
      for (const payment of allPayments) {
        await deletePaymentFromDB(payment.id)
      }
      payments.value = []
      closeGearMenu()
    } catch (error) {
      console.error('Error clearing payments:', error)
      alert('Error clearing payments. Please try again.')
    }
  }
}

// Payment type management methods
export const openPaymentTypeModal = (type?: any) => {
  if (type) {
    editingPaymentType.value = type
    paymentTypeForm.name = type.label
    paymentTypeForm.color = type.color
    paymentTypeForm.isEarning = type.isEarning || false
  } else {
    editingPaymentType.value = null
    paymentTypeForm.name = ''
    paymentTypeForm.color = '#ef4444'
    paymentTypeForm.isEarning = false
  }
  showPaymentTypeModal.value = true
  openModal('paymentType')
}

export const closePaymentTypeModal = () => {
  showPaymentTypeModal.value = false
  editingPaymentType.value = null
  closeModal('paymentType')
}

export const savePaymentType = async () => {
  try {
    const result = await paymentTypeService.savePaymentType(paymentTypeForm, editingPaymentType.value || undefined)

    if (editingPaymentType.value) {
      // Update local array
      const index = paymentTypes.value.findIndex(t => t.id === result.id)
      if (index !== -1) {
        paymentTypes.value[index] = result
      }
    } else {
      paymentTypes.value.push(result)
    }

    closePaymentTypeModal()
  } catch (error: any) {
    alert(error.message || 'Error saving payment type. Please try again.')
  }
}

export const deletePaymentType = async (type: any) => {
  try {
    await paymentTypeService.deletePaymentType(type)
    paymentTypes.value = paymentTypes.value.filter(t => t.id !== type.id)
  } catch (error: any) {
    alert(error.message || 'Error deleting payment type. Please try again.')
  }
}

export const confirmDeletePaymentType = async (type: any) => {
  // Check if any payments use this type
  const paymentsUsingType = payments.value.filter(p => p.type === type.value)
  const paymentCount = paymentsUsingType.length

  // Create confirmation message
  let message = `Are you sure you want to delete the "${type.label}" payment type?`

  if (paymentCount > 0) {
    message += `\n\n⚠️ Warning: ${paymentCount} payment${paymentCount === 1 ? '' : 's'} are associated with this category.`
    message += `\n\n💾 Important: Consider backing up your payments first using the "Export Payments" option to avoid losing data.`
  }

  message += `\n\nThis action cannot be undone.`

  if (confirm(message)) {
    await deletePaymentType(type)
  }
}

export const saveNewPaymentType = async () => {
  if (!paymentTypeForm.name.trim()) return

  try {
    const newType = await paymentTypeService.savePaymentType(paymentTypeForm)

    paymentTypes.value.push(newType)

    // Reset form
    paymentTypeForm.name = ''
    paymentTypeForm.color = '#ef4444'
    paymentTypeForm.isEarning = false

    console.log('New payment type added:', newType)
  } catch (error: any) {
    console.error('Error saving new payment type:', error)
    alert(error.message || 'Error adding payment type. Please try again.')
  }
}

// Add "+" button handlers for both locations
export const addPaymentTypeFromEdit = () => {
  openPaymentTypeModal()
}

export const addPaymentTypeFromAdd = () => {
  openPaymentTypeModal()
}

// Handle "Manage Payment Types" button click
export const handleManagePaymentTypes = () => {
  console.log('Manage Payment Types clicked')
  console.log('Payment types available:', paymentTypes.value.length)
  openPaymentTypeModal()
}

// Open edit menu for a specific payment
export const openEditMenu = (payment: any) => {
  // Handle recurring payment instances - find the original payment
  let originalPayment = payment
  if (payment.id.includes('-')) {
    // This is a recurring payment instance (e.g., "123-5")
    const originalId = payment.id.split('-')[0] // Extract original ID (e.g., "123")
    originalPayment = payments.value.find(p => p.id === originalId) || payment
  }

  editingPayment.value = originalPayment
  editForm.title = originalPayment.title

  // For inventory items, autopopulate with average purchase price
  if (originalPayment.type === 'inventory' && originalPayment.itemName) {
    // Get all purchases for this item
    const itemPurchases = payments.value.filter(p =>
      p.type === 'inventory' &&
      p.itemName === originalPayment.itemName
    )

    if (itemPurchases.length > 0) {
      // Calculate average purchase price
      const totalAmount = itemPurchases.reduce((sum, purchase) => {
        return sum + (parseFloat(purchase.amount.replace('$', '')) || 0)
      }, 0)

      const averageAmount = totalAmount / itemPurchases.length
      editForm.amount = String(+averageAmount.toFixed(2))
    } else {
      // Fallback to original amount if no purchases found
      editForm.amount = originalPayment.amount.replace('$', '')
    }
  } else {
    // For non-inventory items, use original behavior
    editForm.amount = originalPayment.amount.replace('$', '')
  }
  
  // Populate form with existing payment data (but don't override amount that was set above)
  editForm.title = originalPayment.title || ''
  editForm.type = originalPayment.type || 'rent'
  editForm.frequency = originalPayment.frequency || 'recurring'
  
  // Convert date to YYYY-MM-DD format for date input
  if (originalPayment.date) {
    const parsedDate = paymentService.parsePaymentDate(originalPayment.date)
    if (parsedDate) {
      editForm.date = `${parsedDate.year}-${String(parsedDate.month + 1).padStart(2, '0')}-${String(parsedDate.day).padStart(2, '0')}`
    } else {
      editForm.date = ''
    }
  } else {
    editForm.date = ''
  }
  
  editForm.day = originalPayment.day || 1
  
  // Handle inventory-specific fields
  if (originalPayment.type === 'inventory') {
    editForm.itemName = originalPayment.itemName || ''
    editForm.brand = originalPayment.brand || ''
    editForm.itemSize = originalPayment.itemSize || ''
    editForm.itemSizeUnit = originalPayment.itemSizeUnit || 'gram'
    editForm.portionSize = originalPayment.portionSize || ''
    editForm.portionsCount = originalPayment.portionsCount || null
    editForm.depletionRate = originalPayment.depletionRate || ''
    editForm.depletionUnit = originalPayment.depletionUnit || 'day'
    
    // Initialize expiration fields - preserve shelf life, reset offset
    editForm.expirationPeriod = originalPayment.expirationPeriod || null
    editForm.expirationUnit = originalPayment.expirationUnit || 'day'
    editForm.freshnessOffset = null // Always reset offset
    editForm.freshnessOffsetUnit = 'day' // Reset to default unit
  }

  showEditMenu.value = true
  openModal('edit')
}
// Close edit menu
export const closeEditMenu = () => {
  showEditMenu.value = false
  editingPayment.value = null
  closeModal('edit')
}

// Helper function to calculate expiration date
export const calculateExpirationDate = (purchaseDate: string, expirationPeriod: number, expirationUnit: string, freshnessOffset?: number, freshnessOffsetUnit?: string): string => {
  const parsedDate = paymentService.parsePaymentDate(purchaseDate)
  if (!parsedDate) return ''
  
  const { year, month, day } = parsedDate
  const date = new Date(year, month, day)
  
  // Convert expiration period to days
  let daysToAdd = 0
  switch (expirationUnit) {
    case 'day':
      daysToAdd = expirationPeriod
      break
    case 'week':
      daysToAdd = expirationPeriod * 7
      break
    case 'month':
      daysToAdd = expirationPeriod * 30 // Approximate
      break
    case 'year':
      daysToAdd = expirationPeriod * 365
      break
    default:
      daysToAdd = expirationPeriod
  }
  
  // Convert freshness offset to days
  let daysToSubtract = 0
  if (freshnessOffset && freshnessOffsetUnit) {
    switch (freshnessOffsetUnit) {
      case 'day':
        daysToSubtract = freshnessOffset
        break
      case 'week':
        daysToSubtract = freshnessOffset * 7
        break
      case 'month':
        daysToSubtract = freshnessOffset * 30 // Approximate
        break
      case 'year':
        daysToSubtract = freshnessOffset * 365
        break
      default:
        daysToSubtract = freshnessOffset
    }
  }
  
  // Apply freshness offset
  const effectiveDaysToAdd = Math.max(0, daysToAdd - daysToSubtract)
  
  // Calculate expiration date
  const expirationDate = new Date(date.getTime() + (effectiveDaysToAdd * 24 * 60 * 60 * 1000))
  
  // Format as YYYY-MM-DD
  return `${expirationDate.getFullYear()}-${String(expirationDate.getMonth() + 1).padStart(2, '0')}-${String(expirationDate.getDate()).padStart(2, '0')}`
}

// Save payment changes
export const savePayment = async () => {
  if (!editingPayment.value) return

  try {
    // Check if the date has changed
    const originalDate = editingPayment.value.date
    const newDate = editForm.date
    const dateChanged = originalDate !== newDate

    // Check if the frequency has changed
    const originalFrequency = editingPayment.value.frequency
    const newFrequency = editForm.frequency
    const frequencyChanged = originalFrequency !== newFrequency

    // Convert the date back to human-readable format for storage
    const dateString = editForm.date // Format: "2025-10-07"
    const [year, month, day] = dateString.split('-').map(Number)
    const paymentDate = new Date(year, month - 1, day) // month is 0-indexed
    const humanReadableDate = formatHumanReadableDate(year, month - 1, day)

    // Calculate total amount from cost × quantity (quantity defaults to 1)
    const costAmount = parseFloat(editForm.amount) || 0;
    const quantity = Math.max(1, editForm.quantity || 1); // Ensure minimum of 1
    const totalAmount = costAmount * quantity;

    // Create updated payment object
    const updatedPayment = {
      ...editingPayment.value,
      title: editForm.title,
      amount: `$${+totalAmount.toFixed(2)}`,
      type: editForm.type,
      date: humanReadableDate,
      frequency: editForm.frequency,
      // Include inventory fields if type is inventory
      ...(editForm.type === 'inventory' && {
        itemName: editForm.title.trim(),
        brand: editForm.brand.trim() || undefined,
        quantity: quantity,
        unitCost: costAmount,
        itemSize: editForm.itemSize,
        itemSizeUnit: editForm.itemSizeUnit,
        portionSize: editForm.portionSize,
        portionsCount: editForm.portionsCount,
        depletionRate: editForm.depletionRate,
        depletionUnit: editForm.depletionUnit,
        // Include expiration fields
        expirationPeriod: editForm.expirationPeriod,
        expirationUnit: editForm.expirationUnit,
        freshnessOffset: editForm.freshnessOffset,
        freshnessOffsetUnit: editForm.freshnessOffsetUnit,
        calculatedExpirationDate: editForm.expirationPeriod && editForm.expirationUnit ? 
          calculateExpirationDate(humanReadableDate, editForm.expirationPeriod, editForm.expirationUnit, editForm.freshnessOffset, editForm.freshnessOffsetUnit) : undefined
      })
    }

    // Clear inventory fields if type was changed from inventory to something else
    if (editingPayment.value.type === 'inventory' && editForm.type !== 'inventory') {
      updatedPayment.itemName = undefined
      updatedPayment.portionSize = undefined
      updatedPayment.portionsCount = undefined
      updatedPayment.depletionRate = undefined
    }

    // Update day and reference date based on new frequency and date
    if (frequencyChanged || dateChanged) {
      // Parse the date input correctly to avoid timezone issues
      // HTML date inputs return YYYY-MM-DD format, parse it as local date
      const dateString = editForm.date // Format: "2025-10-07"
      const [year, month, day] = dateString.split('-').map(Number)

      // Create date in local timezone to avoid day shifting
      const paymentDate = new Date(year, month - 1, day) // month is 0-indexed
      const dayOfMonth = paymentDate.getDate()
      const dayOfWeek = paymentDate.getDay()

      if (editForm.frequency === 'weekly' || editForm.frequency === 'bi-monthly') {
        // For weekly and bi-monthly payments, use reference date and day of week
        updatedPayment.day = undefined // Clear day for weekly/bi-monthly
        updatedPayment.dayOfWeek = dayOfWeek
        updatedPayment.referenceDate = paymentDate.getTime()
      } else {
        // For recurring and one-time payments, use day of month
        updatedPayment.day = dayOfMonth
        updatedPayment.dayOfWeek = undefined
        updatedPayment.referenceDate = undefined
      }
    }

    await updatePaymentInDB(updatedPayment)

    // Update local payments array immediately
    const paymentIndex = payments.value.findIndex(p => p.id === editingPayment.value!.id)
    if (paymentIndex !== -1) {
      payments.value[paymentIndex] = updatedPayment
    }

    // Update selectedDayPayments array if it exists there
    const dayPaymentIndex = selectedDayPayments.value.findIndex(p => p.id === editingPayment.value!.id)
    if (dayPaymentIndex !== -1) {
      selectedDayPayments.value[dayPaymentIndex] = updatedPayment
    }

    // Force reactivity update for frequency changes
    payments.value = [...payments.value]

    // If date or frequency changed, trigger calendar position update
    if (dateChanged || frequencyChanged) {
      // Force calendar to re-render by updating current month/year
      // This will trigger the computed properties to recalculate
      const currentMonthCopy = currentMonth.value
      const currentYearCopy = currentYear.value
      currentMonth.value = currentMonthCopy
      currentYear.value = currentYearCopy

      // Show visual feedback that the payment position has been updated
      console.log(`Payment "${updatedPayment.title}" repositioned in calendar from ${originalDate} to ${newDate}`)

      // If the payment was moved to a different day, highlight the new day
      if (dateChanged) {
        const newDateInfo = paymentService.parsePaymentDate(newDate)
        if (newDateInfo && newDateInfo.day) {
          highlightPaymentDay(updatedPayment)
        }
      }
    }

    closeEditMenu()
  } catch (error) {
    console.error('Error updating payment:', error)
  }
}

// Delete payment
export const deletePayment = async () => {
  if (!editingPayment.value) return

  try {
    // Delete the specific payment (works for both regular payments and inventory items)
    await deletePaymentFromDB(editingPayment.value.id)

    // Remove from local payments array
    const paymentIndex = payments.value.findIndex(p => p.id === editingPayment.value!.id)
    if (paymentIndex !== -1) {
      payments.value.splice(paymentIndex, 1)
    }

    // Remove the deleted payment from selectedDayPayments array
    selectedDayPayments.value = selectedDayPayments.value.filter(p => p.id !== editingPayment.value!.id)

    // Re-populate selectedDayPayments to ensure it reflects the current state
    if (selectedDate.value) {
      const day = selectedDate.value.getDate()
      const dayPaymentList = paymentService.getPaymentsForDay(payments.value, day, currentMonth.value, currentYear.value)
      selectedDayPayments.value = dayPaymentList
    }

    // Force reactivity update for inventory section and other computed properties
    payments.value = [...payments.value]

    closeEditMenu()
  } catch (error) {
    console.error('Error deleting payment:', error)
  }
}

// Get payment title suggestions matching a query (case-insensitive grep)
// Returns unique titles with their most recent payment for autofill
export const getPaymentSuggestions = (query: string, filterType?: string): Payment[] => {
  if (!query || query.length < 3) return []

  const lowerQuery = query.toLowerCase()

  // Filter payments by query and optional type
  const filtered = payments.value.filter(p => {
    const matchesQuery = p.title.toLowerCase().includes(lowerQuery)
    const matchesType = filterType ? p.type === filterType : true
    return matchesQuery && matchesType
  })

  // Deduplicate by title, keeping only the most recent per title
  const titleMap = new Map<string, Payment>()
  filtered.forEach(p => {
    const existing = titleMap.get(p.title)
    if (!existing) {
      titleMap.set(p.title, p)
    } else {
      const dateA = paymentService.parsePaymentDate(existing.date)
      const dateB = paymentService.parsePaymentDate(p.date)
      if (dateA && dateB) {
        const a = new Date(dateA.year, dateA.month, dateA.day)
        const b = new Date(dateB.year, dateB.month, dateB.day)
        if (b > a) titleMap.set(p.title, p)
      }
    }
  })

  return Array.from(titleMap.values()).slice(0, 8)
}

// Autofill payment form fields from a selected suggestion
export const autofillPaymentForm = (payment: Payment) => {
  addForm.title = payment.title
  addForm.amount = payment.amount.replace(/[^0-9.]/g, '')
  addForm.type = payment.type
  addForm.frequency = payment.frequency
}

// Find most recent inventory item by name
export const findMostRecentInventoryItem = (itemName: string): Payment | null => {
  const inventoryItems = payments.value.filter(p => p.type === 'inventory' && isSameItemName(p.itemName, itemName))

  if (inventoryItems.length === 0) return null

  // Sort by date (most recent first)
  const sortedItems = inventoryItems.sort((a, b) => {
    const dateA = paymentService.parsePaymentDate(a.date)
    const dateB = paymentService.parsePaymentDate(b.date)
    if (!dateA || !dateB) return 0
    const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
    const dateObjB = new Date(dateB.year, dateB.month, dateB.day)
    return dateObjB.getTime() - dateObjA.getTime()
  })

  return sortedItems[0]
}

// Pre-fill inventory fields from most recent item
export const prefillInventoryFields = (itemName: string) => {
  const mostRecentItem = findMostRecentInventoryItem(itemName)

  if (mostRecentItem) {
    addForm.itemSize = mostRecentItem.itemSize
    addForm.itemSizeUnit = mostRecentItem.itemSizeUnit || 'gram'
    addForm.portionSize = mostRecentItem.portionSize
    addForm.portionsCount = mostRecentItem.portionsCount
    addForm.depletionRate = mostRecentItem.depletionRate
    addForm.depletionUnit = mostRecentItem.depletionUnit || 'day'
    
    // Preserve shelf life (expiration period and unit) but reset offset
    addForm.expirationPeriod = mostRecentItem.expirationPeriod
    addForm.expirationUnit = mostRecentItem.expirationUnit || 'day'
    addForm.freshnessOffset = null // Always reset offset
    addForm.freshnessOffsetUnit = 'day' // Reset to default unit
    
    console.log(`Pre-filled inventory fields for "${itemName}" from previous item`)
  }
}

// Open add menu
export const openAddMenu = () => {
  // Reset form to default values completely
  addForm.title = ''
  addForm.amount = ''
  addForm.type = 'credit'
  addForm.frequency = 'one-time'
  addForm.day = new Date().getDate()
  addForm.quantity = 1
  
  // Reset inventory-specific fields to prevent carrying over previous data
  addForm.itemName = ''
  addForm.brand = ''
  addForm.itemSize = undefined
  addForm.itemSizeUnit = 'gram'
  addForm.portionSize = undefined
  addForm.portionsCount = undefined
  addForm.depletionRate = undefined
  addForm.depletionUnit = 'day'
  addForm.depletionTime = undefined
  
  // Reset expiration fields
  addForm.expirationPeriod = undefined
  addForm.expirationUnit = 'day'
  addForm.freshnessOffset = undefined
  addForm.freshnessOffsetUnit = 'day'
  
  showAddMenu.value = true
  openModal('unified')
}

// Close add menu
export const closeAddMenu = () => {
  showAddMenu.value = false
}

// Handle day click
export const handleDayClick = (dateInfo: any) => {
  // Navigate to the correct month if clicking on other month days
  if (!dateInfo.isCurrentMonth) {
    // Update current month/year to match the clicked date
    currentMonth.value = dateInfo.date.getMonth()
    currentYear.value = dateInfo.date.getFullYear()
  }

  // Create the date for the clicked day in the current month/year context
  const clickedDate = new Date(currentYear.value, currentMonth.value, dateInfo.day)

  // Check if this day has payments using the comprehensive getPaymentsForDay function
  const dayPaymentsList = paymentService.getPaymentsForDay(payments.value, dateInfo.day, currentMonth.value, currentYear.value)
  const hasPayments = dayPaymentsList.length > 0

  // Always update the selected day state when clicking on any day
  selectedDate.value = clickedDate
  addForm.day = dateInfo.day

  // Check if this is the second click on the same day (pre-selected day)
  if (preSelectedDay.value === dateInfo.day) {
    // Second click - open the modal
    preSelectedDay.value = null // Reset pre-selection

    // Clear previous day payments before loading new ones
    selectedDayPayments.value = []

    if (hasPayments) {
      // If day has payments, show the day payments modal
      showDayPaymentsForDay(dateInfo.day)
    } else {
      // If no payments, open the add menu with properly reset form
      addForm.title = ''
      addForm.amount = ''
      addForm.type = 'credit'
      addForm.frequency = 'one-time'
      addForm.day = dateInfo.day
      addForm.quantity = 1
      
      // Reset inventory-specific fields to prevent carrying over previous data
      addForm.itemName = ''
      addForm.brand = ''
      addForm.itemSize = undefined
      addForm.itemSizeUnit = 'gram'
      addForm.portionSize = undefined
      addForm.portionsCount = undefined
      addForm.depletionRate = undefined
      addForm.depletionUnit = 'day'
      addForm.depletionTime = undefined
      
      // Reset expiration fields
      addForm.expirationPeriod = undefined
      addForm.expirationUnit = 'day'
      addForm.freshnessOffset = undefined
      addForm.freshnessOffsetUnit = 'day'
      
      showAddMenu.value = true
      openModal('unified')
    }
  } else {
    // First click - just pre-select the day
    preSelectedDay.value = dateInfo.day
  }
}

// Show day payments in unified modal
export const showDayPaymentsForDay = async (day: number) => {
  try {
    // Use the comprehensive getPaymentsForDay function instead of IndexedDB query
    const dayPaymentList = paymentService.getPaymentsForDay(payments.value, day, currentMonth.value, currentYear.value)
    selectedDayPayments.value = dayPaymentList
    showAddMenu.value = true // Open the unified modal
    openModal('unified')
  } catch (error) {
    console.error('Error loading day payments:', error)
    selectedDayPayments.value = []
    showAddMenu.value = true
    openModal('unified')
  }
}

// Reset day payments when closing modal
export const resetDayPayments = () => {
  selectedDayPayments.value = []
}

// Get selected day date for display
export const getSelectedDayDate = () => {
  // Use selectedDate if available, otherwise fall back to addForm.day
  if (selectedDate.value) {
    const day = selectedDate.value.getDate()
    return `${MONTH_NAMES_FULL[selectedDate.value.getMonth()]} ${day}${getDaySuffix(day)}`
  } else if (addForm.day) {
    return `${MONTH_NAMES_FULL[currentMonth.value]} ${addForm.day}${getDaySuffix(addForm.day)}`
  }
  return 'Selected Day'
}

// Save new payment
export const saveNewPayment = async () => {
  // Validation
  if (!addForm.title.trim()) {
    showMessage('Please enter a payment title', 'error')
    return
  }

  if (!addForm.amount || parseFloat(addForm.amount) <= 0) {
    showMessage('Please enter a valid amount greater than 0', 'error')
    return
  }

  if (!addForm.day || addForm.day < 1 || addForm.day > 31) {
    showMessage('Please select a valid day (1-31)', 'error')
    return
  }

  // Set loading state
  isSavingPayment.value = true
  saveMessage.value = ''
  saveMessageType.value = ''

  try {
    // Generate a temporary ID — server will assign the real MongoDB _id
    const tempId = await getNextPaymentId()

    // Create dynamic date based on current month/year and selected day
    const paymentDate = new Date(currentYear.value, currentMonth.value, addForm.day)
    const dynamicDate = formatHumanReadableDate(paymentDate.getFullYear(), paymentDate.getMonth(), addForm.day)

    // Calculate total amount from cost × quantity (quantity defaults to 1)
    const costAmount = parseFloat(addForm.amount) || 0;
    const quantity = Math.max(1, addForm.quantity || 1); // Ensure minimum of 1
    const totalAmount = costAmount * quantity;

    // Create new payment object
    const newPayment = {
      id: tempId,
      title: addForm.title.trim(),
      amount: `$${+totalAmount.toFixed(2)}`,
      date: dynamicDate,
      type: addForm.type,
      day: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? undefined : addForm.day, // Don't set day for weekly/bi-monthly
      dayOfWeek: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? paymentDate.getDay() : undefined, // Set day of week for weekly/bi-monthly
      referenceDate: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? paymentDate.getTime() : undefined, // Store reference timestamp for weekly/bi-monthly
      frequency: addForm.frequency,
      // Include inventory fields if type is inventory
      ...(addForm.type === 'inventory' && {
        itemName: addForm.title.trim(),
        brand: addForm.brand.trim() || undefined,
        quantity: quantity,
        unitCost: costAmount,
        itemSize: addForm.itemSize,
        itemSizeUnit: addForm.itemSizeUnit,
        portionSize: addForm.portionSize,
        portionsCount: addForm.portionsCount,
        depletionRate: addForm.depletionRate,
        depletionUnit: addForm.depletionUnit,
        // Include expiration fields
        expirationPeriod: addForm.expirationPeriod,
        expirationUnit: addForm.expirationUnit,
        freshnessOffset: addForm.freshnessOffset,
        freshnessOffsetUnit: addForm.freshnessOffsetUnit,
        calculatedExpirationDate: addForm.expirationPeriod && addForm.expirationUnit ? 
          calculateExpirationDate(dynamicDate, addForm.expirationPeriod, addForm.expirationUnit, addForm.freshnessOffset, addForm.freshnessOffsetUnit) : undefined
      })
    }

    console.log('Attempting to save new payment:', newPayment)

    try {
      // Save to MongoDB via API
      const savedPayment = await addPaymentToDB(newPayment)
      console.log('Payment saved successfully')
      // Add to local payments array using server-returned payment (with real MongoDB ID)
      payments.value.push(savedPayment)
    } catch (dbError) {
      console.error('Database addPayment failed:', dbError)
      throw dbError // Re-throw to be caught by outer catch
    }

    // Show success message
    showMessage(`Payment "${addForm.title}" saved successfully!`, 'success')

    // Close modal and reset form after a brief delay to show the success message
    setTimeout(() => {
      closeAddMenu()
      resetDayPayments()
      selectedDate.value = null

      // Reset form
      addForm.title = ''
      addForm.amount = ''
      addForm.type = 'credit'
      addForm.day = 1
      addForm.frequency = 'one-time'

      // Clear messages and loading state
      isSavingPayment.value = false
      saveMessage.value = ''
      saveMessageType.value = ''
    }, 1500)

  } catch (error) {
    console.error('Error saving new payment:', error)
    showMessage('Error saving payment. Please try again.', 'error')
    isSavingPayment.value = false
  }
}

// Helper function to show messages to user
export const showMessage = (message: string, type: 'success' | 'error') => {
  saveMessage.value = message
  saveMessageType.value = type

  // Auto-clear error messages after 3 seconds, success messages after 2 seconds
  const timeout = type === 'error' ? 3000 : 2000
  setTimeout(() => {
    if (saveMessage.value === message) {
      saveMessage.value = ''
      saveMessageType.value = ''
    }
  }, timeout)
}

// Highlight payment day with pulsating animation
export const highlightPaymentDay = (payment: any) => {
  // Clear any existing timer to prevent interruptions
  if (pulsatingTimer.value) {
    clearTimeout(pulsatingTimer.value)
    pulsatingTimer.value = null
  }

  // Clear existing pulsating days
  pulsatingDays.value.clear()

  // Get the base payment ID (remove instance suffix like "-0", "-1", etc.)
  const basePaymentId = payment.id.split('-')[0]

  // Loop through all days in the current month to find days with this specific payment
  for (let day = 1; day <= 31; day++) {
    // Check if this day has the specific payment (or its instances)
    const dayPayments = paymentService.getPaymentsForDay(payments.value, day, currentMonth.value, currentYear.value)

    // Check if any of the payments on this day match the base payment ID
    const hasMatchingPayment = dayPayments.some(p => p.id.startsWith(basePaymentId + '-') || p.id === basePaymentId)

    if (hasMatchingPayment) {
      pulsatingDays.value.add(day)
    }
  }

  // Stop the animation after 3 seconds
  pulsatingTimer.value = setTimeout(() => {
    pulsatingDays.value.clear()
    pulsatingTimer.value = null
  }, 3000)
}

// Calendar navigation functions
export const navigateWeek = (direction: 'prev' | 'next') => {
  // Start transition animation
  isTransitioning.value = true

  // Update week after a brief delay to allow fade out
  setTimeout(() => {
    const currentWeek = new Date(currentWeekStart.value)
    if (direction === 'prev') {
      currentWeek.setDate(currentWeek.getDate() - 7)
    } else {
      currentWeek.setDate(currentWeek.getDate() + 7)
    }
    currentWeekStart.value = currentWeek

    // End transition animation after week update
    setTimeout(() => {
      isTransitioning.value = false
    }, 200)
  }, 200)
}

export const navigateMonth = (direction: 'prev' | 'next') => {
  // Start transition animation
  isTransitioning.value = true

  // Update month after a brief delay to allow fade out
  setTimeout(() => {
    if (direction === 'prev') {
      if (currentMonth.value === 0) {
        currentMonth.value = 11
        currentYear.value--
      } else {
        currentMonth.value--
      }
    } else {
      if (currentMonth.value === 11) {
        currentMonth.value = 0
        currentYear.value++
      } else {
        currentMonth.value++
      }
    }

    // End transition animation after month update
    setTimeout(() => {
      isTransitioning.value = false
    }, 200)
  }, 200)
}

// Navigate to previous month
export const goToPrevMonth = () => navigateMonth('prev')

// Navigate to next month
export const goToNextMonth = () => navigateMonth('next')

// Navigate to previous week
export const goToPrevWeek = () => navigateWeek('prev')

// Navigate to next week
export const goToNextWeek = () => navigateWeek('next')

// Next payments section functions
export const toggleNextPaymentsSection = () => {
  isNextPaymentsCollapsed.value = !isNextPaymentsCollapsed.value
}

// Earnings section functions
export const toggleEarningsSection = () => {
  isEarningsCollapsed.value = !isEarningsCollapsed.value
}

// Inventory section functions
export const toggleInventorySection = () => {
  isInventoryCollapsed.value = !isInventoryCollapsed.value
}

// Pie chart modal functions
export const togglePieChart = () => {
  showPieChartModal.value = !showPieChartModal.value
  if (showPieChartModal.value) {
    openModal('pieChart')
  } else {
    closeModal('pieChart')
  }
}

export const closePieChartModal = () => {
  showPieChartModal.value = false
  closeModal('pieChart')
}

// Item chart modal functions
export const toggleItemChart = () => {
  showItemChartModal.value = !showItemChartModal.value
  if (showItemChartModal.value) {
    openModal('itemChart')
  } else {
    closeModal('itemChart')
  }
}

export const closeItemChartModal = () => {
  showItemChartModal.value = false
  closeModal('itemChart')
}

// Load payments from MongoDB on component mount
export const loadPayments = async () => {
  try {
    const storedPayments = await getAllPayments()
    payments.value = storedPayments
  } catch (error) {
    console.error('Error loading payments:', error)
    payments.value = []
  }
}

// Load payment types from database
export const loadPaymentTypes = async () => {
  try {
    const types = await paymentTypeService.loadPaymentTypes()
    paymentTypes.value = types
  } catch (error) {
    console.error('Error loading payment types:', error)
    paymentTypes.value = []
  }
}

// Re-export from shared utility (preserves public API)
export const formatCurrencyAmount = formatCurrencyAmountUtil

// Helper function to handle amount input blur events
export const handleAmountInputBlur = (event: Event) => {
  const target = event.target as HTMLInputElement
  const currentValue = target.value
  if (currentValue) {
    target.value = formatCurrencyAmount(currentValue)
    // Trigger input event to update v-model binding
    target.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

// Helper function to handle amount input key events (Enter key)
export const handleAmountInputKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    const target = event.target as HTMLInputElement
    const currentValue = target.value
    if (currentValue) {
      target.value = formatCurrencyAmount(currentValue)
      // Trigger input event to update v-model binding
      target.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }
}

// Delete a single purchase entry (for inventory history management)
export const deleteSinglePurchase = async (purchase: Payment) => {
  if (!confirm('Are you sure you want to delete this purchase entry?')) {
    return
  }

  try {
    // Delete from MongoDB via API
    await deletePaymentFromDB(purchase.id)

    // Remove from local payments array
    const paymentIndex = payments.value.findIndex(p => p.id === purchase.id)
    if (paymentIndex !== -1) {
      payments.value.splice(paymentIndex, 1)
    }

    // Show success message
    showMessage('Purchase entry deleted successfully', 'success')

    console.log('Purchase entry deleted:', purchase)
  } catch (error) {
    console.error('Error deleting purchase entry:', error)
    showMessage('Error deleting purchase entry. Please try again.', 'error')
  }
}

// Add resupply function for inventory items
export const addResupply = async (itemName: string) => {
  try {
    // Generate a temporary ID — server will assign the real MongoDB _id
    const tempId = await getNextPaymentId()

    // Use selected date if available (when modal is open for a specific day), otherwise use today
    let paymentDate: Date
    if (selectedDate.value) {
      paymentDate = selectedDate.value
      console.log('Using selected date for resupply:', paymentDate.toString())
    } else {
      paymentDate = new Date()
      console.log('Using today\'s date for resupply:', paymentDate.toString())
    }

    const day = paymentDate.getDate()
    console.log('Day extracted:', day) // Debug log

    const dynamicDate = formatHumanReadableDate(paymentDate.getFullYear(), paymentDate.getMonth(), day)

    console.log('Generated resupply date:', dynamicDate) // Debug log

    // Find all existing items of the same name to aggregate data from
    const existingItems = payments.value.filter(p => p.type === 'inventory' && p.itemName === itemName)

    // Get the most recent item as the base for copying details
    const sortedItems = existingItems.sort((a, b) => {
      const dateA = paymentService.parsePaymentDate(a.date)
      const dateB = paymentService.parsePaymentDate(b.date)
      if (!dateA || !dateB) return 0
      const dateObjA = new Date(dateA.year, dateA.month, dateA.day)
      const dateObjB = new Date(dateB.year, dateB.month, dateB.day)
      return dateObjB.getTime() - dateObjA.getTime()
    })

    const mostRecentItem = sortedItems[0] // Most recent purchase of this item

    if (!mostRecentItem) {
      console.error('No existing items found to resupply from')
      return
    }

    // Create new resupply payment with the same details but today's date
    const resupplyPayment: Payment = {
      id: tempId,
      title: itemName,
      amount: mostRecentItem.amount, // Copy the amount from most recent item
      date: dynamicDate,
      type: 'inventory',
      frequency: 'one-time' as const, // Resupply entries are one-time
      day: day, // Set day to today's day for one-time payment
      dayOfWeek: undefined, // Not needed for one-time payments
      referenceDate: undefined, // Not needed for one-time payments
      itemName: itemName,
      itemSize: mostRecentItem.itemSize,
      itemSizeUnit: mostRecentItem.itemSizeUnit,
        portionSize: mostRecentItem.portionSize,
        portionsCount: mostRecentItem.portionsCount,
        depletionRate: mostRecentItem.depletionRate,
        depletionUnit: mostRecentItem.depletionUnit
    }

    // Save to MongoDB via API
    const savedResupply = await addPaymentToDB(resupplyPayment)

    // Add to local payments array using server-returned payment (with real MongoDB ID)
    payments.value.push(savedResupply)

    // Keep the modal open so user can see updated purchase history
    console.log('Resupply added successfully with date:', dynamicDate)
  } catch (error) {
    console.error('Error adding resupply:', error)
  }
}

// Toggle forgo status for a payment instance
export const toggleForgoPayment = async (payment: Payment) => {
  try {
    // For recurring payments, we track specific instances by their generated ID
    // For one-time payments, we can still use the base payment ID
    const instanceId = payment.id

    if (forgoneInstances.value.has(instanceId)) {
      // Remove from forgone instances (unforgo)
      forgoneInstances.value.delete(instanceId)
      console.log(`Payment instance "${payment.title}" (${instanceId}) unforgone`)
    } else {
      // Add to forgone instances (forgo)
      forgoneInstances.value.add(instanceId)
      console.log(`Payment instance "${payment.title}" (${instanceId}) forgone`)
    }

    // Force reactivity update
    forgoneInstances.value = new Set(forgoneInstances.value)

    // Note: We don't modify the payment object itself since for recurring payments,
    // the instances are generated on-the-fly and don't persist in the database
  } catch (error) {
    console.error('Error toggling forgo status:', error)
  }
}

// Open add menu with inventory type pre-selected (for purple button)
export const openInventoryAddMenu = () => {
  // Reset form to default values but set type to 'inventory'
  addForm.title = ''
  addForm.amount = ''
  addForm.type = 'inventory'
  // Set default day to current day when no days are selected
  addForm.day = new Date().getDate()
  showAddMenu.value = true
  openModal('unified')
}

// Initialize component data
export const initializeComponent = async () => {
  await loadPaymentTypes()
  await loadPayments()
  await loadCatalog()
  await backfillCatalogFromPayments(payments.value)

  // Set up reactive watcher for inventory pre-filling
  watch(() => addForm.title, (newTitle) => {
    if (addForm.type === 'inventory' && newTitle.trim()) {
      prefillInventoryFields(newTitle.trim())
    }
  })

  watch(() => addForm.type, (newType) => {
    // Clear inventory fields when type changes away from inventory
    if (newType !== 'inventory') {
      addForm.itemSize = undefined
      addForm.itemSizeUnit = 'gram'
      addForm.portionSize = undefined
      addForm.portionsCount = undefined
      addForm.depletionRate = undefined
      addForm.depletionUnit = 'day'
    } else if (addForm.title.trim()) {
      // Pre-fill if switching to inventory and title is already set
      prefillInventoryFields(addForm.title.trim())
    }
  })
}

// Date picker visibility state
const showDatePicker = ref(false)

// Open date picker to allow users to change the selected date
export const openDatePicker = () => {
  showDatePicker.value = true
}

// Close date picker
export const closeDatePicker = () => {
  showDatePicker.value = false
}

// Handle date selection from the custom date picker
export const handleDateSelection = (newDate: Date) => {
  if (!isNaN(newDate.getTime())) {
    // Update the selected date
    selectedDate.value = newDate
    
    // Update current month and year to match the new date
    currentMonth.value = newDate.getMonth()
    currentYear.value = newDate.getFullYear()
    
    // Update the add form day
    addForm.day = newDate.getDate()
    
    // Clear and reload payments for the new selected day
    selectedDayPayments.value = []
    const dayPaymentsList = paymentService.getPaymentsForDay(
      payments.value, 
      newDate.getDate(), 
      currentMonth.value, 
      currentYear.value
    )
    selectedDayPayments.value = dayPaymentsList
  }
  
  closeDatePicker()
}

// Export the date picker visibility state for use in components
export { showDatePicker }
