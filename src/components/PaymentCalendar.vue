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

      <div v-for="payment in payments" :key="payment.id" class="payment-item" @click="highlightPaymentDay(payment)">
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
            Next Payments Summary
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
            Next Earnings Summary
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

          <div class="form-group">
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

          <div class="form-group">
            <label for="paymentDate">Payment Date</label>
            <input
              id="paymentDate"
              v-model="editForm.date"
              type="date"
              class="form-input"
            >
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

            <div class="form-group">
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
          <div class="btn-group">
            <button class="btn btn-primary" @click="closeAddMenu">
              Cancel
            </button>
            <button class="btn btn-success" @click="saveNewPayment">
              {{ selectedDayPayments.length > 0 ? 'Add Payment' : 'Save Payment' }}
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
import { ref, reactive, computed, onMounted } from 'vue'
import './PaymentCalendar.css'

// Payment interface for TypeScript
interface Payment {
  id: string;
  title: string;
  amount: string;
  date: string;
  time?: string;
  type: string; // Changed to string to support custom types
  // Add day of month for calendar integration
  day?: number;
  // Add day of week for bi-monthly payments (0 = Sunday, 1 = Monday, etc.)
  dayOfWeek?: number;
  // Add reference date for bi-monthly payments (stored as timestamp)
  referenceDate?: number;
  // Add payment frequency type - now supports: 'one-time', 'recurring', 'weekly', 'bi-monthly'
  frequency: 'one-time' | 'recurring' | 'weekly' | 'bi-monthly';
}

// Earnings interface for TypeScript
interface Earning {
  id: string;
  title: string;
  amount: string;
  date: string;
  type: string;
  // Add day of month for calendar integration
  day?: number;
  // Add earning frequency type
  isRecurring: boolean;
}

// Payment type interface for TypeScript
interface PaymentType {
  id: string;
  label: string;
  value: string;
  color: string;
  isCustom: boolean;
  isEarning?: boolean; // New property to distinguish earnings from expenses
}

// IndexedDB service for payment storage
class PaymentDB {
  private dbName = 'PaymentCalendarDB'
  private dbVersion = 3 // Updated version for sequential IDs
  private storeName = 'payments'
  private typeStoreName = 'paymentTypes'
  private counterStoreName = 'counters'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create payments store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('day', 'day', { unique: false })
          store.createIndex('type', 'type', { unique: false })
        }

        // Create payment types store
        if (!db.objectStoreNames.contains(this.typeStoreName)) {
          const typeStore = db.createObjectStore(this.typeStoreName, { keyPath: 'id' })
          typeStore.createIndex('value', 'value', { unique: true })
        }

        // Create counters store for sequential IDs
        if (!db.objectStoreNames.contains(this.counterStoreName)) {
          const counterStore = db.createObjectStore(this.counterStoreName, { keyPath: 'name' })
        }
      }
    })
  }

  async getAllPayments(): Promise<Payment[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addPayment(payment: Payment): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(payment)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updatePayment(payment: Payment): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(payment)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deletePayment(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPaymentsByDay(day: number): Promise<Payment[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('day')
      const request = index.getAll(day)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  // Payment type management methods
  async getAllPaymentTypes(): Promise<PaymentType[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.typeStoreName], 'readonly')
      const store = transaction.objectStore(this.typeStoreName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addPaymentType(paymentType: PaymentType): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.typeStoreName], 'readwrite')
      const store = transaction.objectStore(this.typeStoreName)
      const request = store.add(paymentType)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updatePaymentType(paymentType: PaymentType): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.typeStoreName], 'readwrite')
      const store = transaction.objectStore(this.typeStoreName)
      const request = store.put(paymentType)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deletePaymentType(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.typeStoreName], 'readwrite')
      const store = transaction.objectStore(this.typeStoreName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async initializeDefaultPaymentTypes(): Promise<void> {
    const defaultTypes: PaymentType[] = [
      { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
      { id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
      { id: 'credit', label: 'Credit Card', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
      { id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
      { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
    ]

    try {
      const existingTypes = await this.getAllPaymentTypes()
      console.log('Existing payment types:', existingTypes.length, existingTypes.map(t => t.value))

      if (existingTypes.length === 0) {
        console.log('No existing types found, initializing defaults...')
        for (const type of defaultTypes) {
          await this.addPaymentType(type)
          console.log('Added default type:', type.value)
        }
      } else {
        // Check if earnings type exists, if not, add it
        const earningsType = existingTypes.find(t => t.value === 'earnings')
        if (!earningsType) {
          console.log('Earnings type missing, adding it...')
          const earningsTypeToAdd: PaymentType = { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
          await this.addPaymentType(earningsTypeToAdd)
          console.log('Added missing earnings type')
        }
      }
    } catch (error) {
      console.error('Error initializing default payment types:', error)
    }
  }

  // Counter management methods for sequential IDs
  async getNextPaymentId(): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.counterStoreName], 'readwrite')
      const store = transaction.objectStore(this.counterStoreName)

      // Try to get the current counter
      const getRequest = store.get('paymentCounter')

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const counter = getRequest.result

        if (counter) {
          // Increment existing counter
          const nextId = counter.value + 1
          counter.value = nextId

          const updateRequest = store.put(counter)
          updateRequest.onerror = () => reject(updateRequest.error)
          updateRequest.onsuccess = () => resolve(nextId)
        } else {
          // Initialize counter at 1
          const newCounter = { name: 'paymentCounter', value: 1 }
          const addRequest = store.add(newCounter)
          addRequest.onerror = () => reject(addRequest.error)
          addRequest.onsuccess = () => resolve(1)
        }
      }
    })
  }
}

// Initialize IndexedDB service
const paymentDB = new PaymentDB()

// Reactive payment types that will load from database
const paymentTypes = ref<PaymentType[]>([])

// Calendar state
const currentDate = ref(new Date())
const currentMonth = ref(currentDate.value.getMonth())
const currentYear = ref(currentDate.value.getFullYear())
const isTransitioning = ref(false)

// Month names
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Payment data - starts empty, will be populated when user adds payments
const payments = ref<Payment[]>([])

// Earnings data - starts empty, will be populated when user adds earnings
const earnings = ref<Earning[]>([])

// Edit menu state
const showEditMenu = ref(false)
const editingPayment = ref<Payment | null>(null)
const editForm = reactive({
  title: '',
  amount: '',
  type: 'rent' as Payment['type'],
  date: '',
  frequency: 'recurring' as Payment['frequency']
})

// Add payment state
const showAddMenu = ref(false)
const addForm = reactive({
  title: '',
  amount: '',
  type: 'rent' as Payment['type'],
  day: 1, // Day of month for the payment
  frequency: 'recurring' as Payment['frequency'] // Default to recurring
})

// Click handlers for calendar days
const selectedDate = ref<Date | null>(null)
const dayPayments = ref<Payment[]>([])

// Day payments state (for unified modal)
const selectedDayPayments = ref<Payment[]>([])

// Track if a day is pre-selected (first click) before opening modal (second click)
const preSelectedDay = ref<number | null>(null)

// Pulsating animation state
const pulsatingDay = ref<number | null>(null)
const pulsatingTimer = ref<NodeJS.Timeout | null>(null)

// Payment type management state
const showPaymentTypeModal = ref(false)
const editingPaymentType = ref<PaymentType | null>(null)
const paymentTypeForm = reactive({
  name: '',
  color: '#ef4444' // Default to red
})

// Gear menu state
const showGearMenu = ref(false)

// Pie chart modal state
const showPieChartModal = ref(false)

// Pie chart hover state
const hoveredSlice = ref<string | null>(null)

// Pie chart toggle function
const togglePieChart = () => {
  showPieChartModal.value = !showPieChartModal.value
  if (showPieChartModal.value) {
    openModal('pieChart')
  } else {
    closeModal('pieChart')
  }
}

// Close pie chart modal
const closePieChartModal = () => {
  showPieChartModal.value = false
  closeModal('pieChart')
}

// Chart data computed properties
interface ChartSlice {
  type: string;
  label: string;
  amount: number;
  color: string;
  percentage: number;
  formattedAmount: string;
}

const chartData = computed((): ChartSlice[] => {
  // Group only expense payments by type and calculate totals (exclude earnings)
  const typeTotals = new Map<string, number>()

  payments.value.forEach(payment => {
    // Find the payment type to check if it's an earning
    const paymentType = paymentTypes.value.find(pt => pt.value === payment.type)

    // Skip earnings (only include expenses/spending)
    if (paymentType && paymentType.isEarning) {
      return
    }

    const amount = parseFloat(payment.amount.replace('$', '')) || 0
    const currentTotal = typeTotals.get(payment.type) || 0
    typeTotals.set(payment.type, currentTotal + amount)
  })

  // Convert to chart slices
  const total = Array.from(typeTotals.values()).reduce((sum, amount) => sum + amount, 0)
  const slices: ChartSlice[] = []

  typeTotals.forEach((amount, type) => {
    const paymentType = paymentTypes.value.find(pt => pt.value === type)
    if (paymentType && amount > 0 && !paymentType.isEarning) {
      const percentage = total > 0 ? Math.round((amount / total) * 100) : 0
      slices.push({
        type,
        label: paymentType.label,
        amount,
        color: paymentType.color,
        percentage,
        formattedAmount: `$${amount.toFixed(2)}`
      })
    }
  })

  // Sort by amount (largest first)
  return slices.sort((a, b) => b.amount - a.amount)
})

const chartTotal = computed(() => {
  const total = chartData.value.reduce((sum, slice) => sum + slice.amount, 0)
  return `$${total.toFixed(2)}`
})

const chartPeriod = computed(() => {
  const today = new Date()
  const monthName = monthNames[today.getMonth()]
  const year = today.getFullYear()
  return `${monthName} ${year}`
})

const largestCategory = computed(() => {
  const largest = chartData.value[0]
  return largest ? largest.label : 'None'
})

// Generate SVG path for pie chart slice
const getSlicePath = (slice: ChartSlice, index: number): string => {
  const total = chartData.value.reduce((sum, s) => sum + s.amount, 0)
  if (total === 0) return ''

  // Calculate angles
  let currentAngle = 0
  for (let i = 0; i < index; i++) {
    currentAngle += (chartData.value[i].amount / total) * 360
  }

  const sliceAngle = (slice.amount / total) * 360
  const startAngle = currentAngle
  const endAngle = currentAngle + sliceAngle

  // Convert to radians
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  // Calculate coordinates
  const centerX = 100
  const centerY = 100
  const radius = 60

  const x1 = centerX + radius * Math.cos(startRad)
  const y1 = centerY + radius * Math.sin(startRad)
  const x2 = centerX + radius * Math.cos(endRad)
  const y2 = centerY + radius * Math.sin(endRad)

  // Create SVG path for the slice
  const largeArcFlag = sliceAngle > 180 ? 1 : 0

  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
}

// Next payments section state
const isNextPaymentsCollapsed = ref(false)

// Earnings section state
const isEarningsCollapsed = ref(false)

// Color presets as requested
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

// Load payment types from database
const loadPaymentTypes = async () => {
  try {
    console.log('Starting payment types load...')

    // Force database initialization with retry logic
    let initAttempts = 0
    const maxAttempts = 3

    while (initAttempts < maxAttempts) {
      try {
        await paymentDB.init()
        console.log('Database initialized successfully')
        break
      } catch (initError) {
        initAttempts++
        console.warn(`Database init attempt ${initAttempts} failed:`, initError)
        if (initAttempts >= maxAttempts) throw initError
        await new Promise(resolve => setTimeout(resolve, 100)) // Wait 100ms before retry
      }
    }

    // Try to initialize default types
    try {
      await paymentDB.initializeDefaultPaymentTypes()
      console.log('Default types initialized')
    } catch (initError) {
      console.warn('Default types initialization failed:', initError)
    }

    // Get all payment types with retry logic
    let types = []
    let typeAttempts = 0

    while (typeAttempts < maxAttempts) {
      try {
        types = await paymentDB.getAllPaymentTypes()
        console.log('Loaded payment types:', types)
        break
      } catch (typeError) {
        typeAttempts++
        console.warn(`Get payment types attempt ${typeAttempts} failed:`, typeError)
        if (typeAttempts >= maxAttempts) throw typeError
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    if (types && types.length > 0) {
      paymentTypes.value = types
      console.log('Using database payment types:', types.length)
    } else {
      console.log('No payment types in database, using fallback defaults')
      // Database is empty, use fallback defaults
      const defaultTypes: PaymentType[] = [
        { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
        { id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
        { id: 'credit', label: 'Credit Card', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
        { id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
        { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
      ]

      paymentTypes.value = defaultTypes

      // Try to save defaults to database for future use
      try {
        for (const type of defaultTypes) {
          await paymentDB.addPaymentType(type)
        }
        console.log('Default types saved to database')
      } catch (saveError) {
        console.warn('Could not save default types to database:', saveError)
      }
    }
  } catch (error) {
    console.error('Error loading payment types:', error)
    // Fallback to default types if database fails completely
    paymentTypes.value = [
      { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
      { id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
      { id: 'credit', label: 'Credit Card', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
      { id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
      { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
    ]
    console.log('Using fallback payment types')
  }
}

// Payment type management methods
const openPaymentTypeModal = (type?: PaymentType) => {
  if (type) {
    editingPaymentType.value = type
    paymentTypeForm.name = type.label
    paymentTypeForm.color = type.color
  } else {
    editingPaymentType.value = null
    paymentTypeForm.name = ''
    paymentTypeForm.color = '#ef4444'
  }
  showPaymentTypeModal.value = true
  openModal('paymentType')
}

const closePaymentTypeModal = () => {
  showPaymentTypeModal.value = false
  editingPaymentType.value = null
  closeModal('paymentType')
}

const savePaymentType = async () => {
  if (!paymentTypeForm.name.trim()) return

  try {
    const typeValue = paymentTypeForm.name.toLowerCase().replace(/\s+/g, '_')

    if (editingPaymentType.value) {
      // Update existing type
      const updatedType: PaymentType = {
        ...editingPaymentType.value,
        label: paymentTypeForm.name.trim(),
        value: typeValue,
        color: paymentTypeForm.color
      }
      await paymentDB.updatePaymentType(updatedType)

      // Update local array
      const index = paymentTypes.value.findIndex(t => t.id === updatedType.id)
      if (index !== -1) {
        paymentTypes.value[index] = updatedType
      }
    } else {
      // Add new type
      const newType: PaymentType = {
        id: Date.now().toString(),
        label: paymentTypeForm.name.trim(),
        value: typeValue,
        color: paymentTypeForm.color,
        isCustom: true
      }
      await paymentDB.addPaymentType(newType)
      paymentTypes.value.push(newType)
    }

    closePaymentTypeModal()
  } catch (error) {
    console.error('Error saving payment type:', error)
  }
}

const deletePaymentType = async (type: PaymentType) => {
  if (!type.isCustom) return // Don't allow deletion of default types

  // Check if any payments use this type
  const paymentsUsingType = payments.value.filter(p => p.type === type.value)
  if (paymentsUsingType.length > 0) {
    alert(`Cannot delete "${type.label}" because ${paymentsUsingType.length} payment(s) are using this type.`)
    return
  }

  if (confirm(`Are you sure you want to delete "${type.label}"?`)) {
    try {
      await paymentDB.deletePaymentType(type.id)
      paymentTypes.value = paymentTypes.value.filter(t => t.id !== type.id)
    } catch (error) {
      console.error('Error deleting payment type:', error)
    }
  }
}

const confirmDeletePaymentType = async (type: PaymentType) => {
  await deletePaymentType(type)
}

const saveNewPaymentType = async () => {
  if (!paymentTypeForm.name.trim()) return

  try {
    const typeValue = paymentTypeForm.name.toLowerCase().replace(/\s+/g, '_')

    // Check if type value already exists
    const existingType = paymentTypes.value.find(t => t.value === typeValue)
    if (existingType) {
      alert(`A payment type with value "${typeValue}" already exists.`)
      return
    }

    const newType: PaymentType = {
      id: Date.now().toString(),
      label: paymentTypeForm.name.trim(),
      value: typeValue,
      color: paymentTypeForm.color,
      isCustom: true
    }

    await paymentDB.addPaymentType(newType)
    paymentTypes.value.push(newType)

    // Reset form
    paymentTypeForm.name = ''
    paymentTypeForm.color = '#ef4444'

    console.log('New payment type added:', newType)
  } catch (error) {
    console.error('Error saving new payment type:', error)
    alert('Error adding payment type. Please try again.')
  }
}

// Add "+" button handlers for both locations
const addPaymentTypeFromEdit = () => {
  openPaymentTypeModal()
}

const addPaymentTypeFromAdd = () => {
  openPaymentTypeModal()
}

// Handle "Manage Payment Types" button click
const handleManagePaymentTypes = () => {
  console.log('Manage Payment Types clicked')
  console.log('Payment types available:', paymentTypes.value.length)
  openPaymentTypeModal()
}

// Gear menu functionality
const openGearMenu = () => {
  console.log('Opening gear menu...')
  showGearMenu.value = true
  openModal('gear')
  console.log('Gear menu state:', showGearMenu.value)
}

const closeGearMenu = () => {
  showGearMenu.value = false
  closeModal('gear')
}

// Gear menu functions
const exportPayments = () => {
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

const importPayments = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedPayments = JSON.parse(text) as Payment[]

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

const resetCalendarView = () => {
  const now = new Date()
  currentMonth.value = now.getMonth()
  currentYear.value = now.getFullYear()
  selectedDate.value = null
  closeGearMenu()
}

const clearAllPayments = async () => {
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

// Open edit menu for a specific payment
const openEditMenu = (payment: Payment | any) => {
  editingPayment.value = payment
  editForm.title = payment.title
  editForm.amount = payment.amount.replace('$', '')
  editForm.type = payment.type
  editForm.date = payment.date
  editForm.frequency = payment.frequency || 'recurring' // Use frequency, fallback to recurring for legacy data
  showEditMenu.value = true
  openModal('edit')
}

// Close edit menu
const closeEditMenu = () => {
  showEditMenu.value = false
  editingPayment.value = null
  closeModal('edit')
}

// Save payment changes
const savePayment = async () => {
  if (!editingPayment.value) return

  try {
    const updatedPayment = {
      ...editingPayment.value,
      title: editForm.title,
      amount: `$${editForm.amount}`,
      type: editForm.type,
      date: editForm.date,
      frequency: editForm.frequency
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

    closeEditMenu()
  } catch (error) {
    console.error('Error updating payment:', error)
  }
}

// Delete payment
const deletePayment = async () => {
  if (!editingPayment.value) return

  try {
    await paymentDB.deletePayment(editingPayment.value.id)

    // Remove from local payments array
    const paymentIndex = payments.value.findIndex(p => p.id === editingPayment.value!.id)
    if (paymentIndex !== -1) {
      payments.value.splice(paymentIndex, 1)
    }

    // Remove from selectedDayPayments array if it exists there
    const dayPaymentIndex = selectedDayPayments.value.findIndex(p => p.id === editingPayment.value!.id)
    if (dayPaymentIndex !== -1) {
      selectedDayPayments.value.splice(dayPaymentIndex, 1)
    }

    closeEditMenu()
  } catch (error) {
    console.error('Error deleting payment:', error)
  }
}

// Computed properties for calendar
const currentMonthName = computed(() => monthNames[currentMonth.value])
const currentMonthYear = computed(() => `${currentMonthName.value} ${currentYear.value}`)

// Helper function to parse payment date string
const parsePaymentDate = (dateString: string) => {
  // Handle format like "October 23rd, 2025"
  const parts = dateString.split(' ')
  if (parts.length >= 3) {
    const monthName = parts[0]
    const dayPart = parts[1].replace(/\D/g, '') // Remove "rd", "th", etc.
    const year = parseInt(parts[2])

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const monthIndex = monthNames.indexOf(monthName)
    const day = parseInt(dayPart)

    if (monthIndex !== -1 && day && year) {
      return {
        month: monthIndex,
        day: day,
        year: year
      }
    }
  }

  // Fallback: try to parse as regular date
  const fallbackDate = new Date(dateString)
  if (!isNaN(fallbackDate.getTime())) {
    return {
      month: fallbackDate.getMonth(),
      day: fallbackDate.getDate(),
      year: fallbackDate.getFullYear()
    }
  }

  return null
}

// Helper function to get the next occurrence of a bi-monthly payment (every 2 weeks)
const getNextBiMonthlyDate = (referenceTimestamp: number, dayOfWeek: number) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day
  
  const referenceDate = new Date(referenceTimestamp)
  referenceDate.setHours(0, 0, 0, 0)
  
  // Calculate the difference in milliseconds
  const diffTime = today.getTime() - referenceDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Calculate how many 2-week periods have passed
  const twoWeeksInDays = 14
  const periodsPassed = Math.floor(diffDays / twoWeeksInDays)
  
  // Calculate the next occurrence
  // If we're exactly on a payment day, calculate the one after
  let nextOccurrence: Date
  if (diffDays % twoWeeksInDays === 0 && diffDays >= 0) {
    // Today is a payment day, next one is in 2 weeks
    nextOccurrence = new Date(referenceDate.getTime() + ((periodsPassed + 1) * twoWeeksInDays * 24 * 60 * 60 * 1000))
  } else {
    // Calculate the next payment day
    nextOccurrence = new Date(referenceDate.getTime() + ((periodsPassed + 1) * twoWeeksInDays * 24 * 60 * 60 * 1000))
  }
  
  // If the calculated date is in the past, add 2 more weeks
  if (nextOccurrence.getTime() < today.getTime()) {
    nextOccurrence = new Date(nextOccurrence.getTime() + (twoWeeksInDays * 24 * 60 * 60 * 1000))
  }
  
  return nextOccurrence
}

// Helper function to get all bi-monthly occurrences within a date range
const getBiMonthlyOccurrencesInRange = (payment: Payment, startDate: Date, endDate: Date) => {
  if (!payment.referenceDate) return []
  
  const occurrences: Payment[] = []
  const referenceDate = new Date(payment.referenceDate)
  referenceDate.setHours(0, 0, 0, 0)
  
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  
  const twoWeeksInDays = 14
  const twoWeeksInMs = twoWeeksInDays * 24 * 60 * 60 * 1000
  
  // Start from reference date and iterate forward
  let currentDate = new Date(referenceDate)
  let occurrenceCount = 0
  
  // Find all occurrences from reference date to end date
  while (currentDate.getTime() <= end.getTime()) {
    // Check if this occurrence is within our range
    if (currentDate.getTime() >= start.getTime()) {
      // Create a copy of the payment with updated date info
      const dayOfMonth = currentDate.getDate()
      const monthName = monthNames[currentDate.getMonth()]
      const daySuffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th'
      
      occurrences.push({
        ...payment,
        id: `${payment.id}-${occurrenceCount}`,
        date: `${monthName} ${dayOfMonth}${daySuffix}, ${currentDate.getFullYear()}`,
        day: dayOfMonth
      })
    }
    
    // Move to next occurrence (2 weeks later)
    currentDate = new Date(currentDate.getTime() + twoWeeksInMs)
    occurrenceCount++
    
    // Safety check to prevent infinite loop
    if (occurrenceCount > 100) break
  }
  
  return occurrences
}

// Helper function to get all weekly occurrences within a date range
const getWeeklyOccurrencesInRange = (payment: Payment, startDate: Date, endDate: Date) => {
  if (!payment.referenceDate) return []
  
  const occurrences: Payment[] = []
  const referenceDate = new Date(payment.referenceDate)
  referenceDate.setHours(0, 0, 0, 0)
  
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  
  const oneWeekInDays = 7
  const oneWeekInMs = oneWeekInDays * 24 * 60 * 60 * 1000
  
  // Start from reference date and iterate forward
  let currentDate = new Date(referenceDate)
  let occurrenceCount = 0
  
  // Find all occurrences from reference date to end date
  while (currentDate.getTime() <= end.getTime()) {
    // Check if this occurrence is within our range
    if (currentDate.getTime() >= start.getTime()) {
      // Create a copy of the payment with updated date info
      const dayOfMonth = currentDate.getDate()
      const monthName = monthNames[currentDate.getMonth()]
      const daySuffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th'
      
      occurrences.push({
        ...payment,
        id: `${payment.id}-${occurrenceCount}`,
        date: `${monthName} ${dayOfMonth}${daySuffix}, ${currentDate.getFullYear()}`,
        day: dayOfMonth
      })
    }
    
    // Move to next occurrence (1 week later)
    currentDate = new Date(currentDate.getTime() + oneWeekInMs)
    occurrenceCount++
    
    // Safety check to prevent infinite loop
    if (occurrenceCount > 200) break
  }
  
  return occurrences
}

// Next payments computed properties (expenses only)
const nextPayments = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Define the range: from today to end of month
  const startDate = new Date(currentYear, currentMonth, currentDay)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  const futurePayments: Payment[] = []

  // Process each payment
  payments.value.forEach(payment => {
    // Find the payment type to check if it's an earning
    const paymentType = paymentTypes.value.find(type => type.value === payment.type)
    
    if (paymentType && paymentType.isEarning) {
      return // Skip earnings
    }

    // Handle different frequency types
    if (payment.frequency === 'one-time') {
      // For one-time payments, check if the original date is in the range
      const dateInfo = parsePaymentDate(payment.date)
      if (!dateInfo) return

      const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
      const paymentDate = new Date(paymentYear, paymentMonth, paymentDay)

      if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
        futurePayments.push(payment)
      }
    } else if (payment.frequency === 'weekly') {
      // For weekly payments, get all occurrences in the range
      const occurrences = getWeeklyOccurrencesInRange(payment, startDate, endDate)
      futurePayments.push(...occurrences)
    } else if (payment.frequency === 'bi-monthly') {
      // For bi-monthly payments, get all occurrences in the range
      const occurrences = getBiMonthlyOccurrencesInRange(payment, startDate, endDate)
      futurePayments.push(...occurrences)
    } else {
      // For recurring payments (monthly on same day)
      if (!payment.day) return

      // Check if this month's occurrence is in the future
      if (payment.day >= currentDay) {
        futurePayments.push(payment)
      }
    }
  })

  return futurePayments
})

const nextPaymentsTotal = computed(() => {
  const total = nextPayments.value.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount.replace('$', '')) || 0
    return sum + amount
  }, 0)

  return `$${total.toFixed(2)}`
})

const nextPaymentsPeriod = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const monthName = monthNames[currentMonth]
  const year = currentYear

  return `${monthName} ${currentDay} - ${monthName} 31, ${year}`
})

// Next payments section functions
const toggleNextPaymentsSection = () => {
  isNextPaymentsCollapsed.value = !isNextPaymentsCollapsed.value
}

// Earnings computed properties (earnings only)
const nextEarnings = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Define the range: from today to end of month
  const startDate = new Date(currentYear, currentMonth, currentDay)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  console.log('Calculating next earnings...')
  console.log('Current date:', today.toDateString())
  console.log('Range:', startDate.toDateString(), 'to', endDate.toDateString())

  const earnings: Payment[] = []

  // Process each payment
  payments.value.forEach(payment => {
    // Find the payment type to check if it's an earning
    const paymentType = paymentTypes.value.find(type => type.value === payment.type)
    
    if (!paymentType || !paymentType.isEarning) {
      return // Skip non-earnings
    }

    // Handle different frequency types for earnings
    if (payment.frequency === 'one-time') {
      // For one-time payments, check if the original date is in the range
      const dateInfo = parsePaymentDate(payment.date)
      if (!dateInfo) return

      const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
      const paymentDate = new Date(paymentYear, paymentMonth, paymentDay)

      if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
        earnings.push(payment)
      }
    } else if (payment.frequency === 'weekly') {
      // For weekly payments, get all occurrences in the range
      const occurrences = getWeeklyOccurrencesInRange(payment, startDate, endDate)
      earnings.push(...occurrences)
    } else if (payment.frequency === 'bi-monthly') {
      // For bi-monthly payments, get all occurrences in the range
      const occurrences = getBiMonthlyOccurrencesInRange(payment, startDate, endDate)
      earnings.push(...occurrences)
    } else {
      // For recurring payments (monthly on same day)
      if (!payment.day) return

      // Check if this month's occurrence is in the future
      if (payment.day >= currentDay) {
        earnings.push(payment)
      }
    }
  })

  console.log('Final earnings count:', earnings.length)
  console.log('Earnings:', earnings.map(e => ({ title: e.title, date: e.date })))
  return earnings
})

const earningsTotal = computed(() => {
  const total = nextEarnings.value.reduce((sum, earning) => {
    const amount = parseFloat(earning.amount.replace('$', '')) || 0
    return sum + amount
  }, 0)

  return `$${total.toFixed(2)}`
})

const earningsPeriod = computed(() => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  const monthName = monthNames[currentMonth]
  const year = currentYear

  return `${monthName} ${currentDay} - ${monthName} 31, ${year}`
})

// Total summary computed property
const totalRemainingSummary = computed(() => {
  const paymentsAmount = parseFloat(nextPaymentsTotal.value.replace(/[$,]/g, '')) || 0
  const earningsAmount = parseFloat(earningsTotal.value.replace(/[$,]/g, '')) || 0

  const netTotal = earningsAmount - paymentsAmount // earnings minus payments (money in minus money out)

  return netTotal >= 0 ? `$${netTotal.toFixed(2)}` : `-$${Math.abs(netTotal).toFixed(2)}`
})

// All payments in current month (entire month, not just from current date)
const allMonthPayments = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Define the range: entire current month
  const startDate = new Date(currentYear, currentMonth, 1)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  const monthPayments: Payment[] = []

  // Process each payment
  payments.value.forEach(payment => {
    // Find the payment type to check if it's an earning
    const paymentType = paymentTypes.value.find(type => type.value === payment.type)

    if (paymentType && paymentType.isEarning) {
      return // Skip earnings
    }

    // Handle different frequency types
    if (payment.frequency === 'one-time') {
      // For one-time payments, check if the original date is in the range
      const dateInfo = parsePaymentDate(payment.date)
      if (!dateInfo) return

      const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
      const paymentDate = new Date(paymentYear, paymentMonth, paymentDay)

      if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
        monthPayments.push(payment)
      }
    } else if (payment.frequency === 'weekly') {
      // For weekly payments, get all occurrences in the range
      const occurrences = getWeeklyOccurrencesInRange(payment, startDate, endDate)
      monthPayments.push(...occurrences)
    } else if (payment.frequency === 'bi-monthly') {
      // For bi-monthly payments, get all occurrences in the range
      const occurrences = getBiMonthlyOccurrencesInRange(payment, startDate, endDate)
      monthPayments.push(...occurrences)
    } else {
      // For recurring payments (monthly on same day)
      if (!payment.day) return

      // Include this month's occurrence regardless of current day
      monthPayments.push(payment)
    }
  })

  return monthPayments
})

// All earnings in current month (entire month, not just from current date)
const allMonthEarnings = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Define the range: entire current month
  const startDate = new Date(currentYear, currentMonth, 1)
  const endDate = new Date(currentYear, currentMonth + 1, 0) // Last day of current month

  const monthEarnings: Payment[] = []

  // Process each payment
  payments.value.forEach(payment => {
    // Find the payment type to check if it's an earning
    const paymentType = paymentTypes.value.find(type => type.value === payment.type)

    if (!paymentType || !paymentType.isEarning) {
      return // Skip non-earnings
    }

    // Handle different frequency types for earnings
    if (payment.frequency === 'one-time') {
      // For one-time payments, check if the original date is in the range
      const dateInfo = parsePaymentDate(payment.date)
      if (!dateInfo) return

      const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
      const paymentDate = new Date(paymentYear, paymentMonth, paymentDay)

      if (paymentDate.getTime() >= startDate.getTime() && paymentDate.getTime() <= endDate.getTime()) {
        monthEarnings.push(payment)
      }
    } else if (payment.frequency === 'weekly') {
      // For weekly payments, get all occurrences in the range
      const occurrences = getWeeklyOccurrencesInRange(payment, startDate, endDate)
      monthEarnings.push(...occurrences)
    } else if (payment.frequency === 'bi-monthly') {
      // For bi-monthly payments, get all occurrences in the range
      const occurrences = getBiMonthlyOccurrencesInRange(payment, startDate, endDate)
      monthEarnings.push(...occurrences)
    } else {
      // For recurring payments (monthly on same day)
      if (!payment.day) return

      // Include this month's occurrence regardless of current day
      monthEarnings.push(payment)
    }
  })

  return monthEarnings
})

// Total amount computed property (net total: earnings minus payments for entire month)
const totalAmount = computed(() => {
  const paymentsAmount = allMonthPayments.value.reduce((sum, payment) => {
    const amount = parseFloat(payment.amount.replace('$', '')) || 0
    return sum + amount // Payments are expenses, so we add them (they'll be negative in display)
  }, 0)

  const earningsAmount = allMonthEarnings.value.reduce((sum, earning) => {
    const amount = parseFloat(earning.amount.replace('$', '')) || 0
    return sum + amount
  }, 0)

  // Net total: earnings minus payments (payments are treated as negative)
  const netTotal = earningsAmount - paymentsAmount

  return netTotal >= 0 ? `$${netTotal.toFixed(2)}` : `-$${Math.abs(netTotal).toFixed(2)}`
})

// Earnings section functions
const toggleEarningsSection = () => {
  isEarningsCollapsed.value = !isEarningsCollapsed.value
}

// Helper function to get payment type class for styling
const getPaymentTypeClass = (paymentType: string) => {
  const paymentTypeObj = paymentTypes.value.find(type => type.value === paymentType)
  return paymentTypeObj && paymentTypeObj.isEarning ? 'payment-earning' : 'payment-expense'
}

// Helper function to get the dominant payment type class for a specific day
const getPaymentTypeClassForDay = (day: number) => {
  // Get all payments for this day
  const dayPayments = payments.value.filter(payment => {
    // Check for regular payments (day-based)
    if (payment.day === day) return true

    // Check for weekly payments
    if (payment.frequency === 'weekly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
      const refDate = new Date(payment.referenceDate)
      refDate.setHours(0, 0, 0, 0)

      const checkDate = new Date(currentYear.value, currentMonth.value, day)
      checkDate.setHours(0, 0, 0, 0)

      const diffTime = checkDate.getTime() - refDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      // Check if this date is on a 1-week interval (7 days)
      if (diffDays >= 0 && diffDays % 7 === 0) return true
    }

    // Check for bi-monthly payments
    if (payment.frequency === 'bi-monthly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
      const refDate = new Date(payment.referenceDate)
      refDate.setHours(0, 0, 0, 0)

      const checkDate = new Date(currentYear.value, currentMonth.value, day)
      checkDate.setHours(0, 0, 0, 0)

      const diffTime = checkDate.getTime() - refDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      // Check if this date is on a 2-week interval (14 days)
      if (diffDays >= 0 && diffDays % 14 === 0) return true
    }

    return false
  })

  // If no payments for this day, return empty string
  if (dayPayments.length === 0) return ''

  // Find the dominant payment type (prioritize non-earnings, then by amount)
  const nonEarningPayments = dayPayments.filter(payment => {
    const paymentType = paymentTypes.value.find(type => type.value === payment.type)
    return !paymentType || !paymentType.isEarning
  })

  if (nonEarningPayments.length > 0) {
    // Return the type of the highest amount non-earning payment
    const highestPayment = nonEarningPayments.reduce((prev, current) => {
      const prevAmount = parseFloat(prev.amount.replace('$', '')) || 0
      const currentAmount = parseFloat(current.amount.replace('$', '')) || 0
      return currentAmount > prevAmount ? current : prev
    })
    return highestPayment.type
  } else {
    // If only earnings, return the type of the highest amount earning
    const highestEarning = dayPayments.reduce((prev, current) => {
      const prevAmount = parseFloat(prev.amount.replace('$', '')) || 0
      const currentAmount = parseFloat(current.amount.replace('$', '')) || 0
      return currentAmount > prevAmount ? current : prev
    })
    return highestEarning.type
  }
}

// Helper function to get the style for a specific day based on payment types
const getDayStyle = (day: number) => {
  const paymentTypeClass = getPaymentTypeClassForDay(day)
  if (!paymentTypeClass) return {}

  // Find the payment type to get its color
  const paymentType = paymentTypes.value.find(type => type.value === paymentTypeClass)
  if (!paymentType) return {}

  return {
    '--payment-color': paymentType.color,
    'backgroundColor': `${paymentType.color}20`, // 20 is hex for 12.5% opacity
    'borderColor': paymentType.color,
    'color': paymentType.color
  }
}

// Get calendar dates for current month
const calendarDates = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  // First day of the month
  const firstDay = new Date(year, month, 1)
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  // First day of the week (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDay.getDay()

  const dates = []

  // Add empty cells for days before month starts
  for (let i = 0; i < firstDayOfWeek; i++) {
    const prevMonth = new Date(year, month, -firstDayOfWeek + i + 1)
    dates.push({
      day: prevMonth.getDate(),
      isCurrentMonth: false,
      date: prevMonth,
      hasPayment: false
    })
  }

  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)

    // Check for regular payments (day-based)
    let payment = payments.value.find(p => p.day === day)

    // If no regular payment found, check for weekly/bi-monthly payments
    if (!payment) {
      const dayOfWeek = date.getDay()
      
      // Check for weekly payments (7-day interval)
      payment = payments.value.find(p => {
        if (p.frequency !== 'weekly' || p.dayOfWeek !== dayOfWeek || !p.referenceDate) {
          return false
        }
        
        const refDate = new Date(p.referenceDate)
        refDate.setHours(0, 0, 0, 0)
        
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)
        
        const diffTime = checkDate.getTime() - refDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        // Check if this date is on a 1-week interval (7 days)
        return diffDays >= 0 && diffDays % 7 === 0
      })
      
      // If no weekly payment found, check for bi-monthly payments (14-day interval)
      if (!payment) {
        payment = payments.value.find(p => {
          if (p.frequency !== 'bi-monthly' || p.dayOfWeek !== dayOfWeek || !p.referenceDate) {
            return false
          }
          
          const refDate = new Date(p.referenceDate)
          refDate.setHours(0, 0, 0, 0)
          
          const checkDate = new Date(date)
          checkDate.setHours(0, 0, 0, 0)
          
          const diffTime = checkDate.getTime() - refDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          
          // Check if this date is on a 2-week interval (14 days)
          return diffDays >= 0 && diffDays % 14 === 0
        })
      }
    }

    dates.push({
      day,
      isCurrentMonth: true,
      date,
      hasPayment: !!payment
    })
  }

  // Add days from next month to fill the grid (35 cells total for 5 rows)
  const remainingCells = 35 - dates.length
  for (let day = 1; day <= remainingCells && dates.length < 35; day++) {
    const nextMonth = new Date(year, month + 1, day)
    dates.push({
      day,
      isCurrentMonth: false,
      date: nextMonth,
      hasPayment: false
    })
  }

  return dates
})

// Calendar navigation functions
const navigateMonth = (direction: 'prev' | 'next') => {
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
const goToPrevMonth = () => navigateMonth('prev')

// Navigate to next month
const goToNextMonth = () => navigateMonth('next')

// Open add menu
const openAddMenu = () => {
  // Reset form to default values
  addForm.title = ''
  addForm.amount = ''
  addForm.type = 'rent'
  showAddMenu.value = true
}

// Close add menu
const closeAddMenu = () => {
  showAddMenu.value = false
}

// Handle day click
const handleDayClick = (dateInfo: any) => {
  // Navigate to the correct month if clicking on other month days
  if (!dateInfo.isCurrentMonth) {
    // Update current month/year to match the clicked date
    currentMonth.value = dateInfo.date.getMonth()
    currentYear.value = dateInfo.date.getFullYear()
  }

  // Create the date for the clicked day in the current month/year context
  const clickedDate = new Date(currentYear.value, currentMonth.value, dateInfo.day)

  // Check if this day has payments using the comprehensive getPaymentsForDay function
  const dayPaymentsList = getPaymentsForDay(dateInfo.day)
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

// Get all payments for a specific day, considering all frequency types
const getPaymentsForDay = (day: number) => {
  const checkDate = new Date(currentYear.value, currentMonth.value, day)
  checkDate.setHours(0, 0, 0, 0)
  
  return payments.value.filter(payment => {
    // Check for regular payments (day-based) - recurring and one-time with day property
    if (payment.day === day) {
      return true
    }
    
    // Check for weekly payments (7-day interval)
    if (payment.frequency === 'weekly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
      const dayOfWeek = checkDate.getDay()
      
      if (payment.dayOfWeek !== dayOfWeek) {
        return false
      }
      
      const refDate = new Date(payment.referenceDate)
      refDate.setHours(0, 0, 0, 0)
      
      const diffTime = checkDate.getTime() - refDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      // Check if this date is on a 1-week interval (7 days)
      return diffDays >= 0 && diffDays % 7 === 0
    }
    
    // Check for bi-monthly payments (14-day interval)
    if (payment.frequency === 'bi-monthly' && payment.dayOfWeek !== undefined && payment.referenceDate) {
      const dayOfWeek = checkDate.getDay()
      
      if (payment.dayOfWeek !== dayOfWeek) {
        return false
      }
      
      const refDate = new Date(payment.referenceDate)
      refDate.setHours(0, 0, 0, 0)
      
      const diffTime = checkDate.getTime() - refDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      // Check if this date is on a 2-week interval (14 days)
      return diffDays >= 0 && diffDays % 14 === 0
    }
    
    // Check for one-time payments by date
    if (payment.frequency === 'one-time') {
      const dateInfo = parsePaymentDate(payment.date)
      if (dateInfo) {
        const { month: paymentMonth, day: paymentDay, year: paymentYear } = dateInfo
        return (
          paymentDay === day &&
          paymentMonth === currentMonth.value &&
          paymentYear === currentYear.value
        )
      }
    }
    
    return false
  })
}

// Show day payments in unified modal
const showDayPaymentsForDay = async (day: number) => {
  try {
    // Use the comprehensive getPaymentsForDay function instead of IndexedDB query
    const dayPaymentList = getPaymentsForDay(day)
    selectedDayPayments.value = dayPaymentList
    showAddMenu.value = true // Open the unified modal
  } catch (error) {
    console.error('Error loading day payments:', error)
    selectedDayPayments.value = []
    showAddMenu.value = true
  }
}

// Reset day payments when closing modal
const resetDayPayments = () => {
  selectedDayPayments.value = []
}

// Get selected day date for display
const getSelectedDayDate = () => {
  // Use selectedDate if available, otherwise fall back to addForm.day
  if (selectedDate.value) {
    const monthName = monthNames[selectedDate.value.getMonth()]
    const day = selectedDate.value.getDate()
    const daySuffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'
    return `${monthName} ${day}${daySuffix}`
  } else if (addForm.day) {
    const monthName = monthNames[currentMonth.value]
    const daySuffix = addForm.day === 1 ? 'st' : addForm.day === 2 ? 'nd' : addForm.day === 3 ? 'rd' : 'th'
    return `${monthName} ${addForm.day}${daySuffix}`
  }
  return 'Selected Day'
}

// Save new payment
const saveNewPayment = async () => {
  if (!addForm.title || !addForm.amount) {
    return // Don't save if required fields are empty
  }

  try {
    // Generate a sequential ID for the new payment
    const sequentialId = await paymentDB.getNextPaymentId()
    const newId = sequentialId.toString()

    // Create dynamic date based on current month/year and selected day
    const paymentDate = new Date(currentYear.value, currentMonth.value, addForm.day)
    const monthName = monthNames[paymentDate.getMonth()]
    const daySuffix = addForm.day === 1 ? 'st' : addForm.day === 2 ? 'nd' : addForm.day === 3 ? 'rd' : 'th'
    const dynamicDate = `${monthName} ${addForm.day}${daySuffix}, ${paymentDate.getFullYear()}`

    // Create new payment object
    const newPayment: Payment = {
      id: newId,
      title: addForm.title,
      amount: `$${addForm.amount}`,
      date: dynamicDate,
      type: addForm.type,
      day: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? undefined : addForm.day, // Don't set day for weekly/bi-monthly
      dayOfWeek: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? paymentDate.getDay() : undefined, // Set day of week for weekly/bi-monthly
      referenceDate: (addForm.frequency === 'bi-monthly' || addForm.frequency === 'weekly') ? paymentDate.getTime() : undefined, // Store reference timestamp for weekly/bi-monthly
      frequency: addForm.frequency
    }

    // Save to IndexedDB
    await paymentDB.addPayment(newPayment)

    // Add to local payments array
    payments.value.push(newPayment)

    // Close modal and reset form
    closeAddMenu()
    selectedDate.value = null
  } catch (error) {
    console.error('Error saving new payment:', error)
  }
}

// Add new payment function (legacy)
const addPayment = () => {
  console.log('Add new payment');
}

// Highlight payment day with pulsating animation
const highlightPaymentDay = (payment: Payment) => {
  // Try to get the day from the payment object
  let targetDay = payment.day

  // If no day is set, try to parse it from the date string
  if (!targetDay) {
    const dateInfo = parsePaymentDate(payment.date)
    if (dateInfo && dateInfo.day) {
      targetDay = dateInfo.day
    }
  }

  // If we still don't have a day, try to calculate it for recurring payments
  if (!targetDay && payment.referenceDate) {
    const refDate = new Date(payment.referenceDate)
    targetDay = refDate.getDate()
  }

  // If we have a valid day, trigger the animation
  if (targetDay && targetDay > 0 && targetDay <= 31) {
    // Clear any existing timer to prevent interruptions
    if (pulsatingTimer.value) {
      clearTimeout(pulsatingTimer.value)
      pulsatingTimer.value = null
    }

    // Set the new pulsating day
    pulsatingDay.value = targetDay

    // Stop the animation after 3 seconds
    pulsatingTimer.value = setTimeout(() => {
      pulsatingDay.value = null
      pulsatingTimer.value = null
    }, 3000)
  }
}

// Modal stack for escape key handling
const modalStack = ref<string[]>([])

// Track modal opening/closing for escape key functionality
const openModal = (modalName: string) => {
  modalStack.value.push(modalName)
}

const closeModal = (modalName: string) => {
  const index = modalStack.value.indexOf(modalName)
  if (index !== -1) {
    modalStack.value.splice(index, 1)
  }
}

// Handle escape key to close modals one by one
const handleEscapeKey = (event: KeyboardEvent) => {
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



// Load payments from IndexedDB on component mount
const loadPayments = async () => {
  try {
    const storedPayments = await paymentDB.getAllPayments()
    payments.value = storedPayments
  } catch (error) {
    console.error('Error loading payments:', error)
    payments.value = []
  }
}

// Add escape key listener on mount
onMounted(async () => {
  await loadPaymentTypes()
  await loadPayments()
  document.addEventListener('keydown', handleEscapeKey)
})

// Remove escape key listener on unmount
const cleanup = () => {
  document.removeEventListener('keydown', handleEscapeKey)
}
</script>
