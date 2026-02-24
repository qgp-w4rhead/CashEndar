<template>
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
        <Sort />
        <Filter />
        <button class="add-btn" @click="openAddMenu">+</button>
      </div>
    </div>

    <div v-for="payment in sortedPayments" :key="payment.id" class="payment-item" @click="highlightPaymentDay(payment)">
      <div class="payment-avatar">
        <div :class="`avatar-circle ${payment.type}`" :style="getAvatarStyle(payment.type)">{{ payment.type.charAt(0).toUpperCase() }}</div>
      </div>
      <div class="payment-details">
        <div class="payment-title">{{ payment.title }}</div>
        <div class="payment-date">{{ payment.date }}</div>
        <div :class="['payment-amount', getPaymentTypeClass(payment.type)]">{{ payment.amount }}</div>
      </div>
      <div class="payment-menu">
        <button class="menu-btn" @click.stop="openEditMenu(payment)">⋯</button>
      </div>
    </div>

    <div class="sidebar-divider"></div>

    <div class="summary-section">
      <div
        :class="['summary-header', { collapsed: isNextPaymentsCollapsed }]"
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

    <div class="summary-section">
      <div
        :class="['summary-header', { collapsed: isEarningsCollapsed }]"
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

    <Remaining />

    <Inventory />

    <TotalSection />
  </div>
</template>

<script setup lang="ts">
import Sort from './Sort.vue'
import Filter from './Filter.vue'
import Remaining from './Remaining.vue'
import Inventory from './Inventory.vue'
import TotalSection from './TotalSection.vue'

import { paymentTypes } from '../../stores/ui-state.store'
import {
  isNextPaymentsCollapsed,
  isEarningsCollapsed
} from '../../stores/ui-state.store'

import {
  sortedPayments,
  nextPayments,
  nextPaymentsTotal,
  nextPaymentsPeriod,
  nextEarnings,
  earningsTotal,
  earningsPeriod,
  getPaymentTypeClass
} from '../../composables/payment-computables'

import {
  openGearMenu,
  openAddMenu,
  openEditMenu,
  highlightPaymentDay,
  toggleNextPaymentsSection,
  toggleEarningsSection
} from '../../composables/payment-handlers'

const getAvatarStyle = (paymentTypeValue: string) => {
  const paymentType = paymentTypes.value.find(type => type.value === paymentTypeValue)
  if (paymentType && paymentType.isCustom) {
    return { background: `linear-gradient(135deg, ${paymentType.color}, ${paymentType.color}dd)` }
  }
  return {}
}
</script>

<style scoped>
.payments-sidebar {
  min-width: 500px;
  width: auto;
  padding: 32px;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sidebar-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
  margin: 24px 0;
}

/* Upcoming Payments Summary */
.next-payments-title {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.next-payments-total {
  color: #ff7575;
  font-size: 20px;
  font-weight: 700;
}

.next-payments-content {
  max-height: 320px;
  opacity: 1;
  transition: all 0.3s ease;
  overflow: auto;
}

.summary-header.collapsed + .next-payments-content {
  max-height: 0;
  opacity: 0;
}

.next-payments-body {
  padding: 0px 24px 24px 24px;
}

.next-payments-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.next-payments-period {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.next-payments-list {
  margin-top: 16px;
}

.next-payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
}

.next-payment-item:last-child {
  border-bottom: none;
}

.payment-id {
  color: #999999;
  font-size: 12px;
  font-weight: 400;
  margin-right: 8px;
  font-family: monospace;
}

.next-payment-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.next-payment-amount {
  color: #ff7575;
  font-size: 14px;
  font-weight: 600;
}

.next-payments-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  padding: 20px 0;
  font-style: italic;
}

/* Upcoming Earnings Summary */
.earnings-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.earnings-total {
  color: oklch(from var(--lime-light) l c h / 1);
  font-size: 20px;
  font-weight: 700;
}

.earnings-content {
  max-height: 320px;
  opacity: 1;
  transition: all 0.3s ease;
  overflow: auto;
}

.summary-header.collapsed + .earnings-content {
  max-height: 0;
  opacity: 0;
}

.earnings-body {
  padding: 0 24px 24px 24px;
}

.earnings-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid oklch(from var(--lime-primary) l c h / 0.2);
}

.earnings-period {
  color: #ffffff;
  font-size: 14px;
}

.earnings-list {
  margin-top: 16px;
}

.earning-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid oklch(from var(--lime-primary) l c h / 0.1);
  cursor: pointer;
}

.earning-item:last-child {
  border-bottom: none;
}

.earning-id {
  color: #999999;
  font-size: 12px;
  font-weight: 400;
  margin-right: 8px;
  font-family: monospace;
}

.earning-name {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.earning-amount {
  color: oklch(from var(--lime-light) l c h / 1);
  font-size: 14px;
  font-weight: 600;
}

.earnings-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  padding: 20px 0;
  font-style: italic;
}

@media (max-width: 768px) {
  .payments-sidebar {
    width: 100vw;
    height: auto;
    max-height: 50vh;
    padding: 16px;
    box-sizing: border-box;
  }
}
</style>
