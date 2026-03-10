<template>
  <CustomScrollbar class="gear-modal" max-height="90vh" @click.stop>
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
          <button class="settings-btn" @click="$emit('open-tweaks')">
            Tweaks
          </button>
          <button class="settings-btn" @click="$emit('open-advanced')">
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
  </CustomScrollbar>
</template>

<script setup lang="ts">
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import {
  closeGearMenu,
  exportPayments,
  importPayments,
  resetCalendarView,
  clearAllPayments,
  handleManagePaymentTypes
} from '../../composables/payment-handlers'

defineEmits<{
  'open-tweaks': []
  'open-advanced': []
}>()
</script>
