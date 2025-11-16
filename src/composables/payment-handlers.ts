// Payment handlers for event handling and user interactions
import { watch } from 'vue'
import { Payment } from '../types/payment.types'
import { paymentDB } from '../services/payment-db.service'
import { paymentService } from '../services/payment.service'
import { paymentTypeService } from '../services/payment-type.service'
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
  forgoneInstances
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
        await paymentDB.addPayment(payment)
        payments.value.push(payment)
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
      const allPayments = await paymentDB.getAllPayments()
      for (const payment of allPayments) {
        await paymentDB.deletePayment(payment.id)
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
    await paymentTypeService.deletePaymentType(type, payments.value)
    paymentTypes.value = paymentTypes.value.filter(t => t.id !== type.id)
  } catch (error: any) {
    alert(error.message || 'Error deleting payment type. Please try again.')
  }
}

export const confirmDeletePaymentType = async (type: any) => {
  await deletePaymentType(type)
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
  editForm.amount = originalPayment.amount.replace('$', '')
  editForm.type = originalPayment.type

  // Convert payment date from human-readable format to YYYY-MM-DD for date input
  const parsedDate = paymentService.parsePaymentDate(originalPayment.date)
  if (parsedDate) {
    const { year, month, day } = parsedDate
    // Format as YYYY-MM-DD for HTML date input
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    editForm.date = formattedDate
  } else {
    // Fallback: set to current date if parsing fails
    const today = new Date()
    editForm.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }

  editForm.frequency = originalPayment.frequency || 'recurring' // Use frequency, fallback to recurring for legacy data

  // Initialize inventory fields
  editForm.itemName = originalPayment.itemName || ''
  editForm.itemSize = originalPayment.itemSize || null
  editForm.itemSizeUnit = originalPayment.itemSizeUnit || 'gram'
  editForm.portionSize = originalPayment.portionSize || ''
  editForm.portionsCount = originalPayment.portionsCount || null
  editForm.depletionRate = originalPayment.depletionRate || ''

  showEditMenu.value = true
  openModal('edit')
}

// Close edit menu
export const closeEditMenu = () => {
  showEditMenu.value = false
  editingPayment.value = null
  closeModal('edit')
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
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthName = monthNames[paymentDate.getMonth()]
    const daySuffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
    const humanReadableDate = `${monthName} ${day}${daySuffix}, ${year}`

    // Create updated payment object
    const updatedPayment = {
      ...editingPayment.value,
      title: editForm.title,
      amount: `$${editForm.amount}`,
      type: editForm.type,
      date: humanReadableDate,
      frequency: editForm.frequency,
      // Include inventory fields if type is inventory
      ...(editForm.type === 'inventory' && {
        itemName: editForm.title.trim(),
        itemSize: editForm.itemSize,
        itemSizeUnit: editForm.itemSizeUnit,
        portionSize: editForm.portionSize,
        portionsCount: editForm.portionsCount,
        depletionRate: editForm.depletionRate,
        depletionUnit: editForm.depletionUnit
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

    await paymentDB.updatePayment(updatedPayment)

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
    await paymentDB.deletePayment(editingPayment.value.id)

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

// Find most recent inventory item by name
export const findMostRecentInventoryItem = (itemName: string): Payment | null => {
  const inventoryItems = payments.value.filter(p => p.type === 'inventory' && p.itemName === itemName)

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
    console.log(`Pre-filled inventory fields for "${itemName}" from previous item`)
  }
}

// Open add menu
export const openAddMenu = () => {
  // Reset form to default values
  addForm.title = ''
  addForm.amount = ''
  addForm.type = 'rent'
  // Set default day to current day when no days are selected
  addForm.day = new Date().getDate()
  showAddMenu.value = true
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
      // If no payments, open the add menu
      addForm.title = ''
      addForm.amount = ''
      addForm.type = 'rent'
      showAddMenu.value = true
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
  } catch (error) {
    console.error('Error loading day payments:', error)
    selectedDayPayments.value = []
    showAddMenu.value = true
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
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthName = monthNames[selectedDate.value.getMonth()]
    const day = selectedDate.value.getDate()
    const daySuffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
    return `${monthName} ${day}${daySuffix}`
  } else if (addForm.day) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthName = monthNames[currentMonth.value]
    const daySuffix = addForm.day === 1 ? 'st' : addForm.day === 2 ? 'nd' : addForm.day === 3 ? 'rd' : 'th'
    return `${monthName} ${addForm.day}${daySuffix}`
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
    // Generate a sequential ID for the new payment
    const sequentialId = await paymentDB.getNextPaymentId()
    const newId = sequentialId.toString()

    // Create dynamic date based on current month/year and selected day
    const paymentDate = new Date(currentYear.value, currentMonth.value, addForm.day)
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthName = monthNames[paymentDate.getMonth()]
    const daySuffix = addForm.day === 1 ? 'st' : addForm.day === 2 ? 'nd' : addForm.day === 3 ? 'rd' : 'th'
    const dynamicDate = `${monthName} ${addForm.day}${daySuffix}, ${paymentDate.getFullYear()}`

    // Create new payment object
    const newPayment = {
      id: newId,
      title: addForm.title.trim(),
      amount: `$${parseFloat(addForm.amount).toFixed(2)}`,
      date: dynamicDate,
      type: addForm.type,
      day: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? undefined : addForm.day, // Don't set day for weekly/bi-monthly
      dayOfWeek: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? paymentDate.getDay() : undefined, // Set day of week for weekly/bi-monthly
      referenceDate: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? paymentDate.getTime() : undefined, // Store reference timestamp for weekly/bi-monthly
      frequency: addForm.frequency,
      // Include inventory fields if type is inventory
      ...(addForm.type === 'inventory' && {
        itemName: addForm.title.trim(),
        itemSize: addForm.itemSize,
        itemSizeUnit: addForm.itemSizeUnit,
        portionSize: addForm.portionSize,
        portionsCount: addForm.portionsCount,
        depletionRate: addForm.depletionRate,
        depletionUnit: addForm.depletionUnit
      })
    }

    // Save to IndexedDB
    await paymentDB.addPayment(newPayment)

    // Add to local payments array
    payments.value.push(newPayment)

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
      addForm.type = 'rent'
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

// Load payments from IndexedDB on component mount
export const loadPayments = async () => {
  try {
    const storedPayments = await paymentDB.getAllPayments()
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

// Helper function to format currency amounts to 2 decimal places
export const formatCurrencyAmount = (value: string) => {
  if (!value) return ''

  // Parse the value and limit to 2 decimal places
  const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ''))
  if (isNaN(numericValue)) return ''

  return numericValue.toFixed(2)
}

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
    // Delete from IndexedDB
    await paymentDB.deletePayment(purchase.id)

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
    // Generate a new sequential ID
    const sequentialId = await paymentDB.getNextPaymentId()
    const newId = sequentialId.toString()

    // Create today's date in the payment format - use CURRENT actual date
    const today = new Date()
    console.log('Current date for resupply:', today.toString()) // Debug log

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    const monthName = monthNames[today.getMonth()]
    const day = today.getDate()
    console.log('Day extracted:', day) // Debug log

    const daySuffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
    const dynamicDate = `${monthName} ${day}${daySuffix}, ${today.getFullYear()}`

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
      id: newId,
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

    // Save to IndexedDB
    await paymentDB.addPayment(resupplyPayment)

    // Add to local payments array
    payments.value.push(resupplyPayment)

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

// Initialize component data
export const initializeComponent = async () => {
  await loadPaymentTypes()
  await loadPayments()

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
