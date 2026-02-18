<template>
  <div class="filter-btn-container">
    <button class="filter-btn" title="Filter payments">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
      </svg>
    </button>
    <div class="filter-dropdown">
      <div class="filter-section">
        <div class="filter-section-header">
          <h5 class="filter-section-title">Show</h5>
          <button
            class="filter-toggle-btn"
            :class="{ 'filter-on': isFilteringEnabled, 'filter-off': !isFilteringEnabled }"
            @click="isFilteringEnabled = !isFilteringEnabled"
            :title="isFilteringEnabled ? 'Disable filtering' : 'Enable filtering'"
          ></button>
        </div>
        <div class="toggle-switch">
          <div class="toggle-container two-options">
            <button
              :class="['toggle-option', { active: !showEarningsInNextPayments }]"
              @click="switchToPayments"
            >
              Payments
            </button>
            <button
              :class="['toggle-option', { active: showEarningsInNextPayments }]"
              @click="switchToEarnings"
            >
              Earnings
            </button>
          </div>
        </div>
      </div>

      <div class="filter-section">
        <h5 class="filter-section-title">Payment Types</h5>
        <div class="checkbox-list">
          <label v-for="type in availablePaymentTypes" :key="type.value" class="checkbox-item">
            <input
              type="checkbox"
              :value="type.value"
              v-model="selectedPaymentTypes"
              class="checkbox-input"
            >
            <span class="checkbox-label">{{ type.label }}</span>
          </label>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  isFilteringEnabled,
  showEarningsInNextPayments,
  selectedPaymentTypes,
  paymentTypes
} from '../../stores/ui-state.store'

// Computed property for available payment types based on current filter mode
const availablePaymentTypes = computed(() => {
  if (showEarningsInNextPayments.value) {
    // Show earning types
    return paymentTypes.value.filter(type => type.isEarning)
  } else {
    // Show payment/expense types
    return paymentTypes.value.filter(type => !type.isEarning)
  }
})

const switchToPayments = () => {
  showEarningsInNextPayments.value = false
  selectedPaymentTypes.value = []
}

const switchToEarnings = () => {
  showEarningsInNextPayments.value = true
  selectedPaymentTypes.value = []
}
</script>

<style scoped>
.filter-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.filter-btn-container {
  position: relative;
}

.filter-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  min-width: 220px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  z-index: 1000;
  padding: 0px 16px 16px 16px;
  margin: 8px;
}

.filter-btn-container:hover .filter-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.filter-toggle-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  justify-content: flex-end;
}

.filter-toggle-btn:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.filter-toggle-btn.filter-on {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.3);
}

.filter-toggle-btn.filter-off {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
}

/* Filter Dropdown Sections */
.filter-section {
  margin-bottom: 16px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

/* Filter Section Header */
.filter-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-section-title {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

/* Checkbox List */
.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.checkbox-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.checkbox-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

/* Filter Actions */
.filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
