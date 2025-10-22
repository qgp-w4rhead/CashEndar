<template>
  <div class="payment-calendar">
    <!-- Left Sidebar - Next Payments -->
    <div class="payments-sidebar">
      <div class="section-header">
        <h2 class="section-title">Next payments</h2>
        <div class="header-buttons">
          <button class="gear-btn" @click="openGearMenu" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              <path d="M12 8l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z"/>
              <circle cx="12" cy="12" r="1"/>
            </svg>
          </button>
          <button class="add-btn" @click="openAddMenu">+</button>
        </div>
      </div>

      <div v-for="payment in sortedPayments" :key="payment.id" class="payment-item" @click="highlightPaymentDay(payment)">
        <div class="payment-avatar">
          <div :class="`avatar-circle ${payment.type}`">{{ payment.type.charAt(0).toUpperCase() }}</div>
        </div>
        <div class="payment-details">
          <div class="payment-title">{{ payment.title }}</div>
          <div class="payment-date">{{ payment.date }} at {{ payment.time }}</div>
          <div :class="['payment-amount', getPaymentTypeClass(payment.type)]">{{ payment.amount }}</div>
        </div>
        <div class="payment-menu">
          <button class="menu-btn" @click.stop="openEditMenu(payment)">⋯</button>
        </div>
      </div>

      <!-- Collapsible Next Payments Section -->
      <div class="next-payments-section">
        <div
          :class="['next-payments-header', { collapsed: isNextPaymentsCollapsed }]"
          @click="toggleNextPaymentsSection"
        >
          <h4 class="next-payments-title">
            <span class="tumbler-icon">▶</span>
            Upcoming Payments Summary
          </h4>
          <span class="next-payments-total">-{{ nextPaymentsTotal }}</span>
        </div>
        <div class="next-payments-content">
          <div class="next-payments-body">
            <div class="next-payments-summary">
              <span class="next-payments-period">{{ nextPaymentsPeriod }}</span>
            </div>
            <div class="next-payments-list">
              <div v-if="nextPayments.length === 0" class="next-payments-empty">
                No upcoming payments for the rest of the month
              </div>
              <div v-for="payment in nextPayments" :key="payment.id" class="next-payment-item" @click="highlightPaymentDay(payment)">
                <span class="payment-id">#{{ payment.id }}</span>
                <span class="next-payment-name">{{ payment.title }}</span>
                <span class="next-payment-amount">-{{ payment.amount }} {{ payment.day }}th</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Collapsible Earnings Section -->
      <div class="earnings-section">
        <div
          :class="['earnings-header', { collapsed: isEarningsCollapsed }]"
          @click="toggleEarningsSection"
        >
          <h4 class="earnings-title">
            <span class="tumbler-icon">▶</span>
            Upcoming Earnings Summary
          </h4>
          <span class="earnings-total">{{ earningsTotal }}</span>
        </div>
        <div class="earnings-content">
          <div class="earnings-body">
            <div class="earnings-summary">
              <span class="earnings-period">{{ earningsPeriod }}</span>
            </div>
            <div class="earnings-list">
              <div v-if="nextEarnings.length === 0" class="earnings-empty">
                No upcoming earnings for the rest of the month
              </div>
              <div v-for="earning in nextEarnings" :key="earning.id" class="earning-item" @click="highlightPaymentDay(earning)">
                <span class="earning-id">#{{ earning.id }}</span>
                <span class="earning-name">{{ earning.title }}</span>
                <span class="earning-amount">{{ earning.amount }} {{ earning.day }}th</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Summary Section -->
      <div class="total-remaining-section">
        <div class="total-remaining-header">
          <h4 class="total-remaining-title">Total Remaining Summary</h4>
          <span class="total-remaining-amount">{{ totalRemainingSummary }}</span>
        </div>
      </div>

      <!-- Total Section -->
      <div class="total-section">
        <div class="total-header">
          <h4 class="total-title">Total</h4>
          <span class="total-amount">{{ totalAmount }}</span>
        </div>
      </div>
    </div>

    <!-- Right Side - Calendar -->
    <div class="calendar-container">
      <div class="calendar-header">
        <button class="nav-btn prev" @click="goToPrevMonth">‹</button>
        <h3 class="month-title">{{ currentMonthYear }}</h3>
        <button class="nav-btn next" @click="goToNextMonth">›</button>
        <button class="pie-chart-btn" @click="togglePieChart" title="View Summary Chart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20"/>
          </svg>
        </button>
      </div>

      <div class="calendar-grid">
        <div class="calendar-days">
          <div class="day-header">S</div>
          <div class="day-header">M</div>
          <div class="day-header">T</div>
          <div class="day-header">W</div>
          <div class="day-header">T</div>
          <div class="day-header">F</div>
          <div class="day-header">S</div>
        </div>

        <div class="calendar-dates" :style="{ opacity: isTransitioning ? 0 : 1 }">
          <div
            v-for="dateInfo in calendarDates"
            :key="`${dateInfo.date.getFullYear()}-${dateInfo.date.getMonth()}-${dateInfo.day}`"
            :class="{
              'date-cell': true,
              'other-month': !dateInfo.isCurrentMonth,
              'has-payment': dateInfo.hasPayment,
              'selected': selectedDate && selectedDate.getDate() === dateInfo.day &&
                         selectedDate.getMonth() === currentMonth &&
                         selectedDate.getFullYear() === currentYear,
              'pulsating': pulsatingDay === dateInfo.day && dateInfo.isCurrentMonth,
              'pre-selected': preSelectedDay === dateInfo.day && dateInfo.isCurrentMonth,
              [getPaymentTypeClassForDay(dateInfo.day)]: dateInfo.hasPayment && getPaymentTypeClassForDay(dateInfo.day)
            }"
            :style="getDayStyle(dateInfo.day)"
            :data-payment-type="getPaymentTypeClassForDay(dateInfo.day) || undefined"
            @click="handleDayClick(dateInfo)"
          >
            {{ dateInfo.day }}
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Payment Modal -->
    <div v-if="showEditMenu" class="modal-overlay edit-modal-overlay">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Payment</h3>
          <button class="close-btn" @click="closeEditMenu">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <div class="label-with-button">
              <label for="paymentType">Payment Type</label>
              <button class="add-type-btn" @click="addPaymentTypeFromEdit" title="Add new payment type">+</button>
            </div>
            <select
              id="paymentType"
              v-model="editForm.type"
              class="form-input"
            >
              <option v-for="type in paymentTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="paymentTitle">Payment Title</label>
            <input
              id="paymentTitle"
              v-model="editForm.title"
              type="text"
              class="form-input"
              placeholder="Enter payment title"
            >
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
              >
            </div>
            <div class="form-field">
              <label for="paymentDate">Payment Date</label>
              <input
                id="paymentDate"
                v-model="editForm.date"
                type="date"
                class="form-input"
              >
            </div>
          </div>

          <div class="form-group">
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
                  :class="['toggle-option', { active: editForm.frequency === 'recurring' }]"
                  @click="editForm.frequency = 'recurring'"
                >
                  Recurring
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
              </div>
            </div>
          </div>
        </div>

        <!-- Separator between toggle-switch and btn-group -->
        <div class="form-separator"></div>

        <div class="modal-footer">
          <div class="btn-group">
            <button class="btn btn-primary" @click="closeEditMenu">
              Cancel
            </button>
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

    <!-- Unified Payment Modal (Add + Day Payments) -->
    <div v-if="showAddMenu" class="modal-overlay">
      <div class="add-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedDayPayments.length > 0 ? 'Add New / Edit Payment' : 'Add New Payment' }}</h3>
          <button class="close-btn" @click="closeAddMenu">×</button>
        </div>

        <div class="modal-body">
          <!-- Day Payments Section (only show if there are payments for this day) -->
          <div v-if="selectedDayPayments.length > 0" class="day-payments-section">
            <h4 class="section-subtitle">Payments for {{ getSelectedDayDate() }}</h4>
            <div class="day-payments-list">
              <div v-for="payment in selectedDayPayments" :key="payment.id" class="day-payment-item">
                <div class="payment-avatar">
                  <div :class="`avatar-circle ${payment.type}`">{{ payment.type.charAt(0).toUpperCase() }}</div>
                </div>
                <div class="payment-details">
                  <div class="payment-title">{{ payment.title }}</div>
                  <div class="payment-time">{{ payment.time }}</div>
                  <div class="payment-amount">{{ payment.amount }}</div>
                </div>
                <div class="payment-menu">
                  <button class="menu-btn" @click="openEditMenu(payment)">⋯</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add New Payment Section -->
          <div class="add-payment-section">
            <h4 class="section-subtitle">{{ selectedDayPayments.length > 0 ? 'Add Another Payment' :  `Payment Details for ${getSelectedDayDate()}` }}</h4>
            <div class="form-group">
              <div class="label-with-button">
                <label for="addPaymentType">Payment Type</label>
                <button class="add-type-btn" @click="addPaymentTypeFromAdd" title="Add new payment type">+</button>
              </div>
              <select
                id="addPaymentType"
                v-model="addForm.type"
                class="form-input"
              >
                <option v-for="type in paymentTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="addPaymentTitle">Payment Title</label>
              <input
                id="addPaymentTitle"
                v-model="addForm.title"
                type="text"
                class="form-input"
                placeholder="Enter payment title"
              >
            </div>

            <div class="form-group side-by-side">
              <div class="form-field">
                <label for="addPaymentAmount">Amount</label>
                <input
                  id="addPaymentAmount"
                  v-model="addForm.amount"
                  type="number"
                  step="0.01"
                  class="form-input"
                  placeholder="0.00"
                >
              </div>
            </div>

            <div class="form-group">
              <label>Payment Frequency</label>
              <div class="toggle-switch">
                <div class="toggle-container four-options">
                  <button
                    :class="['toggle-option', { active: addForm.frequency === 'one-time' }]"
                    @click="addForm.frequency = 'one-time'"
                  >
                    One-Time
                  </button>
                  <button
                    :class="['toggle-option', { active: addForm.frequency === 'recurring' }]"
                    @click="addForm.frequency = 'recurring'"
                  >
                    Recurring
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
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <!-- Status Messages -->
          <div v-if="saveMessage" class="save-message" :class="saveMessageType">
            {{ saveMessage }}
          </div>

          <div class="btn-group">
            <button class="btn btn-primary" @click="closeAddMenu" :disabled="isSavingPayment">
              Cancel
            </button>
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
    </div>

    <!-- Payment Type Management Modal -->
    <div v-if="showPaymentTypeModal" class="modal-overlay payment-type-modal-overlay">
      <div class="payment-type-modal" @click.stop>
        <div class="modal-header">
          <h3>Manage Payment Types</h3>
          <button class="close-btn" @click="closePaymentTypeModal">×</button>
        </div>

        <div class="modal-body">
          <!-- Existing Payment Types Section -->
          <div class="existing-types-section">
            <h4 class="section-subtitle">Existing Payment Types</h4>
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

          <!-- Add New Payment Type Section -->
          <div class="add-type-section">
            <h4 class="section-subtitle">Add New Payment Type</h4>

            <div class="form-group">
              <label for="typeName">Payment Type Name</label>
              <input
                id="typeName"
                v-model="paymentTypeForm.name"
                type="text"
                class="form-input"
                placeholder="Enter payment type name"
                maxlength="30"
              >
              <div class="char-count">{{ paymentTypeForm.name.length }}/30</div>
            </div>

            <div class="form-group">
              <label>Color</label>
              <div class="color-picker">
                <div class="color-presets">
                  <button
                    v-for="preset in colorPresets"
                    :key="preset.color"
                    :class="['color-preset', { active: paymentTypeForm.color === preset.color }]"
                    :style="{ backgroundColor: preset.color }"
                    @click="paymentTypeForm.color = preset.color"
                    :title="preset.name"
                  ></button>
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

    <!-- Pie Chart Modal -->
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
                <!-- Pie chart slices -->
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
                <!-- Center circle for donut effect -->
                <circle cx="100" cy="100" r="40" fill="var(--bg-color)" opacity="0.75"/>
              </svg>

              <!-- No data message overlay -->
              <div v-if="chartData.length === 0" class="stat-value">
                <p>No information for this month</p>
              </div>

              <!-- Chart Legend -->
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

    <!-- Gear Settings Menu Modal -->
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
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import './PaymentCalendar.css'

// Import types
import { Payment, PaymentType } from '../types/payment.types'

// Import services
import { paymentDB } from '../services/payment-db.service'
import { paymentService } from '../services/payment.service'
import { paymentTypeService } from '../services/payment-type.service'
import { calendarService } from '../services/calendar.service'

// Import stores
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
  addForm,
  isSavingPayment,
  saveMessage,
  saveMessageType,
  selectedDate,
  selectedDayPayments,
  preSelectedDay,
  pulsatingDay,
  pulsatingTimer,
  showPaymentTypeModal,
  editingPaymentType,
  paymentTypeForm,
  showGearMenu,
  showPieChartModal,
  hoveredSlice,
  modalStack,
  isNextPaymentsCollapsed,
  isEarningsCollapsed
} from '../stores/ui-state.store'

// Import composables
import {
  sortedPayments,
  currentMonthName,
  currentMonthYear,
  calendarDates,
  nextPayments,
  nextPaymentsTotal,
  nextPaymentsPeriod,
  nextEarnings,
  earningsTotal,
  earningsPeriod,
  totalRemainingSummary,
  allMonthPayments,
  allMonthEarnings,
  totalAmount,
  chartData,
  chartTotal,
  chartPeriod,
  largestCategory,
  getPaymentTypeClass,
  getPaymentTypeClassForDay,
  getDayStyle,
  getSlicePath
} from '../composables/payment-computables'

// Import handlers
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
  addPaymentTypeFromAdd,
  handleManagePaymentTypes,
  openEditMenu,
  closeEditMenu,
  savePayment,
  deletePayment,
  openAddMenu,
  closeAddMenu,
  handleDayClick,
  showDayPaymentsForDay,
  resetDayPayments,
  getSelectedDayDate,
  saveNewPayment,
  showMessage,
  highlightPaymentDay,
  goToPrevMonth,
  goToNextMonth,
  toggleNextPaymentsSection,
  toggleEarningsSection,
  togglePieChart,
  closePieChartModal,
  loadPayments,
  loadPaymentTypes,
  initializeComponent
} from '../composables/payment-handlers'

// Color presets
const colorPresets = [
  { name: 'Red', color: '#ef4444' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Green', color: '#10b981' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Teal', color: '#14b8a6' }
]

// Initialize component on mount
onMounted(async () => {
  await initializeComponent()
  document.addEventListener('keydown', handleEscapeKey)
})
</script>
