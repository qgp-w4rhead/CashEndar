<template>
  <div class="payments-sidebar" :style="{ width: sidebarWidth + 'px' }">
    <CustomScrollbar ref="sidebarScrollRef" class="sidebar-scroll-area">
      <div ref="sidebarHeaderRef" class="sidebar-header">
        <SectionHeader 
          title="Next payments" 
          @gear-click="openGearMenu" 
          @add-click="openAddMenu"
        >
          <template #buttons>
            <Sort />
            <Filter />
          </template>
        </SectionHeader>
        <div class="sidebar-divider"></div>
      </div>
      
      <div class="sidebar-content">
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
      <div class="summary-container">
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
          <CustomScrollbar class="next-payments-content" max-height="320px" variant="thin">
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
          </CustomScrollbar>
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
          <CustomScrollbar class="earnings-content" max-height="320px" variant="thin">
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
          </CustomScrollbar>
        </div>

        <Inventory />
        <Remaining />
        <TotalSection />
      </div>
      </div>
    </CustomScrollbar>
    
    <!-- Resize Handle -->
    <div 
      ref="resizeHandleRef"
      class="resize-handle" 
      @mousedown="startResize"
      :class="{ 'resizing': isResizing }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Sort from './Sort.vue'
import Filter from './Filter.vue'
import Remaining from './Remaining.vue'
import Inventory from './Inventory.vue'
import TotalSection from './TotalSection.vue'
import SectionHeader from '../primitives/SectionHeader.vue'
import CustomScrollbar from '../primitives/CustomScrollbar.vue'

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

// Resizable sidebar functionality
const sidebarWidth = ref(500)
const isResizing = ref(false)
const startX = ref(0)
const startWidth = ref(0)

// Refs for height synchronization
const sidebarScrollRef = ref<InstanceType<typeof CustomScrollbar>>()
const sidebarHeaderRef = ref<HTMLElement>()
const resizeHandleRef = ref<HTMLElement>()

const sidebarRef = computed(() => sidebarScrollRef.value?.scrollRef)
let resizeObserver: ResizeObserver

// Handle scroll to change header background
const handleScroll = () => {
  if (sidebarRef.value && sidebarHeaderRef.value) {
    if (sidebarRef.value.scrollTop > 0) {
      sidebarHeaderRef.value.classList.add('scrolled')
    } else {
      sidebarHeaderRef.value.classList.remove('scrolled')
    }
  }
}

// Load saved width from localStorage
onMounted(() => {
  const savedWidth = localStorage.getItem('sidebar-width')
  if (savedWidth) {
    sidebarWidth.value = parseInt(savedWidth, 10)
  }
  
  // Add global mouse event listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  
  // Setup ResizeObserver to sync handle height with sidebar visible height
  if (sidebarRef.value && resizeHandleRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateHandleHeight()
    })
    resizeObserver.observe(sidebarRef.value)
    updateHandleHeight()
  }
  
  // Add scroll event listener
  if (sidebarRef.value) {
    sidebarRef.value.addEventListener('scroll', handleScroll)
  }
})

// Clean up event listeners
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  
  // Remove scroll event listener
  if (sidebarRef.value) {
    sidebarRef.value.removeEventListener('scroll', handleScroll)
  }
})

// Update resize handle height to match sidebar visible height
const updateHandleHeight = () => {
  if (sidebarRef.value && resizeHandleRef.value) {
    const sidebarHeight = sidebarRef.value.clientHeight
    resizeHandleRef.value.style.height = sidebarHeight + 'px'
  }
}

const startResize = (e: MouseEvent) => {
  isResizing.value = true
  startX.value = e.clientX
  startWidth.value = sidebarWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return
  
  const deltaX = e.clientX - startX.value
  const newWidth = startWidth.value + deltaX
  
  // Set minimum and maximum bounds
  if (newWidth >= 400 && newWidth <= 800) {
    sidebarWidth.value = newWidth
  }
}

const handleMouseUp = () => {
  if (isResizing.value) {
    isResizing.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    // Save width to localStorage
    localStorage.setItem('sidebar-width', sidebarWidth.value.toString())
  }
}

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
  min-width: 400px;
  max-width: 800px;
  width: 500px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
}

.sidebar-scroll-area {
  flex: 1;
  min-height: 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  background: transparent;
  cursor: col-resize;
  transition: background-color 0.2s ease;
  z-index: 10;
}

.resize-handle:hover {
  background-color: oklch(from var(--lime-primary) l c h / 0.5);
}

.resize-handle.resizing {
  background-color: oklch(from var(--lime-primary) l c h / 0.8);
}

.sidebar-header {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: linear-gradient(180deg, oklch(from var(--lime-dark) l c h / 1), oklch(from var(--lime-dark) l c h / 0));
  padding: 32px 32px 0px 32px;
  transition: background 0.3s ease;
}

.sidebar-header.scrolled {
  background: var(--lime-dark);
}

.sidebar-header.scrolled .sidebar-divider {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sidebar-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 32px;
}

.summary-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.summary-container .summary-section {
  margin-top: 0;
}

.summary-container .total-remaining-section {
  margin-top: 0;
}

.summary-container .inventory-section {
  margin-top: 0;
}

.summary-container .total-section {
  margin-top: 0;
}

/* First child - rounded top */
.summary-container > :first-child {
  border-radius: 12px 12px 0 0 !important;
  border-bottom: none !important;
}

/* Last child - rounded bottom */
.summary-container > :last-child {
  border-radius: 0 0 12px 12px !important;
  border-top: none !important;
}

/* Only child - fully rounded */
.summary-container > :only-child {
  border-radius: 12px !important;
}

/* Middle children - no borders on top/bottom for seamless flow */
.summary-container > :not(:first-child):not(:last-child) {
  border-radius: 0 !important;
  border-top: none !important;
  border-bottom: none !important;
}

/* Ensure all sections have consistent borders */
.summary-container > * {
  border-left: 1px solid oklch(from var(--lime-primary) l c h / 0.3) !important;
  border-right: 1px solid oklch(from var(--lime-primary) l c h / 0.3) !important;
}

.sidebar-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
  position: relative;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.sidebar-divider::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, oklch(from var(--lime-primary) l c h / 0.3) 50%, transparent 100%);
  border-radius: 2px;
}

/* Upcoming Payments Summary */
.next-payments-title {
  color: white;
  font-size: var(--font-medium);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.next-payments-total {
  color: #ff7575;
  font-size: var(--font-v-big);
  font-weight: 700;
}

.next-payments-content {
  opacity: 1;
  transition: all 0.3s ease;
}

.summary-header.collapsed + .next-payments-content {
  max-height: 0 !important;
  opacity: 0;
  height: 0 !important;
}

.summary-header.collapsed + .next-payments-content .custom-scrollbar {
  height: 0 !important;
}

.summary-header.collapsed + .next-payments-content .scroll-content {
  height: 0 !important;
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
  font-size: var(--font-small);
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
  font-size: var(--font-x-small);
  font-weight: 400;
  margin-right: 8px;
  font-family: monospace;
}

.next-payment-name {
  color: white;
  font-size: var(--font-small);
  font-weight: 500;
}

.next-payment-amount {
  color: #ff7575;
  font-size: var(--font-small);
  font-weight: 600;
}

.next-payments-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--font-small);
  padding: 20px 0;
  font-style: italic;
}

/* Upcoming Earnings Summary */
.earnings-title {
  color: #ffffff;
  font-size: var(--font-medium);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.earnings-total {
  color: var(--lime-light);
  font-size: var(--font-v-big);
  font-weight: 700;
}

.earnings-content {
  opacity: 1;
  transition: all 0.3s ease;
}

.summary-header.collapsed + .earnings-content {
  max-height: 0 !important;
  opacity: 0;
  height: 0 !important;
}

.summary-header.collapsed + .earnings-content .custom-scrollbar {
  height: 0 !important;
}

.summary-header.collapsed + .earnings-content .scroll-content {
  height: 0 !important;
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
  font-size: var(--font-small);
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
  font-size: var(--font-x-small);
  font-weight: 400;
  margin-right: 8px;
  font-family: monospace;
}

.earning-name {
  color: white;
  font-size: var(--font-small);
  font-weight: 500;
}

.earning-amount {
  color: var(--lime-light);
  font-size: var(--font-small);
  font-weight: 600;
}

.earnings-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--font-small);
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
  
  .resize-handle {
    display: none;
  }
}
</style>
