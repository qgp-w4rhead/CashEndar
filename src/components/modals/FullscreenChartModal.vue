<template>
  <div v-if="show" class="fullscreen-chart-overlay" @click="handleBackdropClick">
    <div class="fullscreen-chart-modal" @click.stop :class="{ 'expanding': isExpanding, 'collapsing': isCollapsing }">
      <div class="chart-modal-header">
        <h3 class="chart-modal-title">Price History : {{ itemName }}</h3>
        <div class="header-controls">
          <CustomDropdown 
            v-model="selectedTimePeriod" 
            :options="timePeriodOptions"
            placeholder="Select period"
            class="time-period-dropdown"
          />
          <button class="close-btn" @click="closeModal">×</button>
        </div>
      </div>

      <div class="chart-modal-body">
        <div class="chart-container">
          <div v-if="timeBasedChartData.points.length === 0" class="no-data-state">
            <div class="no-data-icon">📊</div>
            <p class="no-data-message">No purchase history available</p>
          </div>
          
          <div v-else class="chart-content">
            <svg class="fullscreen-chart-svg" viewBox="0 0 400 300">
              <!-- Background -->
              <rect width="400" height="250" fill="rgba(255,255,255,0.02)" rx="8"/>
              
              <!-- Grid lines -->
              <g class="grid-lines">
                <!-- Horizontal grid lines -->
                <line v-for="i in 5" :key="`h-${i}`" 
                  :x1="40" :y1="50 + (i * 40)" 
                  :x2="360" :y2="50 + (i * 40)" 
                  stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                
                <!-- Vertical grid lines -->
                <line v-for="i in 6" :key="`v-${i}`" 
                  :x1="40 + (i * 53.33)" :y1="50" 
                  :x2="40 + (i * 53.33)" :y2="250" 
                  stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
              </g>
              
              <!-- Axes -->
              <line x1="40" y1="250" x2="360" y2="250" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
              <line x1="40" y1="50" x2="40" y2="250" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
              
              <!-- Y-axis labels (prices) -->
              <g class="y-axis-labels">
                <text v-for="(price, i) in yAxisLabels" :key="`y-${i}`"
                  :x="35" :y="55 + (i * 40)"
                  text-anchor="end" 
                  fill="rgba(255,255,255,0.6)" 
                  font-size="10" 
                  font-family="monospace">
                  ${{ price.toFixed(2) }}
                </text>
              </g>
              
              <!-- X-axis labels (dates) -->
              <g class="x-axis-labels">
                <text v-for="(point, i) in xAxisPoints" :key="`x-${i}`"
                  :x="getXPosition(i)" :y="270"
                  text-anchor="middle" 
                  fill="rgba(255,255,255,0.6)" 
                  font-size="10">
                  {{ point.formattedDate }}
                </text>
              </g>
              
              <!-- Price line -->
              <path
                :d="linePath"
                fill="none"
                :stroke="lineColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="chart-line-fullscreen"
              />
              
              <!-- Data points with hover areas and tooltips -->
              <g class="data-points-fullscreen">
                <g
                  v-for="(point, index) in timeBasedChartData.points"
                  :key="index"
                  class="data-point-group"
                  @mouseenter="showTooltip(point, index, $event)"
                  @mouseleave="hideTooltip"
                >
                  <!-- Larger hover area -->
                  <circle
                    :cx="getXPosition(index)"
                    :cy="getYPosition(point.price)"
                    r="12"
                    fill="transparent"
                    class="hover-area-fullscreen"
                  />
                  <!-- Visible data point -->
                  <circle
                    :cx="getXPosition(index)"
                    :cy="getYPosition(point.price)"
                    r="4"
                    :fill="lineColor"
                    stroke="rgba(255,255,255,0.8)"
                    stroke-width="1"
                    class="data-point-fullscreen"
                  />
                </g>
              </g>
            </svg>
            
            <!-- Tooltip -->
            <div
              v-if="tooltip.show"
              class="chart-tooltip-fullscreen"
              :style="{
                left: tooltip.x + 'px',
                top: tooltip.y + 'px'
              }"
            >
              <div class="tooltip-arrow-fullscreen"></div>
              <div class="tooltip-content-fullscreen">
                <div class="tooltip-price-fullscreen">${{ tooltip.price?.toFixed(2) }}</div>
                <div class="tooltip-date-fullscreen">{{ tooltip.date }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Panel -->
        <div v-if="timeBasedChartData.points.length > 0" class="statistics-panel">
          <div class="stats-groups">
            <div class="stats-group">
              <div class="stat-item">
                <div class="stat-label">Low</div>
                <div class="stat-value low">${{ timeBasedChartData.low.toFixed(2) }}</div>
              </div>
              <div class="internal-separator"></div>
              <div class="stat-item">
                <div class="stat-label">BEST</div>
                <div class="stat-value best">${{ timeBasedChartData.best.toFixed(2) }}</div>
              </div>
            </div>
            
            <div class="stats-separator"></div>

            <div class="stats-group">
              <div class="stat-item">
                <div class="stat-label">Avg</div>
                <div class="stat-value avg">${{ averagePrice.toFixed(2) }}</div>
              </div>
              <div class="internal-separator"></div>
              <div class="stat-item">
                <div class="stat-label">LAST</div>
                <div class="stat-value last">${{ timeBasedChartData.last.toFixed(2) }}</div>
              </div>
            </div>
            
            <div class="stats-separator"></div>
            
            <div class="stats-group">
              <div class="stat-item">
                <div class="stat-label">High</div>
                <div class="stat-value high">${{ timeBasedChartData.high.toFixed(2) }}</div>
              </div>
              <div class="internal-separator"></div>
              <div class="stat-item">
                <div class="stat-label">Peak</div>
                <div class="stat-value peak">${{ timeBasedChartData.peak.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { type PriceHistoryData, type PricePoint, getPurchaseHistoryDataForPeriod } from '../../composables/payment-computables'
import CustomDropdown from '../primitives/CustomDropdown.vue'

interface Props {
  show: boolean
  itemName: string
  chartData: PriceHistoryData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const isExpanding = ref(false)
const isCollapsing = ref(false)
const selectedTimePeriod = ref('month')

const timePeriodOptions = [
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' }
]

// Computed property that updates chart data based on selected time period
const timeBasedChartData = computed(() => {
  return getPurchaseHistoryDataForPeriod(props.itemName, selectedTimePeriod.value as 'month' | 'year')
})

const lineColor = 'oklch(from var(--grey-primary) 0.55 0.12 145)' // Grey-primary approximation for chart line

// Tooltip state
const tooltip = ref({
  show: false,
  x: 0,
  y: 0,
  price: 0 as number | null,
  date: ''
})

const showTooltip = (point: PricePoint, index: number, event: MouseEvent) => {
  const target = event.currentTarget as SVGElement
  const svgElement = target.closest('svg') as SVGElement
  const chartContainer = target.closest('.chart-content') as HTMLElement
  const svgRect = svgElement.getBoundingClientRect()
  const containerRect = chartContainer.getBoundingClientRect()
  
  // Calculate position relative to the chart container
  const relativeX = svgRect.left - containerRect.left + (getXPosition(index) * svgRect.width / 400)
  const relativeY = svgRect.top - containerRect.top + (getYPosition(point.price) * svgRect.height / 300)
  
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

const yAxisLabels = computed(() => {
  if (timeBasedChartData.value.points.length === 0) return []
  const range = timeBasedChartData.value.high - timeBasedChartData.value.low
  if (range === 0) return [timeBasedChartData.value.low]
  
  // Extend range by 10% and round up to nearest 10 cents
  const extension = range * 0.1
  const visualMin = Math.floor((timeBasedChartData.value.low - extension) * 10) / 10
  const visualMax = Math.ceil((timeBasedChartData.value.high + extension) * 10) / 10
  
  const labels = []
  for (let i = 0; i <= 5; i++) {
    const value = visualMax - (i * (visualMax - visualMin) / 5)
    labels.push(value)
  }
  return labels
})

const xAxisPoints = computed(() => {
  // Show up to 7 date labels to avoid overcrowding
  const points = timeBasedChartData.value.points
  if (points.length <= 7) return points
  
  const step = Math.floor(points.length / 7)
  return points.filter((_, index) => index % step === 0).slice(0, 7)
})

const averagePrice = computed(() => {
  if (timeBasedChartData.value.points.length === 0) return 0
  const sum = timeBasedChartData.value.points.reduce((acc, point) => acc + point.price, 0)
  return sum / timeBasedChartData.value.points.length
})

const linePath = computed(() => {
  if (timeBasedChartData.value.points.length === 0) return ''
  if (timeBasedChartData.value.points.length === 1) {
    const x = getXPosition(0)
    const y = getYPosition(timeBasedChartData.value.points[0].price)
    return `M ${x} ${y} L ${x} ${y}` // Single point
  }

  // Create smooth line through all points
  let path = ''
  timeBasedChartData.value.points.forEach((point, index) => {
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
  if (timeBasedChartData.value.points.length <= 1) return 200 // Center for single point
  
  const spacing = 320 / (timeBasedChartData.value.points.length - 1)
  return 40 + (index * spacing)
}

const getYPosition = (price: number): number => {
  const priceRange = timeBasedChartData.value.high - timeBasedChartData.value.low
  if (priceRange === 0) return 150 // Middle for single price
  
  // Use the same rounded visual range as yAxisLabels for consistency
  const extension = priceRange * 0.1
  const visualMin = Math.floor((timeBasedChartData.value.low - extension) * 10) / 10
  const visualMax = Math.ceil((timeBasedChartData.value.high + extension) * 10) / 10
  const visualRange = visualMax - visualMin
  
  const normalizedPrice = (price - visualMin) / visualRange
  return 250 - (normalizedPrice * 200) // 200px chart area
}

const closeModal = async () => {
  isCollapsing.value = true
  await nextTick()
  setTimeout(() => {
    emit('close')
    isCollapsing.value = false
  }, 200)
}

const handleBackdropClick = () => {
  closeModal()
}
</script>

<style scoped>
.fullscreen-chart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
}

.fullscreen-chart-modal {
  background: linear-gradient(135deg, oklch(from var(--grey-dark) l c h / 1) 0%, oklch(from var(--grey-primary) l c h / 0.5) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  animation: modalExpandIn 0.3s ease-out;
}

.fullscreen-chart-modal.expanding {
  animation: modalExpandIn 0.3s ease-out;
}

.fullscreen-chart-modal.collapsing {
  animation: modalCollapseOut 0.2s ease-in;
}

@keyframes modalExpandIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(50px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modalCollapseOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.8) translateY(50px);
  }
}

.chart-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time-period-dropdown {
  width: 120px;
}

.chart-modal-title {
  color: white;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.chart-modal-body {
  padding: 24px;
}

.chart-container {
  margin-bottom: 24px;
}

.no-data-state {
  text-align: center;
  padding: 60px 20px;
}

.no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-data-message {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  margin: 0;
}

.chart-content {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
}

.fullscreen-chart-svg {
  width: 100%;
  max-width: 400px;
  height: auto;
}

.chart-line-fullscreen {
  filter: drop-shadow(0 2px 4px oklch(from var(--grey-primary) l c h / 0.3));
}

.data-point-fullscreen {
  cursor: pointer;
  transition: r 0.2s ease;
}

.data-point-fullscreen:hover {
  r: 6;
}

/* Fullscreen tooltip styles */
.chart-tooltip-fullscreen {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
  transform: translateX(-50%) translateY(-100%);
  margin-top: -12px;
}

.tooltip-arrow-fullscreen {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid oklch(from var(--grey-dark) l c h / 0.95);
}

.tooltip-content-fullscreen {
  background: oklch(from var(--grey-dark) l c h / 0.95);
  border: 1px solid oklch(from var(--grey-primary) l c h / 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.tooltip-price-fullscreen {
  color: white;
  font-weight: 700;
  font-size: 14px;
  font-family: monospace;
  margin-bottom: 4px;
}

.tooltip-date-fullscreen {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
}

.statistics-panel {
  background: oklch(from var(--grey-primary) l c h / 0.05);
  border-radius: 8px;
  border: 1px solid oklch(from var(--grey-primary) l c h / 0.1);
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stats-groups {
  display: flex;
  align-items: stretch;
  gap: 16px;
  justify-content: center;
}

.stats-group {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  max-width: 200px;
}

.stats-separator {
  width: 1px;
  background: linear-gradient(to bottom, 
    transparent, 
    oklch(from var(--grey-primary) l c h / 0.3) 20%, 
    oklch(from var(--grey-primary) l c h / 0.3) 80%, 
    transparent
  );
  margin: 0 8px;
}

.internal-separator {
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, 
    transparent, 
    oklch(from var(--grey-primary) l c h / 0.2) 30%, 
    oklch(from var(--grey-primary) l c h / 0.2) 70%, 
    transparent
  );
  margin: 4px 0;
}

.stat-item {
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.075);
  transform: translateY(-1px);
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  color: white;
  font-size: 18px;
  font-weight: 700;
  font-family: monospace;
}

.stat-value.low {
  color: oklch(from var(--lime-primary) l c h / 1);
}

.stat-value.high {
  color: #f53a0b;
}

.stat-value.peak {
  color: #f53a0b;
}

.stat-value.last {
  color: oklch(from var(--grey-light) l c h / 1);
}

.stat-value.avg {
  color: #f59e0b;
}

.stat-value.best {
  color: oklch(from var(--lime-primary) l c h / 1);
}

/* Responsive design */
@media (max-width: 640px) {
  .fullscreen-chart-modal {
    width: 95%;
    margin: 20px;
  }
  
  .stats-groups {
    flex-direction: column;
    gap: 20px;
  }
  
  .stats-separator {
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, 
      transparent, 
      oklch(from var(--grey-primary) l c h / 0.3) 20%, 
      oklch(from var(--grey-primary) l c h / 0.3) 80%, 
      transparent
    );
    margin: 8px 0;
  }
  
  .stats-group {
    max-width: none;
    flex-direction: row;
    justify-content: space-around;
  }
  
  .chart-modal-body {
    padding: 16px;
  }
}
</style>
