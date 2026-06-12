<template>
  <div v-if="showItemChartModal" class="modal-overlay">
    <CustomScrollbar class="item-chart-modal" direction="both" max-height="90vh" @click.stop>
      <div class="modal-header">
        <h3>Inventory Items Chart</h3>
        <button class="close-btn" @click="closeItemChartModal">×</button>
      </div>

      <div class="modal-body">
        <div class="chart-container">
          <div class="chart-header">
            <h4 class="chart-title">Compare Inventory Items</h4>
            <div class="chart-toolbar">
              <CustomDropdown
                v-model="categoryFilter"
                :options="categoryFilterOptions"
                class="category-filter"
              />
              <button class="toolbar-btn" title="Manage and star stats" @click="openStatManagerModal">
                ★ Stats
              </button>
              <button
                class="toolbar-btn compare-btn"
                :disabled="selectedNames.size < 2"
                title="Compare the checked items side by side"
                @click="startComparison"
              >
                ⇄ Compare{{ selectedNames.size > 0 ? ` (${selectedNames.size})` : '' }}
              </button>
              <div class="chart-total">{{ sortedItems.length }} items</div>
            </div>
          </div>

          <div v-if="selectedNames.size > 1" class="bulk-bar">
            <span class="bulk-count">{{ selectedNames.size }} selected</span>
            <CustomDropdown v-model="bulkCategoryId" :options="categoryAssignOptions" class="bulk-dropdown" />
            <button class="toolbar-btn" @click="applyBulkCategory">Set category</button>
            <span class="bulk-divider"></span>
            <CustomDropdown v-model="bulkMergeTarget" :options="mergeTargetOptions" class="bulk-dropdown" />
            <button
              class="toolbar-btn merge-btn"
              title="Merge the selected items into the target — their names become aliases and all purchases are regrouped"
              @click="applyMerge"
            >⇒ Merge into target</button>
            <span v-if="bulkMessage" class="bulk-message">{{ bulkMessage }}</span>
          </div>

          <div class="item-comparison-table">
            <div class="table-header" :style="outerGridStyle">
              <div class="header-cell select-cell" @click.stop>
                <CustomsCheckbox
                  :model-value="allSelected"
                  size="small"
                  @update:model-value="toggleSelectAll"
                />
              </div>
              <div class="header-cell">Item</div>
              <div class="mid-columns-wrap" :style="midGridStyle">
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
                <div
                  v-for="stat in starredColumns"
                  :key="stat.id"
                  class="header-cell sortable"
                  @click="sortBy(`stat:${stat.id}`)"
                >
                  {{ stat.label }}
                  <span class="sort-arrow" :class="getSortArrowClass(`stat:${stat.id}`)"></span>
                </div>
              </div>
              <div class="header-cell">Price History</div>
            </div>

            <div
              v-for="item in sortedItems"
              :key="item.item.id"
              class="table-row"
              :class="{ 'selected-row': selectedChartItem === item }"
              :style="outerGridStyle"
              @click="selectedChartItem = item"
            >
              <div class="table-cell select-cell" @click.stop>
                <CustomsCheckbox
                  :model-value="selectedNames.has(item.itemName)"
                  size="small"
                  @update:model-value="toggleSelect(item.itemName)"
                />
              </div>
              <div class="table-cell item-name">
                <div class="item-avatar">
                  {{ item.itemName.charAt(0).toUpperCase() }}
                </div>
                <div class="item-name-content">
                  <span class="item-name-text">{{ item.itemName }}</span>
                  <span v-if="item.item.brand" class="item-brand">{{ item.item.brand }}</span>
                  <span
                    v-if="categoryOf(item.itemName)"
                    class="category-chip"
                    :style="{ borderColor: categoryOf(item.itemName)!.color, color: categoryOf(item.itemName)!.color }"
                  >{{ categoryOf(item.itemName)!.label }}</span>
                </div>
              </div>

              <div class="mid-columns-wrap" :style="midGridStyle">
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
              <div
                v-for="stat in starredColumns"
                :key="stat.id"
                class="table-cell stat-cell"
              >
                <span class="cell-value">{{ formatStatValue(statValueFor(item.itemName, stat.id), stat) }}</span>
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

            <div class="catalog-details">
              <div class="detail-item category-assign">
                <label>Category:</label>
                <CustomDropdown
                  :model-value="selectedCatalogItem?.categoryId || ''"
                  :options="categoryAssignOptions"
                  class="category-assign-dropdown"
                  @update:model-value="assignCategory"
                />
              </div>

              <div v-if="waterSuggestion !== null" class="water-suggestion">
                💧 Looks like a fruit — typical water content is {{ waterSuggestion }}%.
                <button class="suggestion-btn" @click="applyWaterSuggestion">Use {{ waterSuggestion }}%</button>
              </div>

              <div v-if="selectedCatalogItem" class="stats-editor">
                <span class="stats-editor-title">Stats</span>
                <div v-for="stat in storedStatDefs" :key="stat.id" class="stat-edit-row">
                  <label class="stat-edit-label">{{ stat.label }}<span v-if="stat.unit" class="stat-edit-unit"> ({{ stat.unit }})</span></label>
                  <input
                    type="number"
                    step="any"
                    class="stat-edit-field"
                    placeholder="—"
                    :value="selectedCatalogItem.stats[stat.id] ?? ''"
                    @change="saveStatValue(stat.id, $event)"
                  />
                </div>
              </div>

              <div v-if="selectedCatalogItem" class="aliases-editor">
                <span class="stats-editor-title">Aliases</span>
                <div class="alias-chips">
                  <span v-for="alias in selectedCatalogItem.aliases" :key="alias" class="alias-chip">
                    {{ alias }}
                    <button class="alias-remove" title="Remove alias" @click="removeAliasFromSelected(alias)">×</button>
                  </span>
                  <input
                    v-model="newAlias"
                    type="text"
                    class="alias-input"
                    placeholder="+ add alias (e.g. receipt name)"
                    @keyup.enter="addAliasToSelected"
                  />
                </div>
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
    </CustomScrollbar>

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
import { ref, computed, watch } from 'vue'

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
  getLastPurchases,
  type PriceHistoryData
} from '../../composables/payment-computables'

import {
  closeItemChartModal,
  openInventoryAddMenu,
  openStatManagerModal,
  openComparisonView,
  loadPayments
} from '../../composables/payment-handlers'

import {
  items,
  categories,
  starredStats,
  statDefinitions,
  itemByCanonicalName,
  categoryById
} from '../../stores/catalog.store'

import { computeStatValue, formatStatValue } from '../../services/stats.service'
import { suggestWaterContent } from '../../utils/food-defaults'
import { updateItem, addAlias, removeAlias, mergeItems } from '../../repositories/item.repository'
import { ComparisonCategory } from '../../types/catalog.types'

import PriceHistoryChart from './PriceHistoryChart.vue'
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import FullscreenChartModal from './FullscreenChartModal.vue'
import HoverText from '../primitives/hoverText.vue'
import CustomDropdown from '../primitives/CustomDropdown.vue'
import CustomsCheckbox from '../primitives/CustomsCheckbox.vue'

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

// --- Selection (comparison + bulk operations) ---
const selectedNames = ref<Set<string>>(new Set())

const toggleSelect = (itemName: string) => {
  const next = new Set(selectedNames.value)
  if (next.has(itemName)) {
    next.delete(itemName)
  } else {
    next.add(itemName)
  }
  selectedNames.value = next
}

const allSelected = computed(() => {
  return sortedItems.value.length > 0 && sortedItems.value.every(i => selectedNames.value.has(i.itemName))
})

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedNames.value = new Set()
  } else {
    selectedNames.value = new Set(sortedItems.value.map(i => i.itemName))
  }
}

const startComparison = () => {
  if (selectedNames.value.size >= 2) {
    openComparisonView([...selectedNames.value])
  }
}

// --- Bulk editing of selected items ---
const bulkCategoryId = ref('')
const bulkMergeTarget = ref('')
const bulkMessage = ref('')

const mergeTargetOptions = computed(() => {
  return [...selectedNames.value].map(name => ({ value: name, label: name }))
})

watch(selectedNames, names => {
  if (!names.has(bulkMergeTarget.value)) {
    bulkMergeTarget.value = [...names][0] ?? ''
  }
  bulkMessage.value = ''
})

const applyBulkCategory = async () => {
  for (const name of selectedNames.value) {
    const catalogItem = itemByCanonicalName.value.get(name)
    if (!catalogItem) continue
    try {
      const updated = await updateItem({ ...catalogItem, categoryId: bulkCategoryId.value || undefined })
      replaceItemInStore(updated)
    } catch (error) {
      console.error(`Error setting category on "${name}":`, error)
    }
  }
  bulkMessage.value = 'Category applied'
}

const applyMerge = async () => {
  const target = itemByCanonicalName.value.get(bulkMergeTarget.value)
  if (!target) return
  const sourceIds = [...selectedNames.value]
    .filter(name => name !== target.name)
    .map(name => itemByCanonicalName.value.get(name)?.id)
    .filter((id): id is string => !!id)
  if (sourceIds.length === 0) return

  try {
    const { target: merged, paymentsRenamed } = await mergeItems(sourceIds, target.id)
    items.value = items.value
      .filter(i => !sourceIds.includes(i.id))
      .map(i => i.id === merged.id ? merged : i)
    // The server rewrote payments' itemNames — refresh them
    await loadPayments()
    selectedNames.value = new Set([merged.name])
    bulkMessage.value = `Merged — ${paymentsRenamed} purchase(s) regrouped`
  } catch (error) {
    console.error('Error merging items:', error)
    bulkMessage.value = 'Merge failed'
  }
}

// --- Category filter ("apples to apples" mode) ---
const categoryFilter = ref('')

const categoryFilterOptions = computed(() => ([
  { value: '', label: 'All categories' },
  ...categories.value.map(c => ({ value: c.id, label: c.label })),
]))

const categoryOf = (itemName: string): ComparisonCategory | undefined => {
  const catalogItem = itemByCanonicalName.value.get(itemName)
  return catalogItem?.categoryId ? categoryById.value.get(catalogItem.categoryId) : undefined
}

const visibleItems = computed(() => {
  if (!categoryFilter.value) return itemChartItems.value
  return itemChartItems.value.filter(item => {
    return itemByCanonicalName.value.get(item.itemName)?.categoryId === categoryFilter.value
  })
})

// --- Starred stat columns ---
const MAX_STAT_COLUMNS = 5
const starredColumns = computed(() => starredStats.value.slice(0, MAX_STAT_COLUMNS))

const statValueFor = (itemName: string, statId: string): number | null => {
  const stat = statDefinitions.value.find(s => s.id === statId)
  if (!stat) return null
  const catalogItem = itemByCanonicalName.value.get(itemName)
  const purchases = getLastPurchases.value(itemName, '')
  return computeStatValue(stat, catalogItem, purchases)
}

// Grids grow with the starred stat columns (overrides the static CSS)
const outerGridStyle = computed(() => ({
  gridTemplateColumns: '32px 18% minmax(0, 1fr) 110px',
}))

const midGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${4 + starredColumns.value.length}, minmax(0, 1fr))`,
}))

// Computed property for sorted items
const sortedItems = computed(() => {
  if (!sortField.value) return visibleItems.value

  return [...visibleItems.value].sort((a, b) => {
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
        if (sortField.value.startsWith('stat:')) {
          const statId = sortField.value.slice(5)
          aValue = statValueFor(a.itemName, statId) ?? Number.NEGATIVE_INFINITY
          bValue = statValueFor(b.itemName, statId) ?? Number.NEGATIVE_INFINITY
          break
        }
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

// --- Catalog editing for the selected item (category, stats, aliases) ---
const selectedCatalogItem = computed(() => {
  if (!selectedChartItem.value) return undefined
  return itemByCanonicalName.value.get(selectedChartItem.value.itemName)
})

const categoryAssignOptions = computed(() => ([
  { value: '', label: 'No category' },
  ...categories.value.map(c => ({ value: c.id, label: c.label })),
]))

const replaceItemInStore = (updated: typeof items.value[number]) => {
  items.value = items.value.map(i => i.id === updated.id ? updated : i)
}

const assignCategory = async (categoryId: string | number) => {
  const catalogItem = selectedCatalogItem.value
  if (!catalogItem) return
  try {
    const updated = await updateItem({ ...catalogItem, categoryId: String(categoryId) || undefined })
    replaceItemInStore(updated)
  } catch (error) {
    console.error('Error assigning category:', error)
  }
}

// Stored (non-derived) stats are editable per item
const storedStatDefs = computed(() => statDefinitions.value.filter(s => !s.derived))

const saveStatValue = async (statId: string, event: Event) => {
  const catalogItem = selectedCatalogItem.value
  if (!catalogItem) return
  const raw = (event.target as HTMLInputElement).value.trim()
  const newStats = { ...catalogItem.stats }
  if (raw === '') {
    delete newStats[statId]
  } else {
    const parsed = parseFloat(raw)
    if (Number.isNaN(parsed)) return
    newStats[statId] = parsed
  }
  try {
    const updated = await updateItem({ ...catalogItem, stats: newStats })
    replaceItemInStore(updated)
  } catch (error) {
    console.error('Error saving stat value:', error)
  }
}

// Suggest a default water content when a fruit has none recorded yet
const waterSuggestion = computed(() => {
  const catalogItem = selectedCatalogItem.value
  if (!catalogItem) return null
  if (catalogItem.categoryId !== 'fruit') return null
  if (catalogItem.stats['water-content'] !== undefined) return null
  return suggestWaterContent(catalogItem.name)
})

const applyWaterSuggestion = async () => {
  const catalogItem = selectedCatalogItem.value
  if (!catalogItem || waterSuggestion.value === null) return
  try {
    const updated = await updateItem({
      ...catalogItem,
      stats: { ...catalogItem.stats, 'water-content': waterSuggestion.value },
    })
    replaceItemInStore(updated)
  } catch (error) {
    console.error('Error applying water content suggestion:', error)
  }
}

// --- Alias management for the selected item ---
const newAlias = ref('')

const addAliasToSelected = async () => {
  const catalogItem = selectedCatalogItem.value
  const alias = newAlias.value.trim()
  if (!catalogItem || !alias) return
  try {
    const updated = await addAlias(catalogItem.id, alias)
    replaceItemInStore(updated)
    newAlias.value = ''
  } catch (error) {
    console.error('Error adding alias:', error)
  }
}

const removeAliasFromSelected = async (alias: string) => {
  const catalogItem = selectedCatalogItem.value
  if (!catalogItem) return
  try {
    const updated = await removeAlias(catalogItem.id, alias)
    replaceItemInStore(updated)
  } catch (error) {
    console.error('Error removing alias:', error)
  }
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

/* Toolbar (category filter, stats, compare) */
.chart-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.category-filter {
  min-width: 150px;
}

.toolbar-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 7px 12px;
  font-size: var(--font-x-small);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar-btn:hover:not(:disabled) {
  border-color: var(--lime-primary);
  color: var(--lime-light);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.compare-btn:not(:disabled) {
  background: oklch(from var(--lime-primary) l c h / 0.15);
  border-color: var(--lime-primary);
  color: var(--lime-light);
}

/* Bulk edit bar */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  padding: 10px 14px;
  background: oklch(from var(--lime-primary) l c h / 0.08);
  border: 1px solid oklch(from var(--lime-primary) l c h / 0.35);
  border-radius: 8px;
}

.bulk-count {
  color: var(--lime-light);
  font-size: var(--font-x-small);
  font-weight: 700;
  white-space: nowrap;
}

.bulk-dropdown {
  min-width: 150px;
}

.bulk-divider {
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.15);
}

.merge-btn:hover {
  border-color: #fbbf24 !important;
  color: #fbbf24 !important;
}

.bulk-message {
  color: var(--lime-light);
  font-size: var(--font-x-small);
}

/* Selection checkboxes */
.select-cell {
  justify-content: center;
  padding: 0;
}

/* Category chip on item rows */
.category-chip {
  font-size: var(--font-x-small);
  border: 1px solid;
  border-radius: 10px;
  padding: 0 8px;
  width: fit-content;
}

/* Stat columns */
.stat-cell .cell-value {
  font-family: monospace;
}

/* Catalog editing (category, stats, aliases) in selected item details */
.catalog-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.category-assign {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-assign-dropdown {
  min-width: 170px;
}

.water-suggestion {
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.4);
  color: #93c5fd;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: var(--font-x-small);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.suggestion-btn {
  background: rgba(96, 165, 250, 0.2);
  border: 1px solid rgba(96, 165, 250, 0.6);
  color: #bfdbfe;
  border-radius: 4px;
  padding: 3px 10px;
  font-size: var(--font-x-small);
  cursor: pointer;
  transition: background 0.2s ease;
}

.suggestion-btn:hover {
  background: rgba(96, 165, 250, 0.35);
}

.stats-editor,
.aliases-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-editor-title {
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.stat-edit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: 360px;
}

.stat-edit-label {
  color: rgba(255, 255, 255, 0.75);
  font-size: var(--font-small);
}

.stat-edit-unit {
  color: rgba(255, 255, 255, 0.4);
  font-size: var(--font-x-small);
}

.stat-edit-field {
  width: 100px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  font-family: monospace;
  font-size: var(--font-small);
}

.stat-edit-field:focus {
  outline: none;
  border-color: var(--lime-primary);
}

.alias-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.alias-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 2px 4px 2px 10px;
  font-size: var(--font-x-small);
  color: rgba(255, 255, 255, 0.85);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.alias-remove {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  font-size: 12px;
  padding: 0 4px;
}

.alias-remove:hover {
  color: #f87171;
}

.alias-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  padding: 3px 10px;
  font-size: var(--font-x-small);
  min-width: 200px;
}

.alias-input:focus {
  outline: none;
  border-color: var(--lime-primary);
  border-style: solid;
}
</style>
