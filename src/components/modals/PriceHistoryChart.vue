<template>
  <div class="price-history-chart" @click="handleChartClick">
    <div v-if="chartData.points.length === 0" class="no-data-chart">
      <span class="no-data-text">No data</span>
    </div>
    <svg v-else class="mini-chart-svg" viewBox="0 0 80 40" preserveAspectRatio="none">
      <line x1="0" y1="10" x2="80" y2="10" stroke="var(--grey-primary)" stroke-width="0.5"/>
      <line x1="0" y1="20" x2="80" y2="20" stroke="var(--grey-primary)" stroke-width="0.5"/>
      <line x1="0" y1="30" x2="80" y2="30" stroke="var(--grey-primary)" stroke-width="0.5"/>
      
      <!-- Price line -->
      <path
        :d="linePath"
        fill="none"
        :stroke="lineColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chart-line"
      />
      
      <!-- Data points with hover areas -->
      <g class="data-points">
        <circle
          v-for="(point, index) in chartData.points"
          :key="index"
          :cx="getXPosition(index)"
          :cy="getYPosition(point.price)"
          r="8"
          fill="transparent"
          class="hover-area"
          @mouseenter="showTooltip(point, $event)"
          @mouseleave="hideTooltip"
        />
        <circle
          v-for="(point, index) in chartData.points"
          :key="`dot-${index}`"
          :cx="getXPosition(index)"
          :cy="getYPosition(point.price)"
          r="1.5"
          :fill="lineColor"
          class="data-point"
        />
      </g>
    </svg>
    
    <!-- Tooltip -->
    <div
      v-if="tooltip.show"
      class="chart-tooltip"
      :style="{
        left: tooltip.x + 'px',
        top: tooltip.y + 'px'
      }"
    >
      <div class="tooltip-arrow"></div>
      <div class="tooltip-content">
        <div class="tooltip-price">${{ tooltip.price?.toFixed(2) }}</div>
        <div class="tooltip-date">{{ tooltip.date }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getPurchaseHistoryData, type PriceHistoryData, type PricePoint } from '../../composables/payment-computables'

interface Props {
  itemName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  chartClick: [data: PriceHistoryData]
}>()

const chartData = computed(() => getPurchaseHistoryData.value(props.itemName))

const lineColor = 'var(--lime-light)'

// Tooltip state
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  price: 0 as number | null,
  date: ''
})

const showTooltip = (point: PricePoint, event: MouseEvent) => {
  const target = event.currentTarget as SVGElement
  const svgRect = target.closest('svg')!.getBoundingClientRect()
  const containerRect = target.closest('.price-history-chart')!.getBoundingClientRect()
  
  // Calculate position relative to the chart container
  const relativeX = svgRect.left - containerRect.left + (getXPosition(chartData.value.points.indexOf(point)) * svgRect.width / 80)
  const relativeY = svgRect.top - containerRect.top + (getYPosition(point.price) * svgRect.height / 40)
  
  tooltip.value = {
    show: true,
    x: relativeX,
    y: relativeY,
    price: point.price,
    date: point.formattedDate
  }
}

const hideTooltip = () => {
  tooltip.value.show = false
}

const linePath = computed(() => {
  if (chartData.value.points.length === 0) return ''
  if (chartData.value.points.length === 1) {
    const x = getXPosition(0)
    const y = getYPosition(chartData.value.points[0].price)
    return `M ${x} ${y} L ${x} ${y}` // Single point
  }

  // Create smooth line through all points
  let path = ''
  chartData.value.points.forEach((point, index) => {
    const x = getXPosition(index)
    const y = getYPosition(point.price)
    
    if (index === 0) {
      path += `M ${x} ${y}`
    } else {
      path += ` L ${x} ${y}`
    }
  })
  
  return path
})

const getXPosition = (index: number): number => {
  if (chartData.value.points.length <= 1) return 40 // Center for single point
  
  const spacing = 80 / (chartData.value.points.length - 1)
  return index * spacing
}

const getYPosition = (price: number): number => {
  const priceRange = chartData.value.high - chartData.value.low
  if (priceRange === 0) return 15 // Middle for single price
  
  const normalizedPrice = (price - chartData.value.low) / priceRange
  return 40 - (normalizedPrice * 33) - 3.5 // 33px chart area with 3.5px padding
}

const handleChartClick = () => {
  emit('chartClick', chartData.value)
}
</script>

<style scoped>
.price-history-chart {
  width: 80px;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  padding: 10px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.price-history-chart:hover {
  background: oklch(from var(--grey-primary) l c h / 0.2);
  transform: scale(1.05);
}

.mini-chart-svg {
  border: 1px solid var(--lime-light);
  border-radius: 0.5rem;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  display: block;
}

.no-data-chart {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}

.no-data-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: var(--font-x-small);
  font-weight: 500;
}

.chart-line {
  transition: stroke-width 0.2s ease;
}

.price-history-chart:hover .chart-line {
  stroke-width: 2;
}

.data-point {
  transition: r 0.2s ease;
}

.price-history-chart:hover .data-point {
  r: 2;
}

/* Tooltip styles */
.chart-tooltip {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
  transform: translateX(-50%) translateY(-100%);
  margin-top: -8px;
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid oklch(from var(--grey-dark) l c h / 0.95);
}

.tooltip-content {
  background: oklch(from var(--grey-dark) l c h / 0.95);
  border: 1px solid oklch(from var(--grey-primary) l c h / 0.3);
  border-radius: 6px;
  padding: 8px 12px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-price {
  color: white;
  font-weight: 600;
  font-size: var(--font-x-small);
  font-family: monospace;
  margin-bottom: 2px;
}

.tooltip-date {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-x-small);
  font-weight: 500;
}
</style>
