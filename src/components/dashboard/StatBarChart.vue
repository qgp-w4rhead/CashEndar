<template>
  <div class="stat-bar-chart">
    <div v-if="bars.length === 0" class="no-data-text">No values to chart</div>
    <svg v-else class="bar-chart-svg" :viewBox="`0 0 400 ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
      <g v-for="(bar, index) in bars" :key="bar.label">
        <rect
          x="130"
          :y="index * rowHeight + 6"
          :width="barWidth(bar.value)"
          height="16"
          rx="4"
          :fill="bar.color"
          class="bar-rect"
        />
        <text
          x="124"
          :y="index * rowHeight + 18"
          text-anchor="end"
          class="bar-label"
        >{{ truncate(bar.label) }}</text>
        <text
          :x="134 + barWidth(bar.value)"
          :y="index * rowHeight + 18"
          text-anchor="start"
          class="bar-value"
        >{{ bar.formatted }}</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface StatBar {
  label: string
  value: number
  formatted: string
  color?: string
}

interface Props {
  bars: StatBar[]
}

const props = defineProps<Props>()

const rowHeight = 28
const chartHeight = computed(() => Math.max(props.bars.length * rowHeight + 8, 36))

const maxValue = computed(() => Math.max(...props.bars.map(b => Math.abs(b.value)), 0))

// 200px max bar width, labels on the left, values on the right
const barWidth = (value: number): number => {
  if (maxValue.value === 0) return 0
  return Math.max((Math.abs(value) / maxValue.value) * 200, 2)
}

const truncate = (label: string): string => {
  return label.length > 18 ? `${label.slice(0, 17)}…` : label
}

const bars = computed(() => props.bars.map(bar => ({
  ...bar,
  color: bar.color || 'var(--lime-primary)',
})))
</script>

<style scoped>
.stat-bar-chart {
  width: 100%;
}

.bar-chart-svg {
  width: 100%;
  display: block;
}

.bar-rect {
  transition: width 0.3s ease;
  opacity: 0.85;
}

.bar-rect:hover {
  opacity: 1;
}

.bar-label {
  fill: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  font-weight: 500;
}

.bar-value {
  fill: white;
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
}

.no-data-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: var(--font-x-small);
  text-align: center;
  padding: 12px;
}
</style>
