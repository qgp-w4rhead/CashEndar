<template>
  <div class="calendar-container">
    <CalendarHeader
      :view-mode="calendarViewMode"
      :title="currentMonthYear"
      @prev="handlePrev"
      @next="handleNext"
      @toggle-view="toggleCalendarView"
      @toggle-pie-chart="togglePieChart"
      @toggle-item-chart="toggleItemChart"
    />

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
          :key="`month-${dateInfo.date.getFullYear()}-${dateInfo.date.getMonth()}-${dateInfo.day}`"
          :class="{
            'date-cell': true,
            'other-month': !dateInfo.isCurrentMonth,
            'has-payment': dateInfo.hasPayment,
            'today': isToday(dateInfo.date),
            'selected': isSameDate(selectedDate, dateInfo.date),
            'pulsating': pulsatingDays.has(dateInfo.day) && dateInfo.isCurrentMonth,
            'pre-selected': preSelectedDay === dateInfo.day && dateInfo.isCurrentMonth,
            [getPaymentTypeClassForDay(dateInfo.day, dateInfo.date)]: dateInfo.hasPayment && getPaymentTypeClassForDay(dateInfo.day, dateInfo.date)
          }"
          :style="getDayStyle(dateInfo.day, dateInfo.date)"
          :data-payment-type="getPaymentTypeClassForDay(dateInfo.day, dateInfo.date) || undefined"
          @click="handleDayClick(dateInfo)"
        >
          <div v-if="dateInfo.totalAmount !== 0" class="day-total" :class="{ 'day-total-positive': dateInfo.totalAmount > 0, 'day-total-negative': dateInfo.totalAmount < 0 }">
            {{ dateInfo.totalAmount > 0 ? '+' : '-' }}${{ Math.abs(dateInfo.totalAmount).toFixed(2) }}
          </div>
          {{ dateInfo.day }}
          <div v-if="dateInfo.paymentCount > 0" class="payment-dots">
            <span
              v-for="n in Math.min(dateInfo.paymentCount, 5)"
              :key="n"
              class="payment-dot"
              :style="{ backgroundColor: getPaymentTypeClassForDay(dateInfo.day) ? 'var(--payment-color, oklch(from var(--lime-primary) l c h / 1))' : 'oklch(from var(--lime-primary) l c h / 1)' }"
            ></span>
            <span v-if="dateInfo.paymentCount > 5" class="payment-dot-plus">+</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CalendarHeader from './CalendarHeader.vue'
import { ViewMode } from '../../types/payment.types'
import { isToday, isSameDate } from '../../utils/date-utils'
import {
  selectedDate,
  isTransitioning,
  pulsatingDays,
  preSelectedDay,
  calendarViewMode
} from '../../stores/ui-state.store'
import {
  currentMonthYear,
  calendarDates,
  getPaymentTypeClassForDay,
  getDayStyle
} from '../../composables/payment-computables'
import {
  goToPrevMonth,
  goToNextMonth,
  togglePieChart,
  toggleItemChart,
  handleDayClick
} from '../../composables/payment-handlers'

const toggleCalendarView = () => {
  calendarViewMode.value = calendarViewMode.value === ViewMode.MONTH ? ViewMode.WEEK : ViewMode.MONTH
}

const handlePrev = () => goToPrevMonth()
const handleNext = () => goToNextMonth()
</script>

<style scoped>
/* Right Side - Calendar */
.calendar-container {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}


.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.day-header {
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-weight: 600;
  font-size: var(--font-small);
  padding: 12px;
}

.calendar-dates {
  font-size: var(--font-x-big);
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  flex: 1;
  transition: opacity 0.15s ease-in-out;
  opacity: 1;
}


.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: oklch(from var(--lime-light) l c h / 0.1) !important;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  padding: 8px 4px;
  
  &:hover {
    background: oklch(from var(--lime-light) l c h / 0.2) !important;
  }
}

/* Day total amount displayed above day number */
.day-total {
  color: #d1d5db;
  font-size: var(--font-small);
  font-weight: 600;
  margin-bottom: 0px;
  text-align: center;
  line-height: 1;
}

.day-total-positive {
  color: oklch(from var(--lime-light) l c h / 1) !important;
}

.day-total-negative {
  color: #ff7575 !important;
}

.date-cell.has-payment {
  background: oklch(from var(--lime-primary) l c h / 0.2);
  border-color: oklch(from var(--lime-primary) l c h / 1);
  color: oklch(from var(--lime-primary) l c h / 1);

  &:hover {
    background: oklch(from var(--lime-primary) l c h / 0.3) !important;
  }
}

/* Payment dots container */
.payment-dots {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  align-items: center;
}

/* Individual payment dots */
.payment-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Plus indicator for more than 5 payments */
.payment-dot-plus {
  font-size: var(--font-x-small);
  font-weight: bold;
  color: oklch(from var(--lime-primary) l c h / 1);
  line-height: 1;
  margin-left: 1px;
}

/* Dynamic payment type colors for calendar days */
.date-cell.rent {
  background-color: rgba(239, 68, 68, 0.05) !important;
  border-color: #ef4444 !important;
  border-width: 2px !important;
  color: rgba(255, 255, 255, 0.8) !important;
}



.date-cell.utility {
  background-color: rgba(245, 158, 11, 0.05) !important;
  border-color: #f59e0b !important;
  border-width: 2px !important;
  color: rgba(255, 255, 255, 0.8) !important;
}



.date-cell.credit {
  background-color: rgba(6, 182, 212, 0.05) !important;
  border-color: #06b6d4 !important;
  border-width: 2px !important;
  color: rgba(255, 255, 255, 0.8) !important;
}



.date-cell.subscription {
  background-color: oklch(from var(--lime-primary) l c h / 0.05) !important;
  border-color: oklch(from var(--lime-primary) l c h / 1) !important;
  border-width: 2px !important;
  color: rgba(255, 255, 255, 0.8) !important;
}



.date-cell.earnings {
  background-color: oklch(from var(--lime-primary) l c h / 0.05) !important;
  border-color: oklch(from var(--lime-primary) l c h / 1) !important;
  border-width: 2px !important;
  color: rgba(255, 255, 255, 0.8) !important;
}



/* Support for custom payment types with dynamic colors */
.date-cell[data-payment-type] {
  background-color: rgba(255, 255, 255, 0.02) !important;
  border-color: var(--payment-color, oklch(from var(--lime-primary) l c h / 1)) !important;
  border-width: 2px !important;
  color: rgba(255, 255, 255, 0.8) !important;
}



.date-cell.other-month {
  color: rgba(255, 255, 255, 0.3);
  cursor: default;
}

.date-cell.other-month:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* */

.date-cell.today {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h), oklch(from var(--lime-dark) l c h));
  border-color: oklch(from var(--lime-primary) l c h);
  color: white;
}

.date-cell.selected {
  border: 2px solid oklch(from var(--lime-light) l c h / 1);
  color: white;
}

.date-cell.pulsating {
  animation: pulse 2s ease-in-out infinite;
  background: linear-gradient(135deg, oklch(from var(--lime-dark) l c h), oklch(from var(--lime-dark) l c h / 0.7));
  border-color: oklch(from var(--lime-dark) l c h);
  color: white;
}

.date-cell.pre-selected {
  background: linear-gradient(135deg, oklch(from var(--grey-primary) l c h), oklch(from var(--grey-dark) l c h));
  border-color: oklch(from var(--lime-light) l c h);
  color: white;
  transform: scale(1.04);
}

.date-cell.pre-selected:hover {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h), oklch(from var(--grey-dark) l c h));

}

/* */

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
