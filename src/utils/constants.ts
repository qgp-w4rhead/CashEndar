export const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const

export const DEFAULT_PAYMENT_TYPES = [
  { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
  { id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
  { id: 'credit', label: 'Credit', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
  { id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
  { id: 'inventory', label: 'Inventory', value: 'inventory', color: '#8b5cf6', isCustom: false, isEarning: false },
  { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
] as const

export const FALLBACK_PAYMENT_TYPES = [
  { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
  { id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
  { id: 'credit', label: 'Credit', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
  { id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
  { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
] as const

export const COLOR_PRESETS = [
  { name: 'Red', color: '#ef4444' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Green', color: '#10b981' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Teal', color: '#14b8a6' }
] as const

export const MS_PER_DAY = 1000 * 60 * 60 * 24
