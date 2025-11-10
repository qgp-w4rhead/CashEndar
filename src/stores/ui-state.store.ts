// UI state store for reactive data and modal states
import { ref, reactive } from 'vue'
import { Payment, PaymentType } from '../types/payment.types'

// Calendar state
export const currentDate = ref(new Date())
export const currentMonth = ref(currentDate.value.getMonth())
export const currentYear = ref(currentDate.value.getFullYear())
export const isTransitioning = ref(false)

// Payment data
export const payments = ref<Payment[]>([])
export const paymentTypes = ref<PaymentType[]>([])

// Edit menu state
export const showEditMenu = ref(false)
export const editingPayment = ref<Payment | null>(null)
export const editForm = reactive({
    title: '',
    amount: '',
    type: 'rent',
    frequency: 'recurring' as Payment['frequency'],
    date: '',
    day: 1,
    // Inventory fields
    itemName: '',
    itemSize: undefined,
    itemSizeUnit: 'gram' as Payment['itemSizeUnit'],
    portionSize: undefined,
    portionsCount: undefined,
    depletionRate: undefined,
    depletionUnit: 'day' as Payment['depletionUnit'],
    depletionTime: undefined as number | undefined
})

// Add payment state
export const showAddMenu = ref(false)
export const addForm = reactive({
  title: '',
  amount: '',
  type: 'rent' as Payment['type'],
  day: 1, // Day of month for the payment
  frequency: 'recurring' as Payment['frequency'], // Default to recurring
  // Inventory-specific fields
  itemName: '',
  itemSize: undefined,
  itemSizeUnit: 'gram' as Payment['itemSizeUnit'],
  portionSize: undefined,
  portionsCount: undefined,
  depletionRate: undefined,
  depletionUnit: 'day' as Payment['depletionUnit'],
  depletionTime: undefined as number | undefined
})

// Add payment modal state
export const isSavingPayment = ref(false)
export const saveMessage = ref('')
export const saveMessageType = ref<'success' | 'error' | ''>('')

// Click handlers for calendar days
export const selectedDate = ref<Date | null>(null)
export const selectedDayPayments = ref<Payment[]>([])

// Track if a day is pre-selected (first click) before opening modal (second click)
export const preSelectedDay = ref<number | null>(null)

// Pulsating animation state
export const pulsatingDay = ref<number | null>(null)
export const pulsatingTimer = ref<NodeJS.Timeout | null>(null)

// Payment type management state
export const showPaymentTypeModal = ref(false)
export const editingPaymentType = ref<PaymentType | null>(null)
export const paymentTypeForm = reactive({
  name: '',
  color: '#ef4444' // Default to red
})

// Gear menu state
export const showGearMenu = ref(false)

// Pie chart modal state
export const showPieChartModal = ref(false)

// Item chart modal state
export const showItemChartModal = ref(false)

// Pie chart hover state
export const hoveredSlice = ref<string | null>(null)

// Collapsible sections state
export const isNextPaymentsCollapsed = ref(false)
export const isEarningsCollapsed = ref(false)
export const isInventoryCollapsed = ref(false)

// Modal stack for escape key handling
export const modalStack = ref<string[]>([])

// Forgone payment instances (tracks which specific payment instances are forgone)
export const forgoneInstances = ref<Set<string>>(new Set())
