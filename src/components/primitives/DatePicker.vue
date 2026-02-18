<template>
  <div v-if="isVisible" class="date-picker-overlay" @click="handleOverlayClick">
    <div class="date-picker-modal" @click.stop>
      <div class="date-picker-header">
        <h3 class="header-title">
          Select Date
        </h3>
        <button class="close-btn" @click="close">
          <span class="close-icon">✕</span>
        </button>
      </div>
      
      <div class="date-picker-content">
        <div class="month-year-selector">
          <button class="nav-btn" @click="previousMonth" aria-label="Previous month">
            <span class="nav-arrow">‹</span>
          </button>
          <div class="month-year-display">
            <div class="month-text">{{ currentMonthName }}</div>
            <div class="year-text">{{ currentYear }}</div>
          </div>
          <button class="nav-btn" @click="nextMonth" aria-label="Next month">
            <span class="nav-arrow">›</span>
          </button>
        </div>
        
        <div class="calendar-grid">
          <div class="day-headers">
            <div v-for="day in dayHeaders" :key="day" class="day-header">
              <span class="day-text">{{ day }}</span>
            </div>
          </div>
          <div class="date-grid">
            <div
              v-for="date in calendarDates"
              :key="date.key"
              :class="[
                'date-cell',
                {
                  'other-month': !date.isCurrentMonth,
                  'today': date.isToday,
                  'selected': date.isSelected,
                  'disabled': date.isDisabled
                }
              ]"
              @click="selectDate(date)"
            >
              <span class="date-number">{{ date.day }}</span>
              <div v-if="date.isToday" class="today-indicator"></div>
            </div>
          </div>
        </div>
        
        <div class="date-picker-footer">
          <button class="btn btn-secondary" @click="close">
            <span class="btn-text">Cancel</span>
          </button>
          <button class="btn btn-primary" @click="confirmSelection" :disabled="!selectedDate">
            <span class="btn-text">Select Date</span>
            <span class="btn-icon">✓</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  isVisible: boolean
  initialDate?: Date
  minDate?: Date
  maxDate?: Date
}>()

const emit = defineEmits<{
  close: []
  select: [date: Date]
}>()

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDate = ref<Date | null>(props.initialDate || null)

const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const currentMonthName = computed(() => monthNames[currentMonth.value])

const calendarDates = computed(() => {
  const dates = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  const today = new Date()
  
  for (let i = 0; i < 42; i++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + i)
    
    const isCurrentMonth = currentDate.getMonth() === currentMonth.value
    const isToday = currentDate.toDateString() === today.toDateString()
    const isSelected = selectedDate.value && currentDate.toDateString() === selectedDate.value.toDateString()
    const isDisabled = (props.minDate && currentDate < props.minDate) || 
                       (props.maxDate && currentDate > props.maxDate)
    
    dates.push({
      key: `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`,
      day: currentDate.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
      isDisabled,
      date: new Date(currentDate)
    })
  }
  
  return dates
})

const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const selectDate = (dateInfo: any) => {
  if (!dateInfo.isDisabled) {
    selectedDate.value = dateInfo.date
  }
}

const confirmSelection = () => {
  if (selectedDate.value) {
    emit('select', selectedDate.value)
    close()
  }
}

const close = () => {
  emit('close')
}

const handleOverlayClick = () => {
  close()
}

watch(() => props.isVisible, (newValue) => {
  if (newValue && props.initialDate) {
    selectedDate.value = new Date(props.initialDate)
    currentMonth.value = props.initialDate.getMonth()
    currentYear.value = props.initialDate.getFullYear()
  }
})
</script>

<style scoped>
.date-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.date-picker-modal {
  background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 420px;
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.date-picker-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(59, 130, 246, 0.5), 
    transparent
  );
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.05));
}

.header-title {
  color: white;
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  letter-spacing: -0.02em;
}


.close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.close-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(239, 68, 68, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
  transform: scale(1.05);
}

.close-btn:hover::before {
  width: 100%;
  height: 100%;
}

.close-icon {
  position: relative;
  z-index: 1;
}

.date-picker-content {
  padding: 24px 28px;
}

.month-year-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
  transition: left 0.5s ease;
}

.nav-btn:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.nav-btn:hover::before {
  left: 100%;
}

.nav-btn:active {
  transform: translateY(0);
}

.nav-arrow {
  position: relative;
  z-index: 1;
}

.month-year-display {
  color: white;
  text-align: center;
  min-width: 180px;
}

.month-text {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.year-text {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}

.calendar-grid {
  margin-bottom: 24px;
}

.day-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}

.day-header {
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  font-weight: 700;
  font-size: 11px;
  padding: 12px 4px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.day-text {
  display: block;
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.date-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 10px 4px;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}

.date-cell::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.date-number {
  position: relative;
  z-index: 1;
}

.date-cell:hover:not(.other-month):not(.disabled) {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.1));
  border-color: #3b82f6;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
}

.date-cell:hover:not(.other-month):not(.disabled)::before {
  width: 100%;
  height: 100%;
}

.date-cell.other-month {
  color: rgba(255, 255, 255, 0.25);
  cursor: default;
  opacity: 0.6;
}

.date-cell.today {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(59, 130, 246, 0.1));
  border-color: #0ea5e9;
  color: white;
  font-weight: 700;
  position: relative;
}

.today-indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #0ea5e9;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(14, 165, 233, 0.6);
}

.date-cell.selected {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
  border-color: #3b82f6;
  color: white;
  box-shadow: 
    0 0 0 3px rgba(59, 130, 246, 0.3),
    0 8px 25px rgba(59, 130, 246, 0.3);
  transform: scale(1.05);
  font-weight: 700;
  animation: pulse 0.4s ease-out;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.date-cell.disabled {
  color: rgba(255, 255, 255, 0.15);
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.02);
  opacity: 0.4;
}

.date-picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 90px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-icon {
  position: relative;
  z-index: 1;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
}

.btn-secondary:active {
  transform: translateY(0);
}
</style>
