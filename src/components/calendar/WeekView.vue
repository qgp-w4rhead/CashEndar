<template>
  <div class="calendar-container">
    <CalendarHeader
      :view-mode="calendarViewMode"
      :title="weekRange"
      :on-prev="handlePrev"
      :on-next="handleNext"
      :on-toggle-view="toggleCalendarView"
      :on-toggle-pie-chart="togglePieChart"
      :on-toggle-item-chart="toggleItemChart"
    />
    <div class="week-view-grid">
      <div class="week-dates" :style="{ opacity: isTransitioning ? 0 : 1 }">
      <div
        v-for="dateInfo in weekViewDates"
        :key="`week-${dateInfo.date.getFullYear()}-${dateInfo.date.getMonth()}-${dateInfo.day}`"
        :class="{
          'week-date-cell': true,
          'has-payment': dateInfo.hasPayment,
          'today': isToday(dateInfo.date),
          'selected': selectedDate && selectedDate.getDate() === dateInfo.day &&
                     selectedDate.getMonth() === dateInfo.date.getMonth() &&
                     selectedDate.getFullYear() === dateInfo.date.getFullYear(),
          'pulsating': pulsatingDays.has(dateInfo.day) && dateInfo.isCurrentMonth,
          'pre-selected': preSelectedDay === dateInfo.day && dateInfo.isCurrentMonth,
          [getPaymentTypeClassForDay(dateInfo.day, dateInfo.date)]: dateInfo.hasPayment && getPaymentTypeClassForDay(dateInfo.day, dateInfo.date)
        }"
        :style="getDayStyle(dateInfo.day, dateInfo.date)"
        :data-payment-type="getPaymentTypeClassForDay(dateInfo.day, dateInfo.date) || undefined"
        @click="handleDayClick(dateInfo)"
      >
        <div class="week-date-header">
          <div class="week-date-position" :class="{ 'selected': selectedDate && selectedDate.getDate() === dateInfo.day &&
                     selectedDate.getMonth() === dateInfo.date.getMonth() &&
                     selectedDate.getFullYear() === dateInfo.date.getFullYear() }">
            <div class="week-date-day">{{ dateInfo.day }}</div>
            <div class="week-date-day-name">{{ getDayName(dateInfo.date) }}</div>
          </div>
          <div v-if="dateInfo.totalAmount !== 0" class="week-date-total" :class="{ 'week-date-total-positive': dateInfo.totalAmount > 0, 'week-date-total-negative': dateInfo.totalAmount < 0 }">
            TOTAL : {{ dateInfo.totalAmount > 0 ? '+' : '-' }}${{ Math.abs(dateInfo.totalAmount).toFixed(2) }}
          </div>
        </div>
        <div v-if="dateInfo.detailedPayments && dateInfo.detailedPayments.length > 0" class="week-payments-list">
          <div
            v-for="payment in dateInfo.detailedPayments"
            :key="payment.id"
            class="week-payment-item"
            :class="{ 'week-payment-earning': payment.isEarning }"
          >
            <div class="week-payment-type" :style="{ backgroundColor: payment.paymentTypeColor }">
              {{ payment.paymentTypeLabel.charAt(0).toUpperCase() }}
            </div>
            <div class="week-payment-details">
              <div class="week-payment-title">{{ payment.paymentTypeLabel }}</div>
              <div class="week-payment-amount" :class="{ 'week-payment-amount-positive': payment.isEarning }">
                {{ payment.isEarning ? '+' : '-' }}${{ Math.abs(parseAmount(payment.amount || '0')).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="week-empty-message">
          Empty
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import CalendarHeader from './CalendarHeader.vue'
import {
  selectedDate,
  isTransitioning,
  pulsatingDays,
  preSelectedDay,
  calendarViewMode
} from '../../stores/ui-state.store'
import {
  weekViewDates,
  weekRange,
  getPaymentTypeClassForDay,
  getDayStyle
} from '../../composables/payment-computables'
import {
  goToPrevWeek,
  goToNextWeek,
  togglePieChart,
  toggleItemChart,
  handleDayClick
} from '../../composables/payment-handlers'
import { parseAmount } from '../../utils/date-utils'

const toggleCalendarView = () => {
  calendarViewMode.value = calendarViewMode.value === 'month' ? 'week' : 'month'
}

const handlePrev = () => {
  goToPrevWeek()
}

const handleNext = () => {
  goToNextWeek()
}

// Helper function to check if a date is today
const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

// Helper function to get day name
const getDayName = (date: Date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}
</script>

<style scoped>
/* Calendar Container - matches Calendar.vue */
.calendar-container {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
}

/* Week View Styles */
.week-view-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.week-dates {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  transition: opacity 0.15s ease-in-out;
  opacity: 1;
}

.week-date-cell {
  background: oklch(from var(--lime-light) l c h / 0.1);
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  flex: 1;
  
  &:hover {
    background: oklch(from var(--lime-light) l c h / 0.2);
    transform: translateY(-2px);
  }
}

.week-date-cell.has-payment {
  background: oklch(from var(--lime-primary) l c h / 0.15);
  border-color: oklch(from var(--lime-primary) l c h / 0.8);

  &:hover {
    background: oklch(from var(--lime-primary) l c h / 0.25);
  }
}

.week-date-cell.today {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h), oklch(from var(--lime-dark) l c h));
  border-color: oklch(from var(--lime-primary) l c h);
  color: white;
}

.week-date-cell.selected {
  border: 2px solid oklch(from var(--lime-light) l c h / 1);
  color: white;
}

.week-date-cell.pulsating {
  animation: pulse 2s ease-in-out infinite;
  background: linear-gradient(135deg, oklch(from var(--lime-dark) l c h), oklch(from var(--lime-dark) l c h / 0.7));
  border-color: oklch(from var(--lime-dark) l c h);
  color: white;
}

.week-date-cell.pre-selected {
  background: linear-gradient(135deg, oklch(from var(--grey-primary) l c h), oklch(from var(--grey-dark) l c h));
  border-color: oklch(from var(--lime-light) l c h);
  color: white;
  transform: scale(1.02);
}

.week-date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
}

.week-date-position {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0rem 0.3rem;
  border-left: 0.2rem solid oklch(from var(--grey-light) l c h / 0.5);
  transition: all 0.25s linear;
  border-radius: 100vw;
}

.week-date-position.selected {
  border-left: 1rem solid oklch(from var(--lime-light) l c h / 1);
  border-radius: 100vw;
}


.week-date-day {
  font-size: var(--font-v-big);
  font-weight: 600;
  color: white;
}

.week-date-day-name {
  font-size: var(--font-medium);
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.week-date-total {
  font-size: var(--font-medium);
  font-weight: 600;
  color: #d1d5db;
  padding: 10px;
  background: oklch(from var(--grey-dark)l c h / 0.5);
  border-radius: 100vw;
}

.week-date-total-positive {
  color: oklch(from var(--lime-light) l c h / 1) !important;
}

.week-date-total-negative {
  color: #ff7575 !important;
}

.week-payments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.week-empty-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.4);
  font-size: var(--font-medium);
  font-weight: 500;
  font-style: italic;
}

.week-payment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.week-payment-earning {
  background: rgba(34, 197, 94, 0.1);
  
  &:hover {
    background: rgba(34, 197, 94, 0.15);
  }
}

.week-payment-type {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
  flex-shrink: 0;
}

.week-payment-details {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.week-payment-title {
  color: white;
  font-weight: 500;
  font-size: var(--font-medium);
}

.week-payment-amount {
  color: #ff7575;
  font-weight: 600;
  font-size: var(--font-medium);
}

.week-payment-amount-positive {
  color: oklch(from var(--lime-light) l c h / 1) !important;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 oklch(from var(--lime-primary) l c h / 1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 15px oklch(from var(--lime-primary) l c h / 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 oklch(from var(--lime-primary) l c h / 0);
  }
}
</style>
