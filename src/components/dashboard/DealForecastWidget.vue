<template>
  <div class="widget-card">
    <div class="widget-header">
      <h4 class="widget-title">💸 Cheap again soon</h4>
      <span class="widget-subtitle">predicted from your price history</span>
    </div>

    <div v-if="dealForecasts.length === 0" class="widget-empty">
      Not enough price history yet — predictions need at least 4 purchases
      of an item spread over a few months.
    </div>

    <div v-else class="forecast-list">
      <div v-for="entry in dealForecasts.slice(0, 8)" :key="entry.name" class="forecast-row">
        <div class="forecast-main">
          <span class="forecast-name">{{ entry.name }}</span>
          <span class="forecast-when" :class="{ overdue: entry.prediction.overdue }">
            {{ whenLabel(entry) }}
          </span>
        </div>
        <div class="forecast-meta">
          <span class="forecast-prices">
            <span class="typical-low">${{ entry.prediction.typicalLow.toFixed(2) }}</span>
            <span class="vs">deal vs</span>
            <span class="last-price">${{ entry.lastPrice.toFixed(2) }} last</span>
          </span>
          <HoverText :text="`Confidence: ${entry.prediction.confidence} (${entry.prediction.kind === 'seasonal' ? 'seasonal pattern' : 'sale interval'})`">
            <span class="confidence-dots">{{ confidenceDots(entry.prediction.confidence) }}</span>
          </HoverText>
          <PriceHistoryChart :item-name="entry.name" :data="entry.history" class="forecast-spark" />
        </div>
      </div>
      <div v-if="forecastInsufficientCount > 0" class="widget-footnote">
        {{ forecastInsufficientCount }} item(s) need more purchase history to be predicted.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { dealForecasts, forecastInsufficientCount, DealForecastEntry } from '../../composables/dashboard-computables'
import { MONTH_NAMES_FULL } from '../../utils/constants'
import PriceHistoryChart from '../modals/PriceHistoryChart.vue'
import HoverText from '../primitives/hoverText.vue'

const whenLabel = (entry: DealForecastEntry): string => {
  const { prediction } = entry
  if (prediction.overdue) {
    return prediction.kind === 'seasonal'
      ? `usually cheap this month (${MONTH_NAMES_FULL[prediction.monthOfYear!]})`
      : 'a deal is due now'
  }
  if (prediction.kind === 'seasonal') {
    return `usually cheap in ${MONTH_NAMES_FULL[prediction.monthOfYear!]}`
  }
  const days = Math.max(1, Math.round((prediction.nextDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
  if (days < 14) return `next deal in ~${days} day${days === 1 ? '' : 's'}`
  return `next deal in ~${Math.round(days / 7)} weeks`
}

const confidenceDots = (confidence: 'low' | 'medium' | 'high'): string => {
  if (confidence === 'high') return '●●●'
  if (confidence === 'medium') return '●●○'
  return '●○○'
}
</script>

<style scoped>
.forecast-list {
  display: flex;
  flex-direction: column;
}

.forecast-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.forecast-row:last-of-type {
  border-bottom: none;
}

.forecast-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.forecast-name {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forecast-when {
  color: var(--lime-light);
  font-size: var(--font-x-small);
}

.forecast-when.overdue {
  color: #fbbf24;
}

.forecast-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.forecast-prices {
  display: flex;
  gap: 4px;
  align-items: baseline;
  font-size: var(--font-x-small);
}

.typical-low {
  color: var(--lime-light);
  font-weight: 700;
  font-family: monospace;
}

.vs {
  color: rgba(255, 255, 255, 0.4);
}

.last-price {
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
}

.confidence-dots {
  color: var(--lime-primary);
  font-size: 8px;
  letter-spacing: 2px;
}

.forecast-spark {
  flex-shrink: 0;
}
</style>
