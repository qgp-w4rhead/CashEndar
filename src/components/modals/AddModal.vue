<template>
  <div class="add-modal" @click.stop>
    <div class="modal-header">
      <div v-if="selectedDayPayments.length === 0" class="selected-date-display" @click="openDatePicker">
        {{ getSelectedDayDate() }}
      </div>
      <div class="modal-toggle">
        <div class="toggle-switch">
          <div class="toggle-container two-options">
            <button
              :class="['toggle-option', { active: addForm.type !== 'inventory' }]"
              @click="setPaymentMode"
            >
              Payment
            </button>
            <button
              :class="['toggle-option', { active: addForm.type === 'inventory' }]"
              @click="setInventoryMode"
            >
              Inventory
            </button>
          </div>
        </div>
      </div>
      <button class="close-btn" @click="closeAddMenu">×</button>
    </div>

    <div class="modal-body">
      
      <div v-if="selectedDayPayments.length > 0" class="day-payments-section">
        <h4 class="section-subtitle">Payments for {{ getSelectedDayDate() }}</h4>
        <h4 class="underline-subtitle"></h4>
        <div class="day-payments-list">
          <div v-for="payment in selectedDayPayments" :key="payment.id" class="day-payment-item" :class="{ 'forgone-payment': forgoneInstances.has(payment.id) }">
            <div class="payment-avatar">
              <div :class="`avatar-circle ${payment.type}`" :style="getAvatarStyle(payment.type)">{{ payment.type.charAt(0).toUpperCase() }}</div>
            </div>
            <div class="payment-details">
              <div class="payment-title">{{ payment.title }}</div>
              <div class="payment-time">{{ payment.time }}</div>
              <div class="payment-amount">{{ payment.amount }}</div>
            </div>
            <div class="payment-menu">
              <button
                class="forgo-btn"
                @click="toggleForgoPayment(payment)"
                :title="payment.forgone ? 'Unforgo this payment' : 'Forgo this payment'"
              >
                {{ payment.forgone ? '↺' : '⊘' }}
              </button>
              <button class="menu-btn" @click="openEditMenu(payment)">⋯</button>
            </div>
          </div>
        </div>
      </div>

      <div class="add-payment-section">

        <div v-if="addForm.type === 'inventory'">
          <h3>{{ 'Add Inventory Item' }}</h3>
          <InventoryFieldsSectionStepper
            :form-data="addForm"
            :get-estimated-portions="getEstimatedPortionsFromData"
            :get-depletion-time-in-days="getDepletionTimeInDaysFromData"
            :get-last-purchases="getLastPurchases"
            :get-estimated-next-purchase-date="getEstimatedNextPurchaseDate"
            @add-resupply="addResupply"
            @delete-purchase="deleteSinglePurchase"
            @save="saveNewPayment"
          />
        </div>

        <div v-else>
          <h3>{{ 'Add New Payment' }}</h3>
          <div class="form-group side-by-side">
            <div class="form-field">
              <div class="label-with-button payment-type-container">
                <label for="addPaymentType" class="payment-type-end payment-type-clickable" @click="addPaymentTypeFromAdd">Payment Type</label>
              </div>
              <CustomDropdown
                id="addPaymentType"
                v-model="addForm.type"
                :options="paymentTypeOptions"
                placeholder="Select payment type"
                class="dropdown-align-end"
              />
            </div>
            <div class="form-field">
              <label for="addPaymentTitle">Product / Service</label>
              <div class="autocomplete-wrapper">
                <input
                  id="addPaymentTitle"
                  v-model="addForm.title"
                  type="text"
                  class="form-input"
                  placeholder="Enter payment title"
                  autocomplete="off"
                  @input="onTitleInput"
                  @blur="hideTitleSuggestions"
                >
                <div v-if="showTitleSuggestions" class="suggestions-dropdown">
                  <div
                    v-for="suggestion in titleSuggestions"
                    :key="suggestion.id"
                    class="suggestion-item"
                    @mousedown.prevent="selectTitleSuggestion(suggestion)"
                  >
                    <span class="suggestion-title">{{ suggestion.title }}</span>
                    <span class="suggestion-meta">{{ suggestion.amount }} · {{ suggestion.type }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <div class="form-field amount-centered">
              <label for="addPaymentAmount">Amount</label>
              <input
                id="addPaymentAmount"
                v-model="addForm.amount"
                type="number"
                step="0.01"
                class="form-input"
                placeholder="0.00"
                @blur="handleAmountInputBlur"
                @keyup.enter="handleAmountInputKeyUp"
              >
            </div>
          </div>
        </div>

        <div v-if="addForm.type !== 'inventory'" class="form-group">
          <label class="frequency-centered">Payment Frequency</label>
          <div class="toggle-switch">
            <div class="toggle-container four-options">
              <button
                :class="['toggle-option', { active: addForm.frequency === 'one-time' }]"
                @click="addForm.frequency = 'one-time'"
              >
                One-Time
              </button>
              <button
                :class="['toggle-option', { active: addForm.frequency === 'weekly' }]"
                @click="addForm.frequency = 'weekly'"
              >
                Weekly
              </button>
              <button
                :class="['toggle-option', { active: addForm.frequency === 'bi-monthly' }]"
                @click="addForm.frequency = 'bi-monthly'"
              >
                Bi-Monthly
              </button>
              <button
                :class="['toggle-option', { active: addForm.frequency === 'recurring' }]"
                @click="addForm.frequency = 'recurring'"
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <div v-if="saveMessage" class="save-message" :class="saveMessageType">
        {{ saveMessage }}
      </div>

      <div v-if="addForm.type !== 'inventory'" class="btn-group">
        <button
          class="btn btn-success"
          @click="saveNewPayment"
          :disabled="isSavingPayment"
          :class="{ 'btn-loading': isSavingPayment }"
        >
          <span v-if="isSavingPayment" class="loading-spinner"></span>
          {{ isSavingPayment ? 'Saving...' : (selectedDayPayments.length > 0 ? 'Add Payment' : 'Save Payment') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import InventoryFieldsSectionStepper from '../primitives/inventoryStepper.vue'
import CustomDropdown from '../primitives/CustomDropdown.vue'

import {
  addForm,
  selectedDayPayments,
  isSavingPayment,
  saveMessage,
  saveMessageType,
  forgoneInstances,
  paymentTypes
} from '../../stores/ui-state.store'

import {
  getEstimatedPortionsFromData,
  getDepletionTimeInDaysFromData,
  getLastPurchases,
  getEstimatedNextPurchaseDate
} from '../../composables/payment-computables'

import {
  closeAddMenu,
  openEditMenu,
  getSelectedDayDate,
  saveNewPayment,
  handleAmountInputBlur,
  handleAmountInputKeyUp,
  addResupply,
  deleteSinglePurchase,
  toggleForgoPayment,
  addPaymentTypeFromAdd,
  openDatePicker,
  getPaymentSuggestions,
  autofillPaymentForm
} from '../../composables/payment-handlers'

// Convert paymentTypes to dropdown options format
const paymentTypeOptions = computed(() => {
  return paymentTypes.value
    .filter(t => t.value !== 'inventory')
    .map(type => ({
      value: type.value,
      label: type.label
    }))
})

// Helper function to get avatar style for custom payment types
const getAvatarStyle = (paymentTypeValue: string) => {
  const paymentType = paymentTypes.value.find(type => type.value === paymentTypeValue)
  if (paymentType && paymentType.isCustom) {
    return { background: `linear-gradient(135deg, ${paymentType.color}, ${paymentType.color}dd)` }
  }
  return {}
}

// Toggle between payment and inventory modes in add modal
const setPaymentMode = () => {
  // Switch to regular payment mode - prefer credit card, fallback to first available
  const regularPaymentTypes = paymentTypes.value.filter(t => t.value !== 'inventory')
  const creditType = regularPaymentTypes.find(t => t.value === 'credit')

  if (creditType) {
    addForm.type = creditType.value
  } else if (regularPaymentTypes.length > 0) {
    addForm.type = regularPaymentTypes[0].value
  } else {
    // Fallback if no regular payment types exist
    addForm.type = 'utility' // Default fallback
  }
}

const setInventoryMode = () => {
  // Switch to inventory mode
  addForm.type = 'inventory'
}

// Autocomplete state for Product / Service input
const titleSuggestions = ref<ReturnType<typeof getPaymentSuggestions>>([])
const showTitleSuggestions = ref(false)
let titleDebounceTimer: ReturnType<typeof setTimeout> | null = null

const onTitleInput = () => {
  if (titleDebounceTimer) clearTimeout(titleDebounceTimer)
  titleDebounceTimer = setTimeout(() => {
    titleSuggestions.value = getPaymentSuggestions(addForm.title)
    showTitleSuggestions.value = titleSuggestions.value.length > 0
  }, 300)
}

const selectTitleSuggestion = (payment: (typeof titleSuggestions.value)[number]) => {
  autofillPaymentForm(payment)
  showTitleSuggestions.value = false
  titleSuggestions.value = []
}

const hideTitleSuggestions = () => {
  setTimeout(() => {
    showTitleSuggestions.value = false
  }, 150)
}
</script>

<style>
/* Unified Modal Styles (Add Modal) */
.add-modal {
  background: linear-gradient(135deg, oklch(from var(--grey-dark) l c h / 1) 0%, oklch(from var(--grey-primary) l c h / 0.5) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 580px;
  overflow-x: clip;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
  position: relative;
  z-index: 1001;
}

.day-payments-section {
  margin-bottom: 32px;
}

.day-payments-list {
  margin-bottom: 24px;
}

.day-payment-item {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.day-payment-item.forgone-payment {
  opacity: 0.5;
  background: rgba(128, 128, 128, 0.1);
  border-color: rgba(128, 128, 128, 0.2);
}

.day-payment-item.forgone-payment .payment-title,
.day-payment-item.forgone-payment .payment-amount,
.day-payment-item.forgone-payment .payment-time {
  color: rgba(255, 255, 255, 0.6) !important;
}

.day-payment-item.forgone-payment .avatar-circle {
  opacity: 0.6;
}

/* Forgo button styling */
.forgo-btn {
  position: relative;
  left: 15%;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-medium);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  min-height: 24px;
}

.forgo-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: scale(1.1);
}

.selected-date-display {
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-v-big);
  font-weight: 600;
  margin: 16px;
  padding: 8px 12px;
  background: oklch(from var(--lime-dark) l c h / 0.5);
  border: 1px solid oklch(from var(--lime-light) l c h / 0.5);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  width: fit-content;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-date-display:hover {
  background: oklch(from var(--lime-dark) l c h / 1);
  border: 1px solid oklch(from var(--lime-light) l c h / 1);
  transform: translateY(-1px);
}

.modal-toggle {
  margin-left: auto;
  margin-right: 16px;
}

.add-payment-section h3 {
  color: white;
  margin: 0 0 16px 0;
  font-size: var(--font-v-big);
  font-weight: 600;
}

.form-field.amount-centered {
  text-align: center;
}

.form-field.amount-centered label {
  text-align: center;
}

.form-field.amount-centered .form-input {
  margin: 0 auto;
  text-align: center;
  width: auto;
  max-width: 100px;
}

/* Hide stepper controls on number inputs */
.form-field.amount-centered .form-input::-webkit-outer-spin-button,
.form-field.amount-centered .form-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.form-field.amount-centered .form-input[type=number] {
  -moz-appearance: textfield;
}

.form-field.amount-centered .form-input:focus::placeholder {
  color: transparent;
}

.frequency-centered {
  text-align: center;
  display: block;
  color: white;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: var(--font-small);
}

.payment-type-end {
  justify-content: end;
  display: flex;
  color: white;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: var(--font-small);
}

.payment-type-clickable {
  color: oklch(from var(--lime-light) l c h / 1) !important;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: underline;
  text-decoration-color: oklch(from var(--lime-light) l c h / 0.3);
  text-underline-offset: 4px;
}

.payment-type-clickable:hover {
  color: oklch(from var(--lime-primary) l c h / 1) !important;
  text-decoration-color: oklch(from var(--lime-primary) l c h / 0.6);
  transform: translateY(-1px);
}

/* Override label-with-button for payment type to align label to end */
.payment-type-container {
  justify-content: flex-end !important;
}

/* Align CustomDropdown to end */
.dropdown-align-end {
  display: flex;
  justify-content: flex-end;
}

/* Loading state for buttons */
.btn-loading {
  position: relative;
  cursor: not-allowed;
  opacity: 0.8;
}

.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Save message styling */
.save-message {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: var(--font-small);
  font-weight: 500;
  text-align: center;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease-out;
}

.save-message.success {
  background: oklch(from var(--lime-primary) l c h / 0.2);
  border: 1px solid oklch(from var(--lime-primary) l c h / 0.3);
  color: oklch(from var(--lime-primary) l c h / 1);
}

.save-message.error {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

/* Autocomplete / suggestions dropdown */
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
  max-height: 220px;
  overflow-y: auto;
}

.suggestions-dropdown::-webkit-scrollbar {
  width: 6px;
}

.suggestions-dropdown::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.suggestions-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
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
