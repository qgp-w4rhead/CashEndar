<template>
  <div class="payment-calendar">
    <PaymentSidebar />

    <div class="calendar-main">
      <Calendar v-if="calendarViewMode === ViewMode.MONTH" />
      <WeekView v-else-if="calendarViewMode === ViewMode.WEEK" />
      <DashboardView v-else />
    </div>

    <div v-if="showEditMenu" class="modal-overlay edit-modal-overlay">
      <CustomModal mode="edit" />
    </div>

    <div v-if="showAddMenu" class="modal-overlay">
      <CustomModal mode="add" />
    </div>

    <div v-if="showPaymentTypeModal" class="modal-overlay payment-type-modal-overlay">
      <PaymentTypeModal />
    </div>

    <div v-if="showPieChartModal" class="modal-overlay">
      <PieChartModal />
    </div>

    <ItemChart />

    <ComparisonView />

    <StatManagerModal />

    <ScanBillModal />

    <div v-if="showGearMenu" class="modal-overlay">
      <SettingsModal />
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
import { onMounted } from 'vue'
import './PaymentCalendar.css'

import { ViewMode } from '../types/payment.types'

import DatePicker from './primitives/DatePicker.vue'
import PaymentSidebar from './sidebar/PaymentSidebar.vue'
import Calendar from './calendar/Calendar.vue'
import WeekView from './calendar/WeekView.vue'
import DashboardView from './dashboard/DashboardView.vue'
import ItemChart from './modals/itemChart.vue'
import ComparisonView from './modals/ComparisonView.vue'
import StatManagerModal from './modals/StatManagerModal.vue'
import ScanBillModal from './modals/ScanBillModal.vue'
import CustomModal from './modals/CustomModal.vue'
import PaymentTypeModal from './modals/PaymentTypeModal.vue'
import PieChartModal from './modals/PieChartModal.vue'
import SettingsModal from './modals/SettingsModal.vue'

import {
  showEditMenu,
  showAddMenu,
  showPaymentTypeModal,
  showGearMenu,
  showPieChartModal,
  selectedDate,
  calendarViewMode
} from '../stores/ui-state.store'

import {
  handleEscapeKey,
  initializeComponent,
  closeDatePicker,
  handleDateSelection,
  showDatePicker,
} from '../composables/payment-handlers'

// Initialize component on mount
onMounted(async () => {
  await initializeComponent()
})

document.addEventListener('keydown', handleEscapeKey)
</script>
