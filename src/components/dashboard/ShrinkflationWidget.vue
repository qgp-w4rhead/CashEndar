<template>
  <div class="widget-card">
    <div class="widget-header">
      <h4 class="widget-title">📉 Shrinkflation watch</h4>
      <span class="widget-subtitle">price per 100g creeping up while the shelf price looks flat</span>
    </div>

    <div v-if="shrinkflationAlerts.length === 0" class="widget-empty">
      Nothing suspicious — no item got more expensive per gram without
      its pack price changing.
    </div>

    <div v-else class="shrink-list">
      <div v-for="alert in shrinkflationAlerts.slice(0, 6)" :key="alert.name" class="shrink-row">
        <div class="shrink-main">
          <span class="shrink-name">{{ alert.name }}</span>
          <span class="shrink-detail">
            pack {{ formatPct(alert.packDeltaPct) }} · per 100g
            <span class="shrink-bad">{{ formatPct(alert.per100gDeltaPct) }}</span>
          </span>
        </div>
        <PriceHistoryChart
          :item-name="alert.name"
          :data="per100gHistoryFor(alert.name)"
          value-suffix="/100g"
          class="shrink-spark"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { shrinkflationAlerts, per100gHistoryFor } from '../../composables/dashboard-computables'
import PriceHistoryChart from '../modals/PriceHistoryChart.vue'

const formatPct = (pct: number): string => {
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}
</script>

<style scoped>
.shrink-list {
  display: flex;
  flex-direction: column;
}

.shrink-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.shrink-row:last-child {
  border-bottom: none;
}

.shrink-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.shrink-name {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shrink-detail {
  color: rgba(255, 255, 255, 0.55);
  font-size: var(--font-x-small);
  font-family: monospace;
}

.shrink-bad {
  color: #f87171;
  font-weight: 700;
}

.shrink-spark {
  flex-shrink: 0;
}
</style>
