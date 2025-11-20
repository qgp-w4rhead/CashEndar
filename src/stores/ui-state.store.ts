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
    quantity: 1,
    itemName: '',
    brand: '',
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
  frequency: 'one-time' as Payment['frequency'],
  quantity: 1,
  itemName: '',
  brand: '',
  itemSize: undefined,
  itemSizeUnit: 'gram' as Payment['itemSizeUnit'],
  portionSize: undefined,
  portionsCount: undefined,
  depletionRate: undefined,
  depletionUnit: 'day' as Payment['depletionUnit'],
  depletionTime: undefined as number | undefined
})

export const isSavingPayment = ref(false)
export const saveMessage = ref('')
export const saveMessageType = ref<'success' | 'error' | ''>('')
export const selectedDate = ref<Date | null>(null)
export const selectedDayPayments = ref<Payment[]>([])
export const preSelectedDay = ref<number | null>(null)

export const pulsatingDays = ref<Set<number>>(new Set())
export const pulsatingTimer = ref<NodeJS.Timeout | null>(null)

export const showPaymentTypeModal = ref(false)
export const editingPaymentType = ref<PaymentType | null>(null)
export const paymentTypeForm = reactive({
  name: '',
  color: '#ef4444',
  isEarning: false
})

export const showGearMenu = ref(false)

export type SortMode = 'date-asc' | 'date-desc' | 'amount-asc' | 'amount-desc'
export const sortMode = ref<SortMode>('date-asc')

export const showEarningsInNextPayments = ref(false) 
export const selectedPaymentTypes = ref<string[]>([]) 
export const isFilteringEnabled = ref(false)

export const showPieChartModal = ref(false)

export const showItemChartModal = ref(false)

export const hoveredSlice = ref<string | null>(null)

export const isNextPaymentsCollapsed = ref(false)
export const isEarningsCollapsed = ref(false)
export const isInventoryCollapsed = ref(false)

export const modalStack = ref<string[]>([])

export const forgoneInstances = ref<Set<string>>(new Set())
