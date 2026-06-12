<template>
  <CustomScrollbar
    :class="isAdd ? 'add-modal' : 'edit-modal'"
    :style="isAdd ? { height: modalHeight + 'px', maxHeight: '90vh' } : undefined"
    :max-height="isEdit ? '90vh' : undefined"
    @click.stop
  >
    <div ref="modalContentRef" :class="{ 'modal-content': isAdd }">
      <!-- HEADER -->
      <div class="modal-header">
        <template v-if="isAdd">
          <div v-if="selectedDayPayments.length === 0" class="selected-date-display" @click="openDatePicker">{{ getSelectedDayDate() }}</div>
          <div class="modal-toggle">
            <div class="toggle-switch">
              <div class="toggle-container two-options">
                <button :class="['toggle-option', { active: form.type !== 'inventory' }]" @click="setPaymentMode">Payment</button>
                <button :class="['toggle-option', { active: form.type === 'inventory' }]" @click="setInventoryMode">Inventory</button>
              </div>
            </div>
          </div>
          <button class="scan-shortcut" title="Scan a bill instead of typing" @click="switchToScan">📷 scan a bill</button>
        </template>
        <h3 v-else>Edit Payment</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <!-- EXISTING DAY PAYMENTS (add only) -->
        <div v-if="isAdd && selectedDayPayments.length > 0" class="day-payments-section">
          <h4 class="section-subtitle">Payments for {{ getSelectedDayDate() }}</h4>
          <h4 class="underline-subtitle"></h4>
          <div class="day-payments-list">
            <div v-for="p in selectedDayPayments" :key="p.id" class="day-payment-item" :class="{ 'forgone-payment': forgoneInstances.has(p.id) }">
              <div class="payment-avatar">
                <div :class="`avatar-circle ${p.type}`" :style="getAvatarStyle(p.type)">{{ p.type.charAt(0).toUpperCase() }}</div>
              </div>
              <div class="payment-details">
                <div class="payment-title">{{ p.title }}</div>
                <div class="payment-time">{{ p.time }}</div>
                <div class="payment-amount">{{ p.amount }}</div>
              </div>
              <div class="payment-menu">
                <button class="forgo-btn" @click="toggleForgoPayment(p)" :title="p.forgone ? 'Unforgo this payment' : 'Forgo this payment'">{{ p.forgone ? '↺' : '⊘' }}</button>
                <button class="menu-btn" @click="openEditMenu(p)">⋯</button>
              </div>
            </div>
          </div>
        </div>

        <div class="add-payment-section">
          <!-- INVENTORY MODE -->
          <div v-if="form.type === 'inventory'">
            <h3 v-if="isAdd">Add Inventory Item</h3>
            <InventoryFieldsSectionStepper
              :form-data="form"
              :get-estimated-portions="isAdd ? getEstimatedPortionsFromData : getEstimatedPortions"
              :get-depletion-time-in-days="isAdd ? getDepletionTimeInDaysFromData : getDepletionTimeInDays"
              :get-last-purchases="getLastPurchases"
              :get-estimated-next-purchase-date="getEstimatedNextPurchaseDate"
              @add-resupply="addResupply"
              @delete-purchase="deleteSinglePurchase"
              @save="save"
            />
          </div>

          <!-- PAYMENT MODE -->
          <div v-else>
            <h3 v-if="isAdd">Add New Payment</h3>

            <!-- ADD FIELDS -->
            <template v-if="isAdd">
              <div class="form-group side-by-side">
                <div class="form-field">
                  <div class="label-with-button payment-type-container">
                    <label for="addPaymentType" class="payment-type-end payment-type-clickable" @click="addPaymentTypeFromAdd">Payment Type</label>
                  </div>
                  <CustomDropdown id="addPaymentType" v-model="form.type" :options="paymentTypeOptions" placeholder="Select payment type" class="dropdown-align-end" />
                </div>
                <div class="form-field">
                  <label for="addPaymentTitle">Product / Service</label>
                  <div class="autocomplete-wrapper">
                    <input id="addPaymentTitle" v-model="form.title" type="text" class="form-input" placeholder="Enter payment title" autocomplete="off" @input="onTitleInput" @blur="hideTitleSuggestions">
                    <CustomScrollbar v-if="showTitleSuggestions" class="suggestions-dropdown" max-height="220px" variant="thin">
                      <div v-for="s in titleSuggestions" :key="s.id" class="suggestion-item" @mousedown.prevent="selectTitleSuggestion(s)">
                        <span class="suggestion-title">{{ s.title }}</span>
                        <span class="suggestion-meta">{{ s.amount }} · {{ s.type }}</span>
                      </div>
                    </CustomScrollbar>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <div class="form-field amount-centered">
                  <label for="addPaymentAmount">Amount</label>
                  <input id="addPaymentAmount" v-model="form.amount" type="number" step="0.01" class="form-input" placeholder="0.00" @blur="handleAmountInputBlur" @keyup.enter="handleAmountInputKeyUp">
                </div>
              </div>
            </template>

            <!-- EDIT FIELDS -->
            <template v-else>
              <div class="form-group side-by-side">
                <div class="form-field">
                  <label for="paymentTitle">Payment Title</label>
                  <input id="paymentTitle" v-model="form.title" type="text" class="form-input" placeholder="Enter payment title">
                </div>
                <div class="form-field">
                  <div class="label-with-button">
                    <label for="paymentType">Payment Type</label>
                    <button class="add-type-btn" @click="addPaymentTypeFromEdit" title="Add new payment type">+</button>
                  </div>
                  <CustomDropdown id="paymentType" v-model="form.type" :options="paymentTypeOptions" placeholder="Select payment type" />
                </div>
              </div>
              <div class="form-group side-by-side">
                <div class="form-field">
                  <label for="paymentAmount">Amount</label>
                  <input id="paymentAmount" v-model="form.amount" type="number" step="0.01" class="form-input" placeholder="0.00" @blur="handleAmountInputBlur" @keyup.enter="handleAmountInputKeyUp">
                </div>
                <div class="form-field">
                  <label for="paymentDate">Date</label>
                  <input id="paymentDate" v-model="editForm.date" type="date" class="form-input" required>
                </div>
              </div>
            </template>

            <!-- FREQUENCY TOGGLE (shared) -->
            <div class="form-group">
              <div :class="{ 'form-field': isEdit }">
                <label :class="{ 'frequency-centered': isAdd }">Payment Frequency</label>
                <div class="toggle-switch">
                  <div class="toggle-container four-options">
                    <button :class="['toggle-option', { active: form.frequency === PaymentFrequency.ONE_TIME }]" @click="form.frequency = PaymentFrequency.ONE_TIME">One-Time</button>
                    <button :class="['toggle-option', { active: form.frequency === PaymentFrequency.WEEKLY }]" @click="form.frequency = PaymentFrequency.WEEKLY">Weekly</button>
                    <button :class="['toggle-option', { active: form.frequency === PaymentFrequency.BI_MONTHLY }]" @click="form.frequency = PaymentFrequency.BI_MONTHLY">Bi-Monthly</button>
                    <button :class="['toggle-option', { active: form.frequency === PaymentFrequency.RECURRING }]" @click="form.frequency = PaymentFrequency.RECURRING">Monthly</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isEdit" class="form-separator"></div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <template v-if="isAdd">
          <div v-if="saveMessage" class="save-message" :class="saveMessageType">{{ saveMessage }}</div>
          <div v-if="form.type !== 'inventory'" class="btn-group">
            <button class="btn success" @click="save" :disabled="isSavingPayment" :class="{ loading: isSavingPayment }">
              <span v-if="isSavingPayment" class="loading-spinner"></span>
              {{ isSavingPayment ? 'Saving...' : (selectedDayPayments.length > 0 ? 'Add Payment' : 'Save Payment') }}
            </button>
          </div>
        </template>
        <div v-else class="btn-group">
          <button class="btn success" @click="save">Save Changes</button>
          <button class="btn secondary" @click="deletePayment">Delete Payment</button>
        </div>
      </div>
    </div>
  </CustomScrollbar>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { PaymentFrequency } from '../../types/payment.types'
import InventoryFieldsSectionStepper from '../primitives/inventoryStepper.vue'
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import CustomDropdown from '../primitives/CustomDropdown.vue'
import { paymentTypeOptions } from '../../composables/payment-type-options'

import {
  addForm, editForm, selectedDayPayments, isSavingPayment,
  saveMessage, saveMessageType, forgoneInstances, paymentTypes
} from '../../stores/ui-state.store'

import {
  getEstimatedPortionsFromData, getEstimatedPortions,
  getDepletionTimeInDaysFromData, getDepletionTimeInDays,
  getLastPurchases, getEstimatedNextPurchaseDate
} from '../../composables/payment-computables'

import {
  closeAddMenu, closeEditMenu, openEditMenu,
  getSelectedDayDate, saveNewPayment, savePayment, deletePayment,
  handleAmountInputBlur, handleAmountInputKeyUp,
  addResupply, deleteSinglePurchase, toggleForgoPayment,
  addPaymentTypeFromAdd, addPaymentTypeFromEdit,
  openDatePicker, getPaymentSuggestions, autofillPaymentForm,
  openScanBillModal
} from '../../composables/payment-handlers'

const props = defineProps<{ mode: 'add' | 'edit' }>()

const isAdd = props.mode === 'add'
const isEdit = !isAdd
const form = isAdd ? addForm : editForm
const close = isAdd ? closeAddMenu : closeEditMenu
const save = isAdd ? saveNewPayment : savePayment

// Scanning beats typing — jump from manual entry straight to OCR
const switchToScan = () => {
  close()
  openScanBillModal()
}

// Add-mode: dynamic height
const modalHeight = ref(600)
const modalContentRef = ref<HTMLElement>()

watch(() => addForm.type, async () => {
  if (!isAdd) return
  await nextTick()
  if (modalContentRef.value) {
    modalHeight.value = Math.min(modalContentRef.value.scrollHeight, window.innerHeight * 0.9)
  }
}, { immediate: true })

// Add-mode: avatar style for custom payment types
const getAvatarStyle = (type: string) => {
  const pt = paymentTypes.value.find(t => t.value === type)
  return pt?.isCustom ? { background: `linear-gradient(135deg, ${pt.color}, ${pt.color}dd)` } : {}
}

// Add-mode: payment/inventory toggle
const setPaymentMode = () => {
  const regular = paymentTypes.value.filter(t => t.value !== 'inventory')
  addForm.type = regular.find(t => t.value === 'credit')?.value ?? regular[0]?.value ?? 'utility'
}
const setInventoryMode = () => { addForm.type = 'inventory' }

// Add-mode: autocomplete
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

const selectTitleSuggestion = (p: (typeof titleSuggestions.value)[number]) => {
  autofillPaymentForm(p)
  showTitleSuggestions.value = false
  titleSuggestions.value = []
}

const hideTitleSuggestions = () => { setTimeout(() => { showTitleSuggestions.value = false }, 150) }
</script>

<style>
.add-modal {
  background: linear-gradient(135deg, oklch(from var(--grey-dark) l c h / 1) 0%, oklch(from var(--grey-primary) l c h / 0.5) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: fit-content;
  min-height: fit-content;
  overflow: auto;
  animation: modalSlideIn 0.3s ease-out;
  position: relative;
  z-index: 1001;
  transition: height 0.5s ease;
}

.modal-content { padding: 0; }

.add-modal.custom-scrollbar.scroll-y { overflow-y: hidden !important; }
.add-modal.custom-scrollbar.scroll-y::-webkit-scrollbar { display: none !important; }
.add-modal.custom-scrollbar.scroll-y { -ms-overflow-style: none !important; scrollbar-width: none !important; }

.day-payments-section { margin-bottom: 32px; }
.day-payments-list { margin-bottom: 24px; }

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
.day-payment-item.forgone-payment .payment-time { color: rgba(255, 255, 255, 0.6) !important; }
.day-payment-item.forgone-payment .avatar-circle { opacity: 0.6; }

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
  font-size: var(--font-medium);
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

.modal-toggle { margin-left: auto; margin-right: 16px; }

.add-payment-section h3 {
  color: white;
  margin: 0 0 16px 0;
  font-size: var(--font-v-big);
  font-weight: 600;
}

.form-field.amount-centered { text-align: center; }
.form-field.amount-centered label { text-align: center; }
.form-field.amount-centered .form-input { margin: 0 auto; text-align: center; width: auto; max-width: 100px; }
.form-field.amount-centered .form-input::-webkit-outer-spin-button,
.form-field.amount-centered .form-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.form-field.amount-centered .form-input[type=number] { appearance: textfield; -moz-appearance: textfield; }
.form-field.amount-centered .form-input:focus::placeholder { color: transparent; }

.frequency-centered {
  text-align: center;
  display: block;
  color: white;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: var(--font-small);
}

.payment-type-end { justify-content: end; display: flex; color: white; font-weight: 600; margin-bottom: 8px; font-size: var(--font-small); }
.payment-type-clickable { color: oklch(from var(--lime-light) l c h / 1) !important; cursor: pointer; transition: all 0.2s ease; text-decoration: underline; text-decoration-color: oklch(from var(--lime-light) l c h / 0.3); text-underline-offset: 4px; }
.payment-type-clickable:hover { color: oklch(from var(--lime-primary) l c h / 1) !important; text-decoration-color: oklch(from var(--lime-primary) l c h / 0.6); transform: translateY(-1px); }
.payment-type-container { justify-content: flex-end !important; }
.dropdown-align-end { display: flex; justify-content: flex-end; }

.loading { position: relative; cursor: not-allowed; opacity: 0.8; }
.loading-spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: white; animation: spin 1s linear infinite; margin-right: 8px; }
@keyframes spin { to { transform: rotate(360deg); } }

.save-message { padding: 12px 16px; border-radius: 8px; font-size: var(--font-small); font-weight: 500; text-align: center; margin-bottom: 16px; animation: slideIn 0.3s ease-out; }
.save-message.success { background: oklch(from var(--lime-primary) l c h / 0.2); border: 1px solid oklch(from var(--lime-primary) l c h / 0.3); color: oklch(from var(--lime-primary) l c h / 1); }
.save-message.error { background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }

.autocomplete-wrapper { position: relative; width: 100%; }
.suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; background: oklch(from var(--grey-dark) l c h / 0.97); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 6px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); z-index: 1100; backdrop-filter: blur(10px); }
.suggestion-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; transition: background 0.15s ease; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
.suggestion-item:last-child { border-bottom: none; }
.suggestion-item:hover { background: oklch(from var(--lime-primary) l c h / 0.18); }
.suggestion-title { color: rgba(255, 255, 255, 0.9); font-size: var(--font-small); font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.suggestion-meta { color: rgba(255, 255, 255, 0.45); font-size: var(--font-x-small); font-weight: 400; margin-left: 10px; white-space: nowrap; flex-shrink: 0; }

.scan-shortcut {
  background: none;
  border: 1px dashed oklch(from var(--lime-primary) l c h / 0.5);
  color: var(--lime-light);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: var(--font-x-small);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.scan-shortcut:hover {
  border-style: solid;
  background: oklch(from var(--lime-primary) l c h / 0.12);
}
</style>
