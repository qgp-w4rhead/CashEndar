<template>
  <div class="inventory-stepper">
    <div class="stepper-steps" :data-current-step="currentStep">
      <div
        v-for="step in steps"
        :key="step.id"
        :class="['stepper-step', { active: currentStep === step.id, completed: step.id < currentStep }]"
      >
        <div class="step-number" @click="goToStep(step.id)">{{ step.id }}</div>
        <div class="step-title" @click="goToStep(step.id)">{{ step.title }}</div>
      </div>
    </div>
    <div class="stepper-content">
      
      <div v-if="currentStep === 1" class="step-content">
        <div class="section-header">
          <h3 class="section-title">What is your Item?</h3>
        </div>

        <div class="form-group two-col-divided">
          <div class="divided-col divided-col-right">
            <div class="form-field right">
              <label for="stepperItemName">Product Name</label>
              <div class="autocomplete-wrapper">
                <input
                  id="stepperItemName"
                  v-model="formData.title"
                  type="text"
                  class="form-input"
                  placeholder="Enter product name"
                  autocomplete="off"
                  @input="onItemNameInput"
                  @blur="hideItemNameSuggestions"
                >
                <CustomScrollbar v-if="showItemNameSuggestions" class="suggestions-dropdown" max-height="220px" variant="thin">
                  <div
                    v-for="suggestion in itemNameSuggestions"
                    :key="suggestion.id"
                    class="suggestion-item"
                    @mousedown.prevent="selectItemNameSuggestion(suggestion)"
                  >
                    <span class="suggestion-title">{{ suggestion.title }}</span>
                    <span class="suggestion-meta">{{ suggestion.amount }}</span>
                  </div>
                </CustomScrollbar>
              </div>
            </div>
            <div class="form-field right">
              <label for="stepperCost">Cost</label>
              <input
                id="stepperCost"
                v-model="formData.amount"
                type="number"
                step="0.01"
                class="form-input short-ch"
                placeholder="0.00"
                @blur="handleAmountInputBlur"
              >
            </div>
          </div>
          <div class="vertical-divider"></div>
          <div class="divided-col">
            <div class="form-field">
              <label for="stepperItemBrand">Brand (optional)</label>
              <input
                id="stepperItemBrand"
                v-model="formData.brand"
                type="text"
                class="form-input"
                placeholder="Enter brand name"
              >
            </div>
            <div class="form-field">
              <label for="stepperQuantity">Quantity (optional)</label>
              <input
                id="stepperQuantity"
                v-model.number="formData.quantity"
                type="number"
                min="1"
                step="1"
                class="form-input short-ch"
                placeholder="1"
              >
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 2" class="step-content" style="align-items: center; justify-content: center;">
        <div class="section-header">
          <h3 class="section-title">Inventory Details</h3>
        </div>

        <div class="form-group side-by-side">
          <div class="form-field" style="align-items: center;">
            <label for="stepperItemSize">Item Size (Total Amount)</label>
            <div class="value-unit-input">
              <input
                id="stepperItemSize"
                v-model.number="formData.itemSize"
                type="number"
                step="0.01"
                min="0"
                class="form-input value-input short-ch"
                placeholder="Amount"
              >
              <CustomDropdown
                v-model="formData.itemSizeUnit"
                :options="itemSizeUnitOptions"
                placeholder="Select unit"
              />
            </div>
          </div>
          <div class="form-field">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label for="stepperPortionSize">Portion Size</label>
              <span class="unit-mnemonic">({{ getUnitMnemonic(formData.itemSizeUnit) }})</span>
            </div>
            <div class="value-unit-input">
              <input
                id="stepperPortionSize"
                v-model.number="formData.portionSize"
                type="number"
                step="0.01"
                min="0"
                class="form-input value-input short-ch"
                placeholder="Amount"
              >
            </div>
          </div>
          <div class="form-field">
            <label>Estimated Portions</label>
            <input
              :value="getEstimatedPortions({ itemSize: formData.itemSize, portionSize: formData.portionSize, quantity: formData.quantity })"
              type="number"
              readonly
              class="form-input readonly-field short-ch"
              placeholder="Auto-calculated"
            >
          </div>
        </div>

        <div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin-top: 12px; margin-bottom: 8px;"></div>

        <div class="form-group">
          <div class="form-field">
            <div class="expiration-inputs">
              <span class="expiration-text">
                Shelf life is : 
                <input
                  v-model.number="localExpirationPeriod"
                  @blur="syncExpirationPeriod"
                  type="number"
                  step="1"
                  min="1"
                  class="form-input inline-input"
                  placeholder="5"
                >
                <CustomDropdown
                  v-model="props.formData.expirationUnit"
                  :options="expirationUnitOptions"
                  placeholder="unit"
                  class="inline-dropdown"
                />
                <span v-if="localFreshnessOffset" class="offset-text">
                  and item is
                  <input
                    v-model.number="localFreshnessOffset"
                    @blur="syncFreshnessOffset"
                    type="number"
                    step="1"
                    min="0"
                    class="form-input inline-input offset-input"
                    placeholder="0"
                  >
                  <CustomDropdown
                    v-model="props.formData.freshnessOffsetUnit"
                    :options="expirationUnitOptions"
                    placeholder="day"
                    class="inline-dropdown offset-unit-dropdown"
                  />
                  old
                </span>
                <span v-else class="offset-placeholder">
                  and item is
                  <span 
                    v-if="!showFreshInput"
                    class="fresh-text"
                    @click="showFreshInput = true"
                  >fresh</span>
                  <input
                    v-if="showFreshInput"
                    v-model.number="localFreshnessOffset"
                    @blur="syncFreshnessOffset"
                    @keyup.escape="showFreshInput = false"
                    type="number"
                    step="1"
                    min="0"
                    class="form-input inline-input offset-input fresh-input"
                    placeholder="fresh"
                    ref="freshInputRef"
                  >
                </span>
              </span>
            </div>
            <div v-if="getExpirationCountdown()" class="expiration-countdown-container">
              <span :class="['expiration-countdown-text', { 'expired-text': getExpirationCountdown() === 'Expired' }]">
                {{ getExpirationCountdown() === 'Expired' ? 'Expired' : `will expire in ${getExpirationCountdown()}` }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 3" class="step-content">
        <div class="section-header">
          <h3 class="section-title">How fast do you go through?</h3>
        </div>

        <div class="form-group">
          <div class="form-field" style="align-items: center;">
            <label for="stepperDepletionRate">Depletion Rate (optional)</label>
            <div class="value-unit-input">
              <input
                id="stepperDepletionRate"
                v-model.number="formData.depletionRate"
                type="number"
                step="0.01"
                min="0"
                class="form-input value-input short-ch"
                placeholder="e.g., 2"
              >
              <CustomDropdown
                v-model="formData.depletionUnit"
                :options="depletionUnitOptions"
                placeholder="Select unit"
              />
            </div>
          </div>

          <div v-if="getUsageVsExpirationComparison()" class="usage-comparison-container">
            <div class="comparison-content">
              <div class="comparison-item">
                <span class="comparison-label">Supply remaining:</span>
                <span class="comparison-value">{{ getSupplyRemainingDisplay() }}</span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Item expires in:</span>
                <span class="comparison-value">{{ getExpirationRate() }}</span>
              </div>
              <div class="comparison-item">
                <span class="comparison-label">Cost per portion:</span>
                <span class="comparison-value">{{ getCostPerPortion() }} $</span>
              </div>
              <div class="comparison-result">
                <span :class="['result-text', getComparisonResultClass()]">
                  {{ getComparisonResultText() }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 4" class="step-content">
        <div class="section-divider" style="margin-top: 16px; margin-bottom: 16px;"></div>
        <div class="last-purchase-section">
          <div class="last-purchase-section-header">
            <label style="color: white; font-weight: 600; font-size: var(--font-small);">Last Purchase</label>
            <div class="resupply-section">
              <button
                :class="['resupply-btn', { 'resupply-btn-disabled': getLastPurchases(formData.title, formData.date).length === 0 }]"
                :disabled="getLastPurchases(formData.title, formData.date).length === 0"
                @click="$emit('add-resupply', formData.title)"
                :title="getLastPurchases(formData.title, formData.date).length === 0 ? 'No previous purchases found' : 'Add new purchase today (resupply)'"
              >+1</button>
              <span class="resupply-label">Resupply</span>
            </div>
          </div>

          <CustomScrollbar class="last-purchases-list" max-height="150px" variant="thin">
            <div v-for="purchase in getLastPurchases(formData.title, formData.date)" :key="purchase.id" class="purchase-item">
              <span class="purchase-date">{{ purchase.date }}</span>
              <span class="purchase-frequency">{{ getFrequencyDisplay(purchase.frequency) }}</span>
              <span class="purchase-cost">{{ purchase.amount }}</span>
              <button class="purchase-delete-btn" @click.stop="$emit('delete-purchase', purchase)" title="Delete this purchase entry">[x]</button>
            </div>
            <div v-if="getLastPurchases(formData.title, formData.date).length === 0" class="no-purchases">
              No previous purchases found for this item
            </div>
          </CustomScrollbar>

          <div v-if="getLastPurchases(formData.title, formData.date).length >= 3" class="next-purchase-info">
            <label>Estimated Next Purchase:</label>
            <div class="next-purchase-date">{{ getEstimatedNextPurchaseDate(getLastPurchases(formData.title, formData.date)) || 'No data available' }}</div>
          </div>
          <div v-else class="next-purchase-info">
            <label>Need 3+ purchases to estimate next date</label>
          </div>
        </div>
      </div>
    </div>

    <div class="stepper-progress">
      <div class="stepper-progress-bar" :data-current-step="currentStep">
        <div class="progress-fill"></div>
      </div>
    </div>

    <div class="stepper-navigation">
      <button
        :class="['nav-btn btn primary', { disabled: currentStep <= 1 }]"
        :disabled="currentStep <= 1"
        @click="goToStep(currentStep - 1)"
      >
        Previous
      </button>
      <div class="nav-buttons-right">
        <button
          v-if="currentStep === 1"
          class="quick-add-btn"
          @click="quickAdd"
          :disabled="!formData.title || !formData.amount"
          :title="!formData.title || !formData.amount ? 'Product name and cost are required' : 'Quick add using basic info only'"
        >
          Quick Add
        </button>
        <button
          v-if="currentStep < steps.length"
          class="nav-btn btn success"
          @click="goToStep(currentStep + 1)"
        >
          Next
        </button>
        <button
          v-else
          class="nav-btn btn success"
          @click="$emit('save')"
        >
          Save Payment
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import CustomDropdown from './CustomDropdown.vue'
import CustomScrollbar from './CustomScrollbar.vue'
import { getPaymentSuggestions, prefillInventoryFields } from '../../composables/payment-handlers'
import type { Payment } from '../../types/payment.types'

interface Step {
  id: number
  title: string
}

interface FormData {
  title: string
  brand: string
  amount: string | number | null
  quantity: number | null
  itemSize: number | null
  itemSizeUnit: string
  portionSize: number | null
  depletionRate: number | null
  depletionUnit: string
  date?: string
  expirationPeriod?: number
  expirationUnit?: string
  freshnessOffset?: number
  freshnessOffsetUnit?: string
}

const props = defineProps<{
  formData: FormData
  getEstimatedPortions: (data: any) => number
  getDepletionTimeInDays: (data: any) => number
  getLastPurchases: (title: string, date: string) => any[]
  getEstimatedNextPurchaseDate: (purchases: any[]) => string
}>()

const emit = defineEmits<{
  save: []
  'add-resupply': [title: string]
  'delete-purchase': [purchase: any]
}>()

const currentStep = ref(1)
const showUnitDropdown = ref(false)

// Autocomplete state for Product Name input
const itemNameSuggestions = ref<Payment[]>([])
const showItemNameSuggestions = ref(false)
let itemNameDebounceTimer: ReturnType<typeof setTimeout> | null = null

const onItemNameInput = () => {
  if (itemNameDebounceTimer) clearTimeout(itemNameDebounceTimer)
  itemNameDebounceTimer = setTimeout(() => {
    itemNameSuggestions.value = getPaymentSuggestions(props.formData.title, 'inventory')
    showItemNameSuggestions.value = itemNameSuggestions.value.length > 0
  }, 300)
}

const selectItemNameSuggestion = (payment: Payment) => {
  props.formData.title = payment.title
  prefillInventoryFields(payment.title)
  showItemNameSuggestions.value = false
  itemNameSuggestions.value = []
}

const hideItemNameSuggestions = () => {
  setTimeout(() => {
    showItemNameSuggestions.value = false
  }, 150)
}
const displayUnit = ref(props.formData.depletionUnit || 'day')
const showFreshInput = ref(false)
const freshInputRef = ref<HTMLInputElement | null>(null)

const steps: Step[] = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'Item Details' },
  { id: 3, title: 'Usage Rate' },
  { id: 4, title: 'Purchase History' }
]

const getEstimatedPortionsProps = computed(() => ({
  itemSize: props.formData.itemSize,
  portionSize: props.formData.portionSize,
  quantity: props.formData.quantity
}))

const goToStep = (step: number) => {
  if (step >= 1 && step <= steps.length) {
    currentStep.value = step
  }
}

const handleAmountInputBlur = () => {
  if (props.formData.amount !== null && props.formData.amount !== '') {
    const numValue = typeof props.formData.amount === 'string' ? parseFloat(props.formData.amount) : props.formData.amount
    props.formData.amount = parseFloat(numValue.toFixed(2))
  }
}

const getFrequencyDisplay = (frequency: string) => {
  switch (frequency) {
    case 'one-time':
      return 'One-Time'
    case 'weekly':
      return 'Weekly'
    case 'bi-monthly':
      return 'Bi-Monthly'
    case 'recurring':
      return 'Monthly'
    default:
      return frequency
  }
}

const quickAdd = () => {
  // Validate required fields
  if (!props.formData.title || !props.formData.amount) {
    return
  }
  
  // Emit save event directly, bypassing steps 2-4
  emit('save')
}

const availableUnits = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' }
]

const itemSizeUnitOptions = [
  { value: 'ml', label: 'ml', approximation: '(1/1000 L)', approximationImperial: '(~0.034 fl oz)', group: 'Volume' },
  { value: 'liter', label: 'liter', approximation: '', approximationImperial: '(~33.8 fl oz)', group: 'Volume' },
  { value: 'fl_oz', label: 'fl oz', approximation: '(~29.6 ml)', approximationImperial: '(1/8 cup)', group: 'Volume' },
  { value: 'cup', label: 'cup', approximation: '(~237 ml)', approximationImperial: '(~8 fl oz)', group: 'Volume' },
  { value: 'tablespoon', label: 'tablespoons', approximation: '(~15 ml)', approximationImperial: '(~0.5 fl oz)', group: 'Volume' },
  { value: 'teaspoon', label: 'teaspoons', approximation: '(~5 ml)', approximationImperial: '(~0.17 fl oz)', group: 'Volume' },
  { value: 'gram', label: 'grams', approximation: '(1/1000 kg)', approximationImperial: '(~0.035 oz)', group: 'Weight' },
  { value: 'kg', label: 'kg', approximation: '', approximationImperial: '(~2.2 lb)', group: 'Weight' },
  { value: 'ounce', label: 'ounces', approximation: '(1/16 lb)', approximationImperial: '(~28.35 g)', group: 'Weight' },
  { value: 'pound', label: 'pounds', approximation: '(16 oz)', approximationImperial: '(~453.6 g)', group: 'Weight' },
  { value: 'single', label: 'single', group: 'Quantity' },
  { value: 'piece', label: 'pieces', group: 'Quantity' },
  { value: 'can', label: 'cans', group: 'Quantity' },
  { value: 'bottle', label: 'bottles', group: 'Quantity' }
]

const depletionUnitOptions = [
  { value: 'day', label: 'portions/day' },
  { value: 'week', label: 'portions/week' },
  { value: 'month', label: 'portions/month' }
]

const expirationUnitOptions = [
  { value: 'day', label: 'days' },
  { value: 'week', label: 'weeks' },
  { value: 'month', label: 'months' },
  { value: 'year', label: 'years' }
]

const toggleUnitDropdown = () => {
  showUnitDropdown.value = !showUnitDropdown.value
}

const getDisplayUnit = () => {
  return displayUnit.value
}

const selectDisplayUnit = (unit: string) => {
  displayUnit.value = unit
  showUnitDropdown.value = false
}

const getUnitMnemonic = (unit: string) => {
  const unitMap: { [key: string]: string } = {
    'single': '',
    'gram': 'g',
    'kg': 'kg',
    'ounce': 'oz',
    'pound': 'lb',
    'ml': 'ml',
    'liter': 'L',
    'fl_oz': 'fl oz',
    'cup': 'cup',
    'tablespoon': 'tbsp',
    'teaspoon': 'tsp',
    'piece': 'pc',
    'can': 'can',
    'bottle': 'bottle'
  }
  return unitMap[unit] || unit
}

const getCostPerPortion = () => {
  const cost = typeof props.formData.amount === 'string' ? parseFloat(props.formData.amount) : props.formData.amount
  const estimatedPortions = props.getEstimatedPortions({ 
    itemSize: props.formData.itemSize, 
    portionSize: props.formData.portionSize, 
    quantity: props.formData.quantity 
  })
  
  if (!cost || !estimatedPortions || estimatedPortions === 0) {
    return 0
  }
  
  return Math.round((cost / estimatedPortions) * 100) / 100
}

const getDepletionTimeInDisplayUnit = (data: any) => {
  // Get the original calculation in the depletion unit
  const timeInDepletionUnit = props.getDepletionTimeInDays(data)
  
  // First convert to days as base unit
  let days
  switch (props.formData.depletionUnit) {
    case 'day':
      days = timeInDepletionUnit
      break
    case 'week':
      days = timeInDepletionUnit * 7
      break
    case 'month':
      days = timeInDepletionUnit * 30 // Approximate month
      break
    default:
      days = timeInDepletionUnit
  }
  
  // Then convert from days to the selected display unit
  let result
  switch (displayUnit.value) {
    case 'day':
      result = days
      break
    case 'week':
      result = days / 7
      break
    case 'month':
      result = days / 30 // Approximate month
      break
    default:
      result = days
  }
  
  // Format to 2 decimal places
  return Math.round(result * 100) / 100
}

// Watch for changes in depletion unit and update display unit
watch(() => props.formData.depletionUnit, (newUnit) => {
  if (newUnit) {
    displayUnit.value = newUnit
  }
})

// Watch for fresh input visibility and focus
watch(showFreshInput, (newValue) => {
  if (newValue && freshInputRef.value) {
    nextTick(() => {
      freshInputRef.value?.focus()
    })
  }
})

// Helper function to calculate expiration countdown
const getExpirationCountdown = () => {
  // Use local refs for real-time updates during typing
  const expirationPeriod = localExpirationPeriod.value
  const expirationUnit = props.formData.expirationUnit
  const freshnessOffset = localFreshnessOffset.value
  const freshnessOffsetUnit = props.formData.freshnessOffsetUnit
  
  if (!expirationPeriod || !expirationUnit) return null
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
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
        daysToSubtract = freshnessOffset * 30
        break
      case 'year':
        daysToSubtract = freshnessOffset * 365
        break
      default:
        daysToSubtract = freshnessOffset
    }
  }
  
  // Calculate effective days and expiration date
  const effectiveDaysToAdd = Math.max(0, daysToAdd - daysToSubtract)
  const expirationDate = new Date(today.getTime() + (effectiveDaysToAdd * 24 * 60 * 60 * 1000))
  
  // Calculate days until expiration
  const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExpiration <= 0) {
    return 'Expired'
  }
  
  return `${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}`
}

// Local refs to prevent focus loss during typing
const localExpirationPeriod = ref(props.formData.expirationPeriod)
const localFreshnessOffset = ref(props.formData.freshnessOffset)

// Watch for prop changes and update local refs
watch(() => props.formData.expirationPeriod, (newValue) => {
  localExpirationPeriod.value = newValue
})

watch(() => props.formData.freshnessOffset, (newValue) => {
  localFreshnessOffset.value = newValue
})

// Sync local values back to props on blur
const syncExpirationPeriod = () => {
  props.formData.expirationPeriod = localExpirationPeriod.value
}

const syncFreshnessOffset = () => {
  props.formData.freshnessOffset = localFreshnessOffset.value
  // Always hide the fresh input after syncing
  showFreshInput.value = false
}

// Usage vs Expiration comparison functions

// Returns days since purchase date
const getDaysSincePurchase = (): number => {
  // Debug logging
  console.log('getDaysSincePurchase - formData.date:', props.formData.date)
  
  // For new items being added, days since purchase should be 0
  // This is because we're calculating for a new purchase happening today
  if (!props.formData.date || props.formData.date === '') {
    console.log('getDaysSincePurchase - no date provided (new item), returning 0')
    return 0
  }
  
  try {
    // Try to parse the date - if it fails, assume it's a new item
    const purchaseDate = new Date(props.formData.date)
    
    // Check if the date is invalid
    if (isNaN(purchaseDate.getTime())) {
      console.log('getDaysSincePurchase - invalid date format, assuming new item, returning 0')
      return 0
    }
    
    const today = new Date()
    purchaseDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    
    const daysSince = Math.max(0, Math.floor((today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)))
    console.log('getDaysSincePurchase - calculated days since purchase:', daysSince)
    
    return daysSince
  } catch (error) {
    console.error('getDaysSincePurchase - error:', error, 'returning 0')
    return 0
  }
}

// Returns total depletion time in days from getDepletionTimeInDays prop
const getDepletionTimeDays = (): number => {
  try {
    const data = { 
      depletionRate: props.formData.depletionRate, 
      depletionUnit: props.formData.depletionUnit, 
      itemSize: props.formData.itemSize,
      portionSize: props.formData.portionSize,
      quantity: props.formData.quantity
    }
    
    // Debug logging
    console.log('getDepletionTimeDays - data:', data)
    
    const timeInDepletionUnit = props.getDepletionTimeInDays(data)
    
    // Debug logging
    console.log('getDepletionTimeDays - timeInDepletionUnit:', timeInDepletionUnit, 'unit:', props.formData.depletionUnit)
    
    // Validate the result before using it
    if (!isFinite(timeInDepletionUnit) || timeInDepletionUnit < 0) {
      console.log('getDepletionTimeDays - invalid result, returning 0')
      return 0
    }
    
    let resultInDays: number
    switch (props.formData.depletionUnit) {
      case 'day': 
        resultInDays = timeInDepletionUnit
        break
      case 'week': 
        resultInDays = timeInDepletionUnit * 7
        break
      case 'month': 
        resultInDays = timeInDepletionUnit * 30
        break
      default: 
        resultInDays = timeInDepletionUnit
        break
    }
    
    console.log('getDepletionTimeDays - final result in days:', resultInDays)
    return resultInDays
  } catch (error) {
    console.error('getDepletionTimeDays - error:', error)
    return 0
  }
}

// Returns supply_days_remaining = depletionTimeDays - daysSincePurchase
const getSupplyDaysRemaining = (): number => {
  const depletionDays = getDepletionTimeDays()
  const daysSincePurchase = getDaysSincePurchase()
  
  // Debug logging
  console.log('getSupplyDaysRemaining - depletionDays:', depletionDays, 'daysSincePurchase:', daysSincePurchase)
  
  // Validate both values before calculation
  if (!isFinite(depletionDays) || !isFinite(daysSincePurchase)) {
    console.log('getSupplyDaysRemaining - invalid values, returning 0')
    return 0
  }
  
  const result = depletionDays - daysSincePurchase
  const finalResult = Math.max(0, isFinite(result) ? result : 0)
  
  console.log('getSupplyDaysRemaining - calculated result:', result, 'final result:', finalResult)
  return finalResult
}

// Returns expiration countdown in days (reuses getExpirationCountdown logic as a number)
const getExpirationCountdownDays = (): number | null => {
  const countdown = getExpirationCountdown()
  if (!countdown || countdown === 'Expired') return countdown === 'Expired' ? 0 : null
  const match = countdown.match(/^(\d+)/)
  return match ? parseInt(match[1]) : null
}

const getUsageVsExpirationComparison = () => {
  const hasUsageRate = props.formData.depletionRate && props.formData.depletionUnit
  const hasExpiration = getExpirationCountdownDays() !== null
  return hasUsageRate && hasExpiration
}

const getSupplyRemainingDisplay = () => {
  const days = getSupplyDaysRemaining()
  if (days === 0) return '0 days'
  return `${Math.round(days)} day${days === 1 ? '' : 's'}`
}

const getExpirationRate = () => {
  const days = getExpirationCountdownDays()
  if (days === null) return 'N/A'
  if (days === 0) return 'Expired'
  return `${days} day${days === 1 ? '' : 's'}`
}

const getWasteFactor = (): number | null => {
  const supplyDays = getSupplyDaysRemaining()
  const expirationDays = getExpirationCountdownDays()
  if (expirationDays === null || expirationDays === 0) return null
  return Math.round((supplyDays / expirationDays) * 10) / 10
}

const getComparisonResultClass = () => {
  if (!getUsageVsExpirationComparison()) return ''
  const supplyDays = getSupplyDaysRemaining()
  const expirationDays = getExpirationCountdownDays()
  if (expirationDays === null) return ''
  if (supplyDays <= expirationDays) return 'result-good'
  return 'result-warning'
}

const getComparisonResultText = () => {
  const wasteFactor = getWasteFactor()
  const resultClass = getComparisonResultClass()

  if (resultClass === 'result-good') {
    return '✓ You will finish it before it expires'
  } else if (resultClass === 'result-warning') {
    const wf = wasteFactor !== null ? ` (${wasteFactor}× waste factor)` : ''
    return `⚠ Item may expire before you finish it${wf}`
  }
  return ''
}
</script>

<style scoped>
.inventory-stepper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 24px;
  min-height: 520px;
  overflow-y: hidden;
}

.stepper-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stepper-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.stepper-progress {
  margin: 16px 0;
  display: flex;
  justify-content: center;
}

.stepper-progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: oklch(from var(--lime-primary) l c h / 1);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.stepper-progress-bar[data-current-step="1"] .progress-fill { width: 12.5%; }
.stepper-progress-bar[data-current-step="2"] .progress-fill { width: 37.5%; }
.stepper-progress-bar[data-current-step="3"] .progress-fill { width: 62.5%; }
.stepper-progress-bar[data-current-step="4"] .progress-fill { width: 100%; }

.stepper-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  z-index: 3;
  position: relative;
  flex: 1;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: var(--font-medium);
}

.step-number:hover {
  background: oklch(from var(--lime-primary) l c h / 0.3);
  border-color: oklch(from var(--lime-primary) l c h / 0.6);
  color: oklch(from var(--lime-primary) l c h / 1);
}

.step-title {
  font-size: var(--font-small);
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.step-title:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.stepper-step.active .step-number {
  background: oklch(from var(--lime-primary) l c h / 1);
  border-color: oklch(from var(--lime-primary) l c h / 1);
  color: white;
}

.stepper-step.active .step-number:hover {
  background: oklch(from var(--lime-dark) l c h / 1);
  border-color: oklch(from var(--lime-dark) l c h / 1);
  transform: scale(1.1);
}

.stepper-step.completed .step-number {
  background: oklch(from var(--lime-primary) l c h / 1);
  border-color: oklch(from var(--lime-primary) l c h / 1);
  color: white;
}

.stepper-step.completed .step-number:hover {
  background: oklch(from var(--lime-dark) l c h / 1);
  border-color: oklch(from var(--lime-dark) l c h / 1);
  transform: scale(1.1);
}

.stepper-step.completed .step-title {
  color: rgba(255, 255, 255, 0.8);
}

.step-content {
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;
}

.section-title {
  color: white;
  font-size: var(--font-v-big);
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 1), oklch(from var(--lime-dark) l c h / 1));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  margin-bottom: 24px;
}

.stepper-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-buttons-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.nav-btn {
  min-width: 100px;
}

.step-indicator {
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-small);
  font-weight: 500;
}

.btn.disabled {
  background: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.4) !important;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-group {
  margin-top: 16px;
}

.form-group.side-by-side {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.form-group.side-by-side .form-field {
  flex: 1;
}

.form-group.two-col-divided {
  display: flex;
  gap: 0;
  margin-top: 16px;
  align-items: stretch;
}

.divided-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.divided-col-right {
  padding-right: 16px;
}

.divided-col:not(.divided-col-right) {
  padding-left: 16px;
}

.vertical-divider {
  width: 1px;
  background: rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
  align-self: stretch;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  white-space: nowrap;
}

.form-field label {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
}

.form-group > label {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
}

.right label {
  text-align: right;
}

.right input {
  text-align: right;
  margin-left: auto;
}

.right .autocomplete-wrapper {
  margin-left: auto;
  text-align: right;
}

.right .autocomplete-wrapper input {
  text-align: right;
}

/* Remove stepper arrows from number inputs */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.short-ch {
  width: 10ch;
}

.form-input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: var(--font-medium);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: rgb(59, 130, 246);
  background: rgba(59, 130, 246, 0.8);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
  color: rgba(224, 224, 224, 0.5);
}

.value-unit-input {
  display: flex;
  gap: 8px;
  align-items: center;
}

.value-input {
  flex: 1;
}

.unit-select {
  min-width: 80px;
  flex-shrink: 0;
}

.readonly-field {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: oklch(from var(--lime-primary) l c h / 0.3) !important;
  color: oklch(from var(--lime-primary) l c h / 1) !important;
  font-weight: 600 !important;
  cursor: not-allowed !important;
}

.readonly-field:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: oklch(from var(--lime-primary) l c h / 0.3) !important;
  box-shadow: none !important;
}

.readonly-field:focus {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: oklch(from var(--lime-primary) l c h / 0.3) !important;
  box-shadow: none !important;
}

.last-purchase-section {
  margin-top: 16px;
}

.last-purchase-section-header {
  background: rgb(255, 255, 255, 0.05); 
  border: 1px rgb(255, 255, 255, 0.1) solid;
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-radius: 0.5rem;
}

.resupply-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.resupply-btn {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 1), oklch(from var(--lime-dark) l c h / 1));
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  font-size: var(--font-medium);
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px oklch(from var(--lime-primary) l c h / 0.3);
}

.resupply-btn:hover:not(.resupply-btn-disabled) {
  background: linear-gradient(135deg, oklch(from var(--lime-dark) l c h / 1), oklch(from var(--lime-dark) l c h / 0.8));
  transform: scale(1.05);
  box-shadow: 0 4px 12px oklch(from var(--lime-primary) l c h / 0.4);
}

.resupply-btn-disabled {
  background: oklch(from var(--grey-primary) l c h / 1) !important;
  color: oklch(from var(--grey-light) l c h / 1) !important;
  cursor: not-allowed !important;
  box-shadow: 0 2px 8px oklch(from var(--grey-primary) l c h / 0.3) !important;
}

.resupply-btn-disabled:hover {
  background: oklch(from var(--grey-primary) l c h / 1) !important;
  transform: none !important;
  box-shadow: 0 2px 8px oklch(from var(--grey-primary) l c h / 0.3) !important;
}

.resupply-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-small);
  font-weight: 500;
}

.last-purchases-list {
  margin-bottom: 16px;
  padding-right: 12px;
}

.purchase-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: var(--font-small);
  gap: 12px;
}

.purchase-frequency {
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 4px 8px;
  font-size: var(--font-x-small);
  font-weight: 500;
  background: rgba(255, 255, 255, 0.05);
}

.purchase-date,
.purchase-cost {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.purchase-delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--font-x-small);
  font-weight: 600;
  transition: all 0.2s ease;
  margin-left: auto;
  flex-shrink: 0;
}

.purchase-delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #dc2626;
}

.no-purchases {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--font-x-small);
  padding: 12px 0;
  font-style: italic;
}

.next-purchase-info {
  padding: 12px;
  background: oklch(from var(--lime-primary) l c h / 0.05);
  border-radius: 6px;
  border: 1px solid oklch(from var(--lime-primary) l c h / 0.2);
}

.next-purchase-info label {
  color: white;
  font-weight: 600;
  font-size: var(--font-x-small);
  display: block;
  margin-bottom: 4px;
}

.next-purchase-date {
  color: oklch(from var(--lime-primary) l c h / 1);
  font-weight: 700;
  font-size: var(--font-medium);
  font-family: monospace;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn.primary {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 1), oklch(from var(--lime-dark) l c h / 1));
  color: white;
}

.btn.primary:hover {
  background: linear-gradient(135deg, oklch(from var(--lime-dark) l c h / 1), oklch(from var(--lime-dark) l c h / 0.8));
  transform: translateY(-1px);
}

.btn.success {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 1), oklch(from var(--lime-dark) l c h / 1));
  color: white;
}

.btn.success:hover {
  background: linear-gradient(135deg, oklch(from var(--lime-dark) l c h / 1), oklch(from var(--lime-dark) l c h / 0.8));
  transform: translateY(-1px);
}

.quick-add-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 600;
  font-size: var(--font-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  min-width: 100px;
}

.quick-add-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.quick-add-btn:disabled {
  background: oklch(from var(--grey-primary) l c h / 1) !important;
  color: oklch(from var(--grey-light) l c h / 1) !important;
  cursor: not-allowed !important;
  box-shadow: 0 2px 8px oklch(from var(--grey-primary) l c h / 0.3) !important;
  transform: none !important;
}

.unit-display-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  margin-left: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  transition: all 0.2s ease;
  gap: 8px;
}

.unit-display-dropdown:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.dropdown-arrow {
  font-size: var(--font-x-small);
  color: rgba(255, 255, 255, 0.6);
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.unit-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: oklch(from var(--grey-dark) l c h / 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.unit-option {
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-medium);
  font-weight: 500;
}

.unit-option:hover {
  background: oklch(from var(--lime-primary) l c h / 0.2);
  color: oklch(from var(--lime-primary) l c h / 1);
}

.unit-option:first-child {
  border-radius: 6px 6px 0 0;
}

.unit-option:last-child {
  border-radius: 0 0 6px 6px;
}

.unit-mnemonic {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-x-small);
  font-weight: 500;
  white-space: nowrap;
  min-width: 20px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.field-hint {
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--font-x-small);
  font-style: italic;
  margin-top: 4px;
}

.expiration-inputs {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 8px;
}

.expiration-text {
  color: white;
  font-weight: 600;
  font-size: var(--font-medium);
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  justify-content: center;
  gap: 8px;
}

.inline-input {
  width: 45px;
  padding: 2px 4px;
  margin: 0 1px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: var(--font-medium);
  height: 32px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.inline-dropdown {
  margin: 0 1px;
  height: 32px;
}

.inline-dropdown :deep(.custom-dropdown) {
  height: 32px;
  display: flex;
  align-items: center;
}

.inline-dropdown :deep(.dropdown-trigger) {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: var(--font-medium);
  width: fit-content;
  min-width: fit-content;
  box-sizing: border-box;
  white-space: nowrap;
}

.offset-unit-dropdown :deep(.dropdown-trigger) {
  width: fit-content;
  min-width: fit-content;
  padding: 0 4px;
}

.offset-text {
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}

.offset-placeholder {
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}

.expiration-countdown {
  color: #f59e0b;
  font-weight: 500;
}

.expiration-countdown-container {
  display: flex;
  justify-content: center;
  margin-top: 4px;
}

.expiration-countdown-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-x-small);
  font-style: italic;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: fit-content;
}

.expired-text {
  color: #ef4444 !important;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.offset-input {
  width: 45px;
  height: 32px;
}

.fresh-input {
  width: 55px;
}

.fresh-input::placeholder {
  color: oklch(from var(--lime-primary) l c h / 1);
  font-style: italic;
  opacity: 1;
}

.fresh-text {
  color: oklch(from var(--lime-primary) l c h / 1);
  font-style: italic;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.fresh-text:hover {
  color: oklch(from var(--lime-dark) l c h / 1);
}

.fit-content-input {
  width: 5rem;
}

.usage-comparison-container {
  margin-top: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  text-align: center;
  margin-left: auto;
  margin-right: auto;
  max-width: fit-content;
}

.comparison-header {
  margin-bottom: 8px;
}

.comparison-title {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  font-size: var(--font-medium);
}

.comparison-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comparison-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-x-small);
}

.comparison-value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-size: var(--font-x-small);
}

.comparison-result {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.result-text {
  font-size: var(--font-x-small);
  font-weight: 500;
}

.result-good {
  color: oklch(from var(--lime-primary) l c h / 1);
}

.result-warning {
  color: #f59e0b;
}

.result-neutral {
  color: oklch(from var(--grey-light) l c h / 1);
}

.autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: oklch(from var(--grey-dark) l c h / 0.97);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 1100;
  backdrop-filter: blur(10px);
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: oklch(from var(--lime-primary) l c h / 0.18);
}

.suggestion-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-small);
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-meta {
  color: rgba(255, 255, 255, 0.45);
  font-size: var(--font-x-small);
  font-weight: 400;
  margin-left: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
