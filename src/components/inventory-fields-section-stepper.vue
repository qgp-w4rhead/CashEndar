<template>
  <div class="inventory-stepper">
    <!-- Steps -->
    <div class="stepper-steps" :data-current-step="currentStep">
      <div
        v-for="step in steps"
        :key="step.id"
        :class="['stepper-step', { active: currentStep === step.id, completed: step.id < currentStep }]"
      >
        <div class="step-number">{{ step.id }}</div>
        <div class="step-title">{{ step.title }}</div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="stepper-progress">
      <div class="stepper-progress-bar" :data-current-step="currentStep">
        <div class="progress-fill"></div>
      </div>
    </div>

    <!-- Step Content -->
    <div class="stepper-content">
      <!-- Step 1: Basic Item Info -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="section-header">
          <h3 class="section-title">What is your Item?</h3>
        </div>

        <div class="form-group side-by-side">
          <div class="form-field">
            <label for="stepperItemName">Item Name</label>
            <input
              id="stepperItemName"
              v-model="formData.title"
              type="text"
              class="form-input"
              placeholder="Enter item name"
            >
          </div>
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
        </div>

        <div class="form-group side-by-side">
          <div class="form-field">
            <label for="stepperCost">Cost</label>
            <input
              id="stepperCost"
              v-model="formData.amount"
              type="number"
              step="0.01"
              class="form-input"
              placeholder="0.00"
              @blur="handleAmountInputBlur"
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
              class="form-input"
              placeholder="1"
            >
          </div>
        </div>
      </div>

      <!-- Step 2: Inventory Details -->
      <div v-if="currentStep === 2" class="step-content">
        <div class="section-header">
          <h3 class="section-title">Inventory Details</h3>
        </div>

        <div class="form-group">
          <label for="stepperItemSize">Item Size (Total Amount)</label>
          <div class="value-unit-input">
            <input
              id="stepperItemSize"
              v-model.number="formData.itemSize"
              type="number"
              step="0.01"
              min="0"
              class="form-input value-input"
              placeholder="e.g., 500"
            >
            <select
              v-model="formData.itemSizeUnit"
              class="form-input unit-select"
            >
              <option value="single">single</option>
              <option value="gram">grams</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="liter">liter</option>
              <option value="cup">cups</option>
              <option value="tablespoon">tablespoons</option>
              <option value="teaspoon">teaspoons</option>
              <option value="piece">pieces</option>
              <option value="can">cans</option>
              <option value="bottle">bottles</option>
            </select>
          </div>
        </div>

        <div class="form-group side-by-side">
          <div class="form-field">
            <label for="stepperPortionSize">Portion Size</label>
            <input
              id="stepperPortionSize"
              v-model.number="formData.portionSize"
              type="number"
              step="0.01"
              min="0"
              class="form-input value-input"
              placeholder="e.g., 250"
            >
          </div>
          <div class="form-field">
            <label>Estimated Portions</label>
            <input
              :value="getEstimatedPortions({ itemSize: formData.itemSize, portionSize: formData.portionSize, quantity: formData.quantity })"
              type="number"
              readonly
              class="form-input readonly-field"
              placeholder="Auto-calculated"
            >
          </div>
        </div>
      </div>

      <!-- Step 3: Depletion Tracking -->
      <div v-if="currentStep === 3" class="step-content">
        <div class="section-header">
          <h3 class="section-title">How fast do you go through?</h3>
        </div>

        <div class="form-group">
          <label for="stepperDepletionRate">Depletion Rate (optional)</label>
          <div class="value-unit-input">
            <input
              id="stepperDepletionRate"
              v-model.number="formData.depletionRate"
              type="number"
              step="0.01"
              min="0"
              class="form-input value-input"
              placeholder="e.g., 2"
            >
            <select
              v-model="formData.depletionUnit"
              class="form-input unit-select"
            >
              <option value="day">portions/day</option>
              <option value="week">portions/week</option>
              <option value="month">portions/month</option>
            </select>
          </div>
          <div style="margin-top: 10px;">
            <span class="unit-display">Your supply will last</span>
            <input
              :value="getDepletionTimeInDays({ depletionRate: formData.depletionRate, depletionUnit: formData.depletionUnit, ...getEstimatedPortionsProps })"
              type="number"
              readonly
              class="form-input readonly-field value-input"
              placeholder="Time until depletion"
              step="0.01"
            >
            <span class="unit-display">{{ formData.depletionUnit }}s</span>
          </div>
        </div>
      </div>

      <!-- Step 4: Purchase History -->
      <div v-if="currentStep === 4" class="step-content">
        <div class="last-purchase-section">
          <div class="section-divider">Last Purchase</div>
          <div class="resupply-section">
            <button
              :class="['resupply-btn', { 'resupply-btn-disabled': getLastPurchases(formData.title, formData.date).length === 0 }]"
              :disabled="getLastPurchases(formData.title, formData.date).length === 0"
              @click="$emit('add-resupply', formData.title)"
              :title="getLastPurchases(formData.title, formData.date).length === 0 ? 'No previous purchases found' : 'Add new purchase today (resupply)'"
            >+1</button>
            <span class="resupply-label">Resupply</span>
          </div>

          <!-- Last 3 Purchases List -->
          <div class="last-purchases-list">
            <div v-for="purchase in getLastPurchases(formData.title, formData.date)" :key="purchase.id" class="purchase-item">
              <span class="purchase-date">{{ purchase.date }}</span>
              <span class="purchase-frequency">{{ getFrequencyDisplay(purchase.frequency) }}</span>
              <span class="purchase-cost">{{ purchase.amount }}</span>
              <button class="purchase-delete-btn" @click.stop="$emit('delete-purchase', purchase)" title="Delete this purchase entry">[x]</button>
            </div>
            <div v-if="getLastPurchases(formData.title, formData.date).length === 0" class="no-purchases">
              No previous purchases found for this item
            </div>
          </div>

          <!-- Estimated Next Purchase Date -->
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

    <!-- Step Navigation -->
    <div class="stepper-navigation">
      <button
        :class="['nav-btn btn btn-primary', { disabled: currentStep <= 1 }]"
        :disabled="currentStep <= 1"
        @click="goToStep(currentStep - 1)"
      >
        Previous
      </button>
      <div class="step-indicator">{{ currentStep }} of {{ steps.length }}</div>
      <button
        v-if="currentStep < steps.length"
        class="nav-btn btn btn-success"
        @click="goToStep(currentStep + 1)"
      >
        Next
      </button>
      <button
        v-else
        class="nav-btn btn btn-success"
        @click="$emit('save')"
      >
        Save Payment
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'

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
}

// Props
const props = defineProps<{
  formData: FormData
  getEstimatedPortions: (data: any) => number
  getDepletionTimeInDays: (data: any) => number
  getLastPurchases: (title: string, date: string) => any[]
  getEstimatedNextPurchaseDate: (purchases: any[]) => string
}>()

// Emits
const emit = defineEmits<{
  save: []
  'add-resupply': [title: string]
  'delete-purchase': [purchase: any]
}>()

// Reactive state
const currentStep = ref(1)

// Steps definition
const steps: Step[] = [
  { id: 1, title: 'Basic Info' },
  { id: 2, title: 'Item Details' },
  { id: 3, title: 'Usage Rate' },
  { id: 4, title: 'Purchase History' }
]

// Computed props for helper functions
const getEstimatedPortionsProps = computed(() => ({
  itemSize: props.formData.itemSize,
  portionSize: props.formData.portionSize,
  quantity: props.formData.quantity
}))

// Methods
const goToStep = (step: number) => {
  if (step >= 1 && step <= steps.length) {
    currentStep.value = step
  }
}

const handleAmountInputBlur = () => {
  // Format amount as currency if needed
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
</script>

<style scoped>
.inventory-stepper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 24px;
}

/* Stepper Steps */
.stepper-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

/* Stepper Progress Bar */
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
  background: #10b981;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Progress bar animation based on current step */
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
}

.step-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  text-align: center;
  transition: all 0.2s ease;
}

.stepper-step.active .step-number {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.stepper-step.active .step-title {
  color: #10b981;
  font-weight: 600;
}

.stepper-step.completed .step-number {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.stepper-step.completed .step-title {
  color: rgba(255, 255, 255, 0.8);
}

/* Step Content */
.stepper-content {
}

.step-content {
  display: flex;
  flex-direction: column;
}

.section-header {
  text-align: center;
  margin-bottom: 0;
}

.section-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Step Navigation */
.stepper-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-btn {
  min-width: 100px;
}

.step-indicator {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
}

.btn.disabled {
  background: rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.4) !important;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Apply existing CSS classes for styling consistency */
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

.form-field {
  position: relative;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.form-input {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-size: 16px;
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
  border-color: rgba(16, 185, 129, 0.3) !important;
  color: #10b981 !important;
  font-weight: 600 !important;
  cursor: not-allowed !important;
}

.readonly-field:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(16, 185, 129, 0.3) !important;
  box-shadow: none !important;
}

.readonly-field:focus {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(16, 185, 129, 0.3) !important;
  box-shadow: none !important;
}

.last-purchase-section {
  margin-top: 16px;
}

.section-divider {
  color: white;
  height: 2px;
  background: rgba(16, 185, 129, 0.2);
  margin-bottom: 16px;
  padding: 0 10px;
}

.resupply-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.resupply-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.resupply-btn:hover:not(.resupply-btn-disabled) {
  background: linear-gradient(135deg, #059669, #047857);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.resupply-btn-disabled {
  background: #6b7280 !important;
  color: #9ca3af !important;
  cursor: not-allowed !important;
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3) !important;
}

.resupply-btn-disabled:hover {
  background: #6b7280 !important;
  transform: none !important;
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3) !important;
}

.resupply-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
}

.last-purchases-list {
  margin-bottom: 16px;
  max-height: 150px;
  overflow-y: auto;
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
  font-size: 14px;
  gap: 12px;
}

.purchase-frequency {
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
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
  font-size: 12px;
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
  font-size: 12px;
  padding: 12px 0;
  font-style: italic;
}

.next-purchase-info {
  padding: 12px;
  background: rgba(16, 185, 129, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.next-purchase-info label {
  color: white;
  font-weight: 600;
  font-size: 13px;
  display: block;
  margin-bottom: 4px;
}

.next-purchase-date {
  color: #10b981;
  font-weight: 700;
  font-size: 16px;
  font-family: monospace;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-1px);
}

.btn-success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.btn-success:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
}
</style>
