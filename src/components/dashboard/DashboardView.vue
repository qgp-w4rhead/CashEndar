<template>
  <div class="calendar-container dashboard-container">
    <CalendarHeader
      :view-mode="calendarViewMode"
      title="Dashboard"
      :show-nav="false"
      @set-view="setCalendarView"
      @toggle-pie-chart="togglePieChart"
      @toggle-item-chart="toggleItemChart"
    />

    <CustomScrollbar class="dashboard-scroll" direction="vertical" max-height="100%">
      <div class="dashboard-grid">
        <DealForecastWidget class="grid-deals" />
        <PurchaseDiffWidget class="grid-diff" />
        <StarredStatsWidget class="grid-stats" />
        <ShrinkflationWidget class="grid-shrink" />
      </div>
    </CustomScrollbar>
  </div>
</template>

<script setup lang="ts">
import { calendarViewMode } from '../../stores/ui-state.store'
import { ViewMode } from '../../types/payment.types'
import { togglePieChart, toggleItemChart } from '../../composables/payment-handlers'

import CalendarHeader from '../calendar/CalendarHeader.vue'
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import DealForecastWidget from './DealForecastWidget.vue'
import PurchaseDiffWidget from './PurchaseDiffWidget.vue'
import StarredStatsWidget from './StarredStatsWidget.vue'
import ShrinkflationWidget from './ShrinkflationWidget.vue'

const setCalendarView = (mode: ViewMode) => {
  calendarViewMode.value = mode
}
</script>

<style>
/* Shared widget card styling (unscoped on purpose: used by all widgets) */
.widget-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 18px 20px;
  min-width: 0;
}

.widget-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.widget-title {
  margin: 0;
  color: white;
  font-size: var(--font-small);
  font-weight: 700;
}

.widget-subtitle {
  color: rgba(255, 255, 255, 0.45);
  font-size: var(--font-x-small);
}

.widget-empty {
  color: rgba(255, 255, 255, 0.45);
  font-size: var(--font-x-small);
  padding: 16px 4px;
}

.widget-footnote {
  color: rgba(255, 255, 255, 0.35);
  font-size: var(--font-x-small);
  padding-top: 8px;
}
</style>

<style scoped>
.dashboard-container {
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dashboard-scroll {
  flex: 1;
  min-height: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding-bottom: 24px;
}

@media (max-width: 1100px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
