<template>
  <div class="payment-calendar">
    <PaymentSidebar />

    <div class="calendar-main">
      <Calendar v-if="calendarViewMode === 'month'" />
      <WeekView v-else />
    </div>

    <div v-if="showEditMenu" class="modal-overlay edit-modal-overlay">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Payment</h3>
          <button class="close-btn" @click="closeEditMenu">×</button>
        </div>

        <div class="modal-body">

            <div v-if="editForm.type === 'inventory'">
              <InventoryFieldsSectionStepper
                :form-data="editForm"
                :get-estimated-portions="getEstimatedPortions"
                :get-depletion-time-in-days="getDepletionTimeInDays"
                :get-last-purchases="getLastPurchases"
                :get-estimated-next-purchase-date="getEstimatedNextPurchaseDate"
                @add-resupply="addResupply"
                @delete-purchase="deleteSinglePurchase"
                @save="savePayment"
              />
            </div>


            
            <div v-else>
              
              <div class="form-group side-by-side">
                <div class="form-field">
                  <label for="paymentTitle">Payment Title</label>
                  <input
                    id="paymentTitle"
                    v-model="editForm.title"
                    type="text"
                    class="form-input"
                    placeholder="Enter payment title"
                  >
                </div>
                <div class="form-field">
                  <div class="label-with-button">
                    <label for="paymentType">Payment Type</label>
                    <button class="add-type-btn" @click="addPaymentTypeFromEdit" title="Add new payment type">+</button>
                  </div>
                  <CustomDropdown
                    id="paymentType"
                    v-model="editForm.type"
                    :options="paymentTypeOptions"
                    placeholder="Select payment type"
                  />
                </div>
              </div>

              <div class="form-group side-by-side">
                <div class="form-field">
                  <label for="paymentAmount">Amount</label>
                  <input
                    id="paymentAmount"
                    v-model="editForm.amount"
                    type="number"
                    step="0.01"
                    class="form-input"
                    placeholder="0.00"
                    @blur="handleAmountInputBlur"
                    @keyup.enter="handleAmountInputKeyUp"
                  >
                </div>
                <div class="form-field">
                  <label for="paymentDate">Date</label>
                  <input
                    id="paymentDate"
                    v-model="editForm.date"
                    type="date"
                    class="form-input"
                    required
                  >
                </div>
              </div>
            </div>

          <div v-if="editForm.type !== 'inventory'" class="form-group">
            <div class="form-field">
              <label>Payment Frequency</label>
              <div class="toggle-switch">
                <div class="toggle-container four-options">
                  <button
                    :class="['toggle-option', { active: editForm.frequency === 'one-time' }]"
                    @click="editForm.frequency = 'one-time'"
                  >
                    One-Time
                  </button>
                  <button
                    :class="['toggle-option', { active: editForm.frequency === 'weekly' }]"
                    @click="editForm.frequency = 'weekly'"
                  >
                    Weekly
                  </button>
                  <button
                    :class="['toggle-option', { active: editForm.frequency === 'bi-monthly' }]"
                    @click="editForm.frequency = 'bi-monthly'"
                  >
                    Bi-Monthly
                  </button>
                  <button
                    :class="['toggle-option', { active: editForm.frequency === 'recurring' }]"
                    @click="editForm.frequency = 'recurring'"
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-separator"></div>

        <div class="modal-footer">
          <div class="btn-group">
            <button class="btn btn-success" @click="savePayment">
              Save Changes
            </button>
            <button class="btn btn-secondary" @click="deletePayment">
              Delete Payment
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddMenu" class="modal-overlay">
      <AddModal />
    </div>

    <div v-if="showPaymentTypeModal" class="modal-overlay payment-type-modal-overlay">
      <div class="payment-type-modal" @click.stop>
        <div class="modal-header">
          <h3>Manage Payment Types</h3>
          <button class="close-btn" @click="closePaymentTypeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="add-type-section">
            <h4 class="section-subtitle">Add New Payment Type</h4>
            <hr></hr>

            <div class="form-group side-by-side">
              <div class="form-field">
                <div class="label-with-char-count">
                  <label for="typeName">Payment Type Name</label>
                  <div class="char-count">{{ paymentTypeForm.name.length }}/30</div>
                </div>
                <input
                  id="typeName"
                  v-model="paymentTypeForm.name"
                  type="text"
                  class="form-input full"
                  placeholder="Enter payment type name"
                  maxlength="30"
                >
              </div>
              <div class="form-field">
                <label>Type</label>
                <div class="toggle-switch">
                  <div class="toggle-container two-options">
                    <button
                      :class="['toggle-option', { active: !paymentTypeForm.isEarning }]"
                      @click="paymentTypeForm.isEarning = false"
                    >
                      Payment
                    </button>
                    <button
                      :class="['toggle-option', { active: paymentTypeForm.isEarning }]"
                      @click="paymentTypeForm.isEarning = true"
                    >
                      Earning
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="form-field">
                <label>Color</label>
                <div class="color-picker side-by-side">
                  <div class="color-presets">
                    <button
                      v-for="preset in colorPresets"
                      :key="preset.color"
                      :class="['color-preset', { active: paymentTypeForm.color === preset.color }]"
                      :style="{ backgroundColor: preset.color }"
                      @click="paymentTypeForm.color = preset.color"
                      :title="preset.name"
                    ></button>
                  </div>
                  <div class="custom-color-input">
                    <input
                      type="color"
                      v-model="paymentTypeForm.color"
                      class="color-input"
                    >
                    <span class="color-value">{{ paymentTypeForm.color }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="form-field">
                <label>Preview</label>
                <div class="color-preview">
                  <div
                    class="preview-circle"
                    :style="{ backgroundColor: paymentTypeForm.color }"
                  >
                    {{ paymentTypeForm.name.charAt(0).toUpperCase() || 'A' }}
                  </div>
                  <span class="preview-text">{{ paymentTypeForm.name || 'Preview' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="existing-types-section">
            <h4 class="section-subtitle">Existing Payment Types</h4>
            <hr></hr>
            <div class="payment-types-list">
              <div v-for="type in paymentTypes" :key="type.id" class="payment-type-item">
                <div class="type-info">
                  <div class="type-preview">
                    <div
                      class="type-circle"
                      :style="{ backgroundColor: type.color }"
                    >
                      {{ type.label.charAt(0).toUpperCase() }}
                    </div>
                    <div class="type-details">
                      <div class="type-label">{{ type.label }}</div>
                      <div class="type-value">{{ type.value }}</div>
                    </div>
                  </div>
                </div>
                <div class="type-actions">
                  <button
                    v-if="type.isCustom"
                    class="btn btn-danger btn-sm"
                    @click="confirmDeletePaymentType(type)"
                    title="Delete payment type"
                  >
                    Delete
                  </button>
                  <button
                    v-else
                    class="btn btn-secondary btn-sm"
                    disabled
                    title="Cannot delete default payment types"
                  >
                    Default
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="btn-group">
            <button class="btn btn-primary" @click="closePaymentTypeModal">
              Close
            </button>
            <button class="btn btn-success" @click="saveNewPaymentType">
              Add Payment Type
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPieChartModal" class="modal-overlay">
      <div class="pie-chart-modal" @click.stop>
        <div class="modal-header">
          <h3>Payment Summary Chart</h3>
          <button class="close-btn" @click="closePieChartModal">×</button>
        </div>

        <div class="modal-body">
          <div class="chart-container">
            <div class="chart-header">
              <h4 class="chart-title">{{ chartPeriod }}</h4>
              <div class="chart-legend">
                <div class="chart-total">{{ chartTotal }}</div>
              </div>
            </div>

            <div class="pie-chart-wrapper">
              <svg class="pie-chart-svg" viewBox="0 0 200 200">

                <g v-for="(slice, index) in chartData" :key="slice.type">
                  <path
                    :d="getSlicePath(slice, index)"
                    :fill="slice.color"
                    :stroke="slice.color"
                    stroke-width="2"
                    class="pie-slice"
                    :class="{ 'slice-highlighted': hoveredSlice === slice.type }"
                    @mouseenter="hoveredSlice = slice.type"
                    @mouseleave="hoveredSlice = null"
                  />
                </g>

                <circle cx="100" cy="100" r="40" fill="var(--bg-color)" opacity="0.75"/>
              </svg>

              <div v-if="chartData.length === 0" class="stat-value">
                <p>No information for this month</p>
              </div>

              <div class="chart-legend-list">
                <div
                  v-for="slice in chartData"
                  :key="slice.type"
                  class="legend-item"
                  :class="{ 'legend-highlighted': hoveredSlice === slice.type }"
                  @mouseenter="hoveredSlice = slice.type"
                  @mouseleave="hoveredSlice = null"
                >
                  <div class="legend-color" :style="{ backgroundColor: slice.color }"></div>
                  <div class="legend-info">
                    <div class="legend-label">{{ slice.label }}</div>
                    <div class="legend-value">{{ slice.formattedAmount }}</div>
                    <div class="legend-percentage">{{ slice.percentage }}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="chart-summary">
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Payments:</span>
                  <span class="stat-value">{{ chartTotal }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Categories:</span>
                  <span class="stat-value">{{ chartData.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Largest Category:</span>
                  <span class="stat-value">{{ largestCategory }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ItemChart />

    <div v-if="showGearMenu" class="modal-overlay">
      <div class="gear-modal" @click.stop>
        <div class="modal-header">
          <h3>Settings</h3>
          <button class="close-btn" @click="closeGearMenu">×</button>
        </div>

        <div class="modal-body">
          <div class="settings-section">
            <h4 class="settings-title">Payment Management</h4>
            <div class="settings-options">
              <button class="settings-btn" @click="handleManagePaymentTypes">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Manage Payment Types
              </button>
              <button class="settings-btn" @click="exportPayments">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export Payments
              </button>
              <button class="settings-btn" @click="importPayments">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="17,10 12,15 7,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                </svg>
                Import Payments
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h4 class="settings-title">Calendar Settings</h4>
            <div class="settings-options">
              <button class="settings-btn" @click="resetCalendarView">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                Reset to Current Month
              </button>
              <button class="settings-btn" @click="clearAllPayments">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Clear All Payments
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h4 class="settings-title">UI / UX</h4>
            <div class="settings-options">
              <button class="settings-btn" @click="openTweaksMenu">
                Tweaks
              </button>
              <button class="settings-btn" @click="openAdvancedMenu">
                Advanced Options
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h4 class="settings-title">About</h4>
            <div class="settings-info">
              <p class="settings-text">Payment Calendar v1.0</p>
              <p class="settings-text">Manage your payments with ease</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- Custom Date Picker Component -->
    <DatePicker
      :is-visible="showDatePicker"
      :initial-date="selectedDate"
      @close="closeDatePicker"
      @select="handleDateSelection"
    />
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import './PaymentCalendar.css'

import { Payment, PaymentType } from '../types/payment.types'

import InventoryFieldsSectionStepper from './primitives/inventoryStepper.vue'
import DatePicker from './primitives/DatePicker.vue'
import PaymentSidebar from './sidebar/PaymentSidebar.vue'
import Calendar from './calendar/Calendar.vue'
import WeekView from './calendar/WeekView.vue'
import CustomDropdown from './primitives/CustomDropdown.vue'
import ItemChart from './modals/itemChart.vue'
import AddModal from './modals/AddModal.vue'

import { paymentService } from '../services/payment.service'
import { paymentTypeService } from '../services/payment-type.service'
import { calendarService } from '../services/calendar.service'
import { COLOR_PRESETS } from '../utils/constants'

import {
  currentDate,
  currentMonth,
  currentYear,
  isTransitioning,
  payments,
  paymentTypes,
  showEditMenu,
  editingPayment,
  editForm,
  showAddMenu,
  selectedDate,
  preSelectedDay,
  pulsatingDays,
  pulsatingTimer,
  showPaymentTypeModal,
  editingPaymentType,
  paymentTypeForm,
  showGearMenu,
  sortMode,
  showPieChartModal,
  hoveredSlice,
  modalStack,
  isInventoryCollapsed,
  showEarningsInNextPayments,
  selectedPaymentTypes,
  isFilteringEnabled,
  calendarViewMode
} from '../stores/ui-state.store'

import {
  currentMonthName,
  currentMonthYear,
  calendarDates,
  totalRemainingSummary,
  allMonthPayments,
  allMonthEarnings,
  totalAmount,
  chartData,
  chartTotal,
  chartPeriod,
  largestCategory,
  getPaymentTypeClassForDay,
  getDayStyle,
  getSlicePath,
  inventoryItems,
  getEstimatedPortions,
  getEstimatedDepletionDate,
  parsePortionSize,
  getDepletionTimeInDays,
  getPortionSizeFraction,
  getLastPurchases,
  getEstimatedNextPurchaseDate,
  getAnnualCostFromPurchases,
  getAnnualCostFromDepletion,
  getCurrentAnnualCost,
  getCurrentAnnualCostReactive
} from '../composables/payment-computables'

import {
  openModal,
  closeModal,
  handleEscapeKey,
  openGearMenu,
  closeGearMenu,
  exportPayments,
  importPayments,
  resetCalendarView,
  clearAllPayments,
  openPaymentTypeModal,
  closePaymentTypeModal,
  savePaymentType,
  deletePaymentType,
  confirmDeletePaymentType,
  saveNewPaymentType,
  addPaymentTypeFromEdit,
  handleManagePaymentTypes,
  openEditMenu,
  closeEditMenu,
  savePayment,
  deletePayment,
  openAddMenu,
  openInventoryAddMenu,
  handleDayClick,
  showDayPaymentsForDay,
  resetDayPayments,
  showMessage,
  highlightPaymentDay,
  goToPrevMonth,
  goToNextMonth,
  toggleInventorySection,
  togglePieChart,
  closePieChartModal,
  toggleItemChart,
  loadPayments,
  loadPaymentTypes,
  initializeComponent,
  formatCurrencyAmount,
  handleAmountInputBlur,
  handleAmountInputKeyUp,
  addResupply,
  deleteSinglePurchase,
  closeDatePicker,
  handleDateSelection,
  showDatePicker,
} from '../composables/payment-handlers'

// Color presets from shared constants
const colorPresets = COLOR_PRESETS

// Helper function to display frequency in a user-friendly format
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


// Convert paymentTypes to dropdown options format
const paymentTypeOptions = computed(() => {
  return paymentTypes.value
    .filter(t => t.value !== 'inventory')
    .map(type => ({
      value: type.value,
      label: type.label
    }))
})

// Initialize component on mount
onMounted(async () => {
  await initializeComponent()
})

document.addEventListener('keydown', handleEscapeKey)
</script>
