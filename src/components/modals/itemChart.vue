<template>
  <div v-if="showItemChartModal" class="modal-overlay">
    <div class="item-chart-modal" @click.stop>
      <div class="modal-header">
        <h3>Inventory Items Chart</h3>
        <button class="close-btn" @click="closeItemChartModal">×</button>
      </div>

      <div class="modal-body">
        <div class="chart-container">
          <div class="chart-header">
            <h4 class="chart-title">Compare Inventory Items</h4>
            <div class="chart-legend">
              <div class="chart-total">{{ itemChartItems.length }} items</div>
            </div>
          </div>

          <div class="item-comparison-table">
            <div class="table-header">
              <div class="header-cell">Item</div>
              <div class="mid-columns-wrap">
                <div class="header-cell sortable" @click="sortBy('portionSize')">
                  Portion
                  <span class="sort-arrow" :class="getSortArrowClass('portionSize')"></span>
                </div>
                <div class="header-cell sortable" @click="sortBy('countRemaining')">
                  Total Left
                  <span class="sort-arrow" :class="getSortArrowClass('countRemaining')"></span>
                </div>
                <div class="header-cell sortable" @click="sortBy('cost')">
                  Cost
                  <span class="sort-arrow" :class="getSortArrowClass('cost')"></span>
                </div>
                <div class="header-cell sortable" @click="sortBy('depletionDate')">
                  Depletion
                  <span class="sort-arrow" :class="getSortArrowClass('depletionDate')"></span>
                </div>
              </div>
              <div class="header-cell">Price History</div>
            </div>

            <div
              v-for="item in sortedItems"
              :key="item.item.id"
              class="table-row"
              :class="{ 'selected-row': selectedChartItem === item }"
              @click="selectedChartItem = item"
            >
              <div class="table-cell item-name">
                <div class="item-avatar">
                  {{ item.itemName.charAt(0).toUpperCase() }}
                </div>
                <div class="item-name-content">
                  <span class="item-name-text">{{ item.itemName }}</span>
                  <span v-if="item.item.brand" class="item-brand">{{ item.item.brand }}</span>
                </div>
              </div>
              
              <div class="mid-columns-wrap">
              <div class="table-cell portion-size">
                <div class="portion-bar-container">
                  <div class="portion-bar">
                    <div
                      class="portion-bar-fill"
                      :style="{
                        width: `${Math.min(100, (item.item.portionSize / item.item.itemSize) * 100)}%`
                      }"
                    ></div>
                    <span class="bar-label-overlay">{{ item.item.itemSize && item.item.portionSize ? getSimplifiedFraction(item.item.portionSize, item.item.itemSize) : 'N/A' }}</span>
                  </div>
                </div>
              </div>
              <div class="table-cell portions-count">
                <div class="comparison-bar-container">
                  <div class="comparison-bar">
                    <div
                      class="bar-fill"
                      :style="{
                        width: `${Math.min(100, (getPortionsRemaining(item.item) / getTotalPortions(item.item)) * 100)}%`
                      }"
                    ></div>
                    <span class="bar-label-overlay">{{ getPortionsRemaining(item.item) }} / {{ getTotalPortions(item.item) }}</span>
                  </div>
                </div>
              </div>
              <div class="table-cell product-cost">
                <span class="cell-value">{{ item.productCost ? `$${item.productCost.toFixed(2)}` : '$0.00' }}</span>
              </div>
              <div class="table-cell depletion-date">
                <span class="cell-value">{{ item.depletionDate || (getPortionsRemaining(item.item) <= 0 ? 'Depleted' : (item.isTracked ? 'No tracking' : 'No tracking')) }}</span>
                <HoverText v-if="item.isTracked" :text="`Tracked with: ${item.item.depletionRate}`">
                  <span class="tracking-indicator" :class="{ 'depleted-indicator': getPortionsRemaining(item.item) <= 0 }">●</span>
                </HoverText>
              </div>
              </div>
              <div class="table-cell price-history" @click.stop>
                <PriceHistoryChart 
                  :item-name="item.itemName" 
                  @chart-click="handleChartClick"
                />
              </div>
            </div>

            <div v-if="itemChartItems.length === 0" class="empty-state-section">
              <div class="empty-state-content">
                No item yet, add an <span class="highlighted-item" @click="handleAddItem">item</span>
              </div>
            </div>
          </div>

          <div v-if="selectedChartItem" class="selected-item-details">
            <h4 class="details-title">Selected Item : {{ selectedChartItem.itemName }}</h4>
            <div class="details-flex">
              <div class="detail-item">
                <label>Portion Size:</label>
                <span>{{ selectedChartItem.portionSize || 'Not specified' }}</span>
              </div>
              <div class="detail-item">
                <label>Portions Remaining:</label>
                <span>{{ selectedChartItem.portionsCount || 0 }} portions</span>
              </div>
              <div class="detail-item">
                <label>Product Cost:</label>
                <span>{{ selectedChartItem.productCost ? `$${selectedChartItem.productCost.toFixed(2)}` : '$0.00' }}</span>
              </div>
              <div class="detail-item">
                <label>Tracking:</label>
                <span>{{ selectedChartItem.isTracked ? 'Enabled' : 'Disabled' }}</span>
              </div>
              <div v-if="selectedChartItem.depletionDate" class="detail-item">
                <label>Est. Depletion Date:</label>
                <span>{{ selectedChartItem.depletionDate }}</span>
              </div>
            </div>
          </div>

          <div class="chart-summary">
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">Total Items:</span>
                <span class="stat-value">{{ itemChartItems.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Tracked Items:</span>
                <span class="stat-value">{{ itemChartItems.filter(i => i.isTracked).length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Value:</span>
                <span class="stat-value">${{ itemChartItems.reduce((sum, item) => sum + (item.productCost || 0), 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Price History Chart Modal -->
    <FullscreenChartModal
      :show="showPriceChartModal"
      :item-name="selectedChartItemName"
      :chart-data="selectedChartData"
      @close="closePriceChartModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

import {
  showItemChartModal
} from '../../stores/ui-state.store'

import {
  itemChartItems,
  selectedChartItem,
  getPortionsRemaining,
  getTotalPortions,
  getSimplifiedFraction,
  getPurchaseHistoryData,
  type PriceHistoryData
} from '../../composables/payment-computables'

import {
  closeItemChartModal,
  openInventoryAddMenu
} from '../../composables/payment-handlers'

import PriceHistoryChart from './PriceHistoryChart.vue'
import FullscreenChartModal from './FullscreenChartModal.vue'
import HoverText from '../primitives/hoverText.vue'

// Price chart modal state
const showPriceChartModal = ref(false)
const selectedChartItemName = ref('')
const selectedChartData = ref<PriceHistoryData>({
  points: [],
  low: 0,
  high: 0,
  peak: 0,
  last: 0,
  best: 0
})

const handleChartClick = (chartData: PriceHistoryData) => {
  selectedChartData.value = chartData
  // Find the item name from the chart data
  const item = itemChartItems.value.find(item => {
    const itemHistory = getPurchaseHistoryData.value(item.itemName)
    return itemHistory.points.length === chartData.points.length &&
           itemHistory.low === chartData.low &&
           itemHistory.high === chartData.high
  })
  
  if (item) {
    selectedChartItemName.value = item.itemName
    showPriceChartModal.value = true
  }
}

const closePriceChartModal = () => {
  showPriceChartModal.value = false
  selectedChartItemName.value = ''
  selectedChartData.value = {
    points: [],
    low: 0,
    high: 0,
    peak: 0,
    last: 0,
    best: 0
  }
}

// Sorting state
const sortField = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// Bar visualization toggle state
const barVisualizationActive = ref<Set<string>>(new Set())

// Toggle bar visualization for specific item and column
const toggleBarVisualization = (itemId: string, column: string) => {
  const key = `${itemId}-${column}`
  if (barVisualizationActive.value.has(key)) {
    barVisualizationActive.value.delete(key)
  } else {
    barVisualizationActive.value.add(key)
  }
}

// Check if bar visualization is active for specific item and column
const isBarVisualizationActive = (itemId: string, column: string) => {
  return barVisualizationActive.value.has(`${itemId}-${column}`)
}

// Computed property for sorted items
const sortedItems = computed(() => {
  if (!sortField.value) return itemChartItems.value
  
  return [...itemChartItems.value].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    switch (sortField.value) {
      case 'portionSize':
        aValue = a.item.portionSize && a.item.itemSize ? 
          a.item.portionSize / a.item.itemSize : 0
        bValue = b.item.portionSize && b.item.itemSize ? 
          b.item.portionSize / b.item.itemSize : 0
        break
      case 'countRemaining':
        aValue = getPortionsRemaining(a.item)
        bValue = getPortionsRemaining(b.item)
        break
      case 'cost':
        aValue = a.productCost || 0
        bValue = b.productCost || 0
        break
      case 'depletionDate':
        // Handle depletion date sorting
        const aDate = a.depletionDate
        const bDate = b.depletionDate
        
        if (aDate === 'Depleted' || getPortionsRemaining(a.item) <= 0) {
          aValue = new Date(0) // Earliest date for depleted items
        } else if (aDate === 'No tracking' || !aDate) {
          aValue = new Date(8640000000000000) // Latest date for untracked items
        } else {
          aValue = new Date(aDate)
        }
        
        if (bDate === 'Depleted' || getPortionsRemaining(b.item) <= 0) {
          bValue = new Date(0)
        } else if (bDate === 'No tracking' || !bDate) {
          bValue = new Date(8640000000000000)
        } else {
          bValue = new Date(bDate)
        }
        break
      default:
        return 0
    }
    
    // Handle string sorting
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder.value === 'asc' ? 
        aValue.localeCompare(bValue) : 
        bValue.localeCompare(aValue)
    }
    
    // Handle numeric sorting
    if (sortOrder.value === 'asc') {
      return aValue - bValue
    } else {
      return bValue - aValue
    }
  })
})

// Sorting functions
const sortBy = (field: string) => {
  if (sortField.value === field) {
    // Toggle sort order if same field
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new field and default to ascending
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

const getSortArrowClass = (field: string) => {
  if (sortField.value !== field) return ''
  return sortOrder.value === 'asc' ? 'arrow-up' : 'arrow-down'
}

const handleAddItem = () => {
  openInventoryAddMenu()
}
</script>

<style scoped>
/* Item Chart Modal */
.item-chart-modal {
  background: linear-gradient(135deg, var(--grey-dark) 0%, oklch(from var(--grey-primary) l c h / 0.5) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  width: 95%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: auto;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slider Controls */
.slider-controls {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.slider-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-header label {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
}

.inventory-slider {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
}

/* Item Comparison Table */
.item-comparison-table {
  margin-bottom: 24px;
}

.mid-columns-wrap {
  display: grid;
  padding: 1rem;
  grid-template-columns: 25% 25% 20% 25%;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
}

.mid-columns-wrap .table-cell:not(:last-child) {
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  padding-right: 20px;
  box-sizing: border-box;
}

.mid-columns-wrap .table-cell.portion-size,
.mid-columns-wrap .table-cell.portions-count {
  padding-right: 0;
}

.mid-columns-wrap .table-cell {
  box-sizing: border-box;
}

.table-header {
  display: grid;
  align-items: center;
  grid-template-columns: 22% 58% 20%;
  padding: 16px 16px;
  background: oklch(from var(--grey-primary) l c h / 0.1);
  border-radius: 8px 8px 0 0;
  border: 1px solid oklch(from var(--grey-primary) l c h / 0.2);
}

.header-cell {
  color: var(--grey-light);
  font-weight: 700;
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 10px;
  padding-left: 10px;
}

.header-cell.sortable {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  transition: color 0.2s ease;
}

.header-cell.sortable:hover {
  color: var(--lime-primary);
}

.sort-arrow {
  margin-left: 8px;
  font-size: var(--font-x-small);
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.sort-arrow.arrow-up::before {
  content: '▲';
}

.sort-arrow.arrow-down::before {
  content: '▼';
}

.header-cell.sortable:hover .sort-arrow {
  opacity: 1;
}

/* Center only Price History column */
.table-row > .table-cell.price-history {
  justify-content: center !important;
  text-align: center !important;
  display: flex !important;
  align-items: center;
}

.table-header > .header-cell:last-child {
  text-align: center;
}

.table-row {
  display: grid;
  grid-template-columns: 22% 58% 20%;
  padding: 16px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
}

.table-row:first-child {
  margin-top: 16px;
}

.table-row:last-child {
  border-radius: 0 0 8px 8px;
}

.table-row:only-child {
  border-radius: 8px;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: oklch(from var(--grey-primary) l c h / 0.1);
  transform: translateY(-1px);
}

.selected-row {
  background: oklch(from var(--grey-primary) l c h / 0.1) !important;
  border-color: var(--grey-primary) !important;
  box-shadow: 0 0 0 2px oklch(from var(--grey-primary) l c h / 0.3);
}

.table-cell {
  padding: 12px 8px;
  display: flex;
  align-items: center;
  color: white;
  font-size: var(--font-small);
}

.table-cell:not(.portion-size):not(.portions-count) {
  justify-content: flex-start;
  text-align: left;
}

.item-name {
  font-weight: 600;
}

.item-name-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name-text {
  font-weight: 600;
  color: white;
}

.item-brand {
  font-size: var(--font-x-small);
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.item-avatar {
  margin-right: 0.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--grey-primary), var(--grey-light));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: var(--font-small);
  flex-shrink: 0;
}

.cell-value {
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.clickable-value {
  cursor: pointer;
  transition: color 0.2s ease;
  user-select: none;
}

.clickable-value:hover {
  color: var(--lime-primary);
}

.portion-size .cell-value {
  text-align: center;
  width: 100%;
}

.comparison-bar {
  width: 100%;
  height: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--grey-primary), var(--grey-light));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-fill-overflow {
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ea580c);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
}

.bar-fill-overdraw {
  height: 100%;
  background: linear-gradient(90deg, #f97316, #ea580c);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

.portion-bar-container,
.comparison-bar-container {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  width: 90%;
}

.portion-bar {
  width: 100%;
  height: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.portion-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--grey-primary), var(--grey-light));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-label {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: var(--font-small);
  white-space: nowrap;
}

.bar-label-inside {
  color: white;
  font-weight: 600;
  font-size: var(--font-x-small);
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.bar-label-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: 600;
  font-size: var(--font-x-small);
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 10;
}

.depletion-date {
  justify-content: space-between;
  align-items: center;
}

.depletion-date .cell-value {
  flex: 1;
}

.depletion-date .tracking-indicator {
  color: var(--lime-primary);
  cursor: help;
}

.depletion-date .tracking-indicator.depleted-indicator {
  color: #ef4444;
}

/* Price History Column */
.price-history {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  width: 100%;
}

/* Selected Item Details */
.selected-item-details {
  padding: 24px;
  background: oklch(from var(--grey-primary) l c h / 0.05);
  border-radius: 8px;
  border: 1px solid oklch(from var(--grey-primary) l c h / 0.1);
  margin-bottom: 24px;
}

.details-title {
  color: var(--grey-light);
  font-size: var(--font-v-big);
  font-weight: 700;
  margin: 0 0 16px 0;
}

.details-flex {
  display: flex;
  justify-content: space-between;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item label {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-x-small);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item span {
  color: white;
  font-size: var(--font-medium);
  font-weight: 500;
}

/* Chart shared styles */
.chart-container {
  padding: 0;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  margin-bottom: 12px;
}

.chart-title {
  color: white;
  font-size: var(--font-v-big);
  font-weight: 600;
  margin: 0;
}

.chart-total {
  color: var(--lime-primary);
  font-size: var(--font-x-big);
  font-weight: 700;
}

.chart-summary {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  padding: 24px 32px;
  border-top: 1px solid rgb(255, 255, 255);
  background: rgba(0, 0, 0, 0.165);
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-x-small);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  color: white;
  font-size: var(--font-medium);
  font-weight: 700;
  font-family: monospace;
}

/* Modal shared styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-header {
  position: static;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  color: white;
  margin: 0;
  font-size: var(--font-v-big);
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-x-big);
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

.modal-body {
  padding-left: 32px;
  padding-right: 32px;
}

/* Responsive adjustments for item chart modal */
@media (max-width: 768px) {
  .item-chart-modal {
    width: 95%;
    margin: 20px;
  }

  .slider-controls {
    flex-direction: column;
    gap: 24px;
  }

  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .table-header {
    display: none;
  }

  /* Mobile layout: combine item name and price history on same line */
  .table-row {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
  }

  .table-row .item-name {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
  }

  .table-row .price-history {
    position: absolute;
    right: 16px;
    top: 12px;
    width: 80px;
    padding: 0;
  }

  .table-row .mid-columns-wrap {
    width: 100%;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}

/* Empty State Section */
.empty-state-section {
  border-collapse: collapse;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.02);
}

.empty-state-content {
  padding: 32px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: var(--font-medium);
}

.highlighted-item {
  color: var(--lime-primary);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.highlighted-item:hover {
  color: oklch(from var(--lime-light) l c h / 0.8);
}
</style>
