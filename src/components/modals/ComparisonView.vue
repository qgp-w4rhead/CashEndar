<template>
  <div v-if="showComparisonView" class="modal-overlay comparison-overlay">
    <CustomScrollbar class="comparison-modal" direction="both" max-height="90vh" @click.stop>
      <div class="modal-header">
        <h3>Compare Items</h3>
        <button class="close-btn" @click="closeComparisonView">×</button>
      </div>

      <div class="modal-body">
        <div class="comparison-toolbar">
          <div class="basis-switcher">
            <span class="toolbar-label">Normalize:</span>
            <button
              v-for="basis in basisOptions"
              :key="basis"
              class="basis-btn"
              :class="{ active: selectedBasis === basis }"
              @click="selectedBasis = basis"
            >
              {{ STAT_BASIS_LABELS[basis] }}
            </button>
          </div>
          <div v-if="isCrossCategory" class="cross-category-badge">
            ⚠ Different categories — compared as {{ STAT_BASIS_LABELS[selectedBasis] }}
          </div>
        </div>

        <div class="comparison-table">
          <div class="comparison-grid" :style="gridStyle">
            <!-- Header row: item columns -->
            <div class="grid-cell corner-cell">Stat</div>
            <div v-for="column in columns" :key="column.name" class="grid-cell item-header">
              <span class="item-header-name">{{ column.name }}</span>
              <span v-if="column.brand" class="item-header-brand">{{ column.brand }}</span>
              <span
                v-if="column.category"
                class="category-chip"
                :style="{ borderColor: column.category.color, color: column.category.color }"
              >{{ column.category.label }}</span>
            </div>

            <!-- Normalized price row (always shown) -->
            <div class="grid-cell stat-label-cell highlight" @click="chartedStatId = PRICE_ROW_ID">
              Price {{ STAT_BASIS_LABELS[selectedBasis] }}
              <span class="chart-hint">📊</span>
            </div>
            <div
              v-for="column in columns"
              :key="`price-${column.name}`"
              class="grid-cell value-cell"
              :class="{ 'best-value': column.normalizedPrice !== null && column.normalizedPrice === bestPrice }"
            >
              {{ column.normalizedPrice !== null ? `$${column.normalizedPrice.toFixed(2)}` : '—' }}
            </div>

            <!-- One row per displayed stat -->
            <template v-for="stat in displayedStats" :key="stat.id">
              <div class="grid-cell stat-label-cell" @click="chartedStatId = stat.id">
                <span class="stat-star" :class="{ starred: stat.starred }" @click.stop="toggleStar(stat)">★</span>
                {{ stat.label }}
                <span v-if="stat.unit" class="stat-unit">({{ stat.unit }})</span>
                <span class="chart-hint">📊</span>
              </div>
              <div
                v-for="column in columns"
                :key="`${stat.id}-${column.name}`"
                class="grid-cell value-cell"
                :class="{ editable: !stat.derived }"
                @click="!stat.derived && startEditing(stat, column)"
              >
                <input
                  v-if="isEditing(stat, column)"
                  :ref="el => focusInput(el)"
                  v-model="editingValue"
                  type="number"
                  step="any"
                  class="stat-edit-input"
                  @keyup.enter="commitEdit(stat, column)"
                  @keyup.esc.stop="cancelEdit"
                  @blur="commitEdit(stat, column)"
                  @click.stop
                />
                <span v-else>{{ formatStatValue(column.statValues[stat.id] ?? null, stat) }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Bar chart of the selected stat across items -->
        <div v-if="chartedBars.length > 0" class="comparison-chart-section">
          <h4 class="section-title">{{ chartedStatLabel }}</h4>
          <StatBarChart :bars="chartedBars" />
        </div>

        <div class="comparison-hint">
          Click a stat name to chart it. Click a value to edit stored stats. ★ stars a stat into your personal list.
        </div>
      </div>
    </CustomScrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showComparisonView, comparisonItemNames } from '../../stores/ui-state.store'
import { itemByCanonicalName, categoryById, statDefinitions, starredStats } from '../../stores/catalog.store'
import { closeComparisonView } from '../../composables/payment-handlers'
import { getLastPurchases } from '../../composables/payment-computables'
import { StatBasis, STAT_BASIS_LABELS, StatDefinition, ComparisonCategory } from '../../types/catalog.types'
import { computeStatValue, normalizedPrice, formatStatValue } from '../../services/stats.service'
import { updateStatDefinition } from '../../repositories/stat-definition.repository'
import { updateItem } from '../../repositories/item.repository'
import { items } from '../../stores/catalog.store'
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import StatBarChart, { StatBar } from '../dashboard/StatBarChart.vue'

const PRICE_ROW_ID = '__price__'

const basisOptions: StatBasis[] = ['perPortion', 'per100g', 'perUnit']
const selectedBasis = ref<StatBasis>('per100g')
const chartedStatId = ref<string>(PRICE_ROW_ID)

interface ComparisonColumn {
  name: string
  brand?: string
  category?: ComparisonCategory
  normalizedPrice: number | null
  statValues: Record<string, number | null>
}

// Default the basis to the first compared item's category preference
watch(comparisonItemNames, (names) => {
  if (names.length === 0) return
  const firstItem = itemByCanonicalName.value.get(names[0])
  const category = firstItem?.categoryId ? categoryById.value.get(firstItem.categoryId) : undefined
  if (category) selectedBasis.value = category.defaultBasis
  chartedStatId.value = PRICE_ROW_ID
}, { immediate: true })

const columns = computed<ComparisonColumn[]>(() => {
  return comparisonItemNames.value.map(name => {
    const catalogItem = itemByCanonicalName.value.get(name)
    const purchases = getLastPurchases.value(name, '') // newest first
    const category = catalogItem?.categoryId ? categoryById.value.get(catalogItem.categoryId) : undefined

    const statValues: Record<string, number | null> = {}
    statDefinitions.value.forEach(stat => {
      statValues[stat.id] = computeStatValue(stat, catalogItem, purchases)
    })

    let price: number | null = null
    for (const purchase of purchases) {
      price = normalizedPrice(purchase, selectedBasis.value)
      if (price !== null) break
    }

    return {
      name,
      brand: purchases[0]?.brand,
      category,
      normalizedPrice: price,
      statValues,
    }
  })
})

const isCrossCategory = computed(() => {
  const categoryIds = new Set(columns.value.map(c => c.category?.id ?? 'none'))
  return categoryIds.size > 1
})

const bestPrice = computed(() => {
  const prices = columns.value.map(c => c.normalizedPrice).filter((p): p is number => p !== null)
  return prices.length > 0 ? Math.min(...prices) : null
})

// Starred stats first, then any other stat with a value for at least one
// item. Water content always shows when a fruit is being compared.
const displayedStats = computed<StatDefinition[]>(() => {
  const result: StatDefinition[] = []
  const seen = new Set<string>()

  const include = (stat: StatDefinition) => {
    if (!seen.has(stat.id)) {
      seen.add(stat.id)
      result.push(stat)
    }
  }

  starredStats.value.forEach(include)

  const hasFruit = columns.value.some(c => c.category?.id === 'fruit')
  if (hasFruit) {
    const water = statDefinitions.value.find(s => s.id === 'water-content')
    if (water) include(water)
  }

  statDefinitions.value.forEach(stat => {
    const hasValue = columns.value.some(c => c.statValues[stat.id] !== null)
    if (hasValue) include(stat)
  })

  return result
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `minmax(160px, 1.2fr) repeat(${columns.value.length}, minmax(110px, 1fr))`,
}))

// --- Charting ---
const chartedStatLabel = computed(() => {
  if (chartedStatId.value === PRICE_ROW_ID) {
    return `Price ${STAT_BASIS_LABELS[selectedBasis.value]}`
  }
  return statDefinitions.value.find(s => s.id === chartedStatId.value)?.label ?? ''
})

const chartedBars = computed<StatBar[]>(() => {
  if (chartedStatId.value === PRICE_ROW_ID) {
    return columns.value
      .filter(c => c.normalizedPrice !== null)
      .map(c => ({
        label: c.name,
        value: c.normalizedPrice as number,
        formatted: `$${(c.normalizedPrice as number).toFixed(2)}`,
      }))
  }
  const stat = statDefinitions.value.find(s => s.id === chartedStatId.value)
  if (!stat) return []
  return columns.value
    .filter(c => c.statValues[stat.id] !== null && c.statValues[stat.id] !== undefined)
    .map(c => ({
      label: c.name,
      value: c.statValues[stat.id] as number,
      formatted: formatStatValue(c.statValues[stat.id] ?? null, stat),
    }))
})

// --- Star toggling ---
const toggleStar = async (stat: StatDefinition) => {
  try {
    const updated = await updateStatDefinition({ ...stat, starred: !stat.starred })
    statDefinitions.value = statDefinitions.value.map(s => s.id === updated.id ? updated : s)
  } catch (error) {
    console.error('Error toggling star:', error)
  }
}

// --- Inline editing of stored stat values ---
const editingKey = ref<string | null>(null)
const editingValue = ref<string>('')

const isEditing = (stat: StatDefinition, column: ComparisonColumn) => {
  return editingKey.value === `${stat.id}|${column.name}`
}

const startEditing = (stat: StatDefinition, column: ComparisonColumn) => {
  editingKey.value = `${stat.id}|${column.name}`
  const current = column.statValues[stat.id]
  editingValue.value = current !== null && current !== undefined ? String(current) : ''
}

const cancelEdit = () => {
  editingKey.value = null
  editingValue.value = ''
}

const commitEdit = async (stat: StatDefinition, column: ComparisonColumn) => {
  if (!isEditing(stat, column)) return
  const raw = editingValue.value.trim()
  cancelEdit()

  const catalogItem = itemByCanonicalName.value.get(column.name)
  if (!catalogItem) return

  const newStats = { ...catalogItem.stats }
  if (raw === '') {
    delete newStats[stat.id]
  } else {
    const parsed = parseFloat(raw)
    if (Number.isNaN(parsed)) return
    if (newStats[stat.id] === parsed) return
    newStats[stat.id] = parsed
  }

  try {
    const updated = await updateItem({ ...catalogItem, stats: newStats })
    items.value = items.value.map(i => i.id === updated.id ? updated : i)
  } catch (error) {
    console.error('Error saving stat value:', error)
  }
}

const focusInput = (el: unknown) => {
  if (el instanceof HTMLInputElement) el.focus()
}
</script>

<style scoped>
.comparison-overlay {
  z-index: 1100;
}

.comparison-modal {
  background: linear-gradient(135deg, var(--grey-dark) 0%, oklch(from var(--grey-primary) l c h / 0.5) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  width: 95%;
  max-width: 900px;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-100px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: var(--font-medium);
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: white;
}

.modal-body {
  padding: 20px 24px;
}

.comparison-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-label {
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-right: 8px;
}

.basis-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
}

.basis-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: var(--font-x-small);
  cursor: pointer;
  transition: all 0.2s ease;
}

.basis-btn:hover {
  border-color: var(--lime-primary);
}

.basis-btn.active {
  background: oklch(from var(--lime-primary) l c h / 0.2);
  border-color: var(--lime-primary);
  color: var(--lime-light);
}

.cross-category-badge {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #fbbf24;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: var(--font-x-small);
  font-weight: 500;
}

.comparison-grid {
  display: grid;
  gap: 1px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
}

.grid-cell {
  background: rgba(30, 30, 30, 0.9);
  padding: 10px 12px;
  color: white;
  font-size: var(--font-small);
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
}

.corner-cell {
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.item-header-name {
  font-weight: 700;
  color: white;
}

.item-header-brand {
  font-size: var(--font-x-small);
  color: rgba(255, 255, 255, 0.6);
}

.category-chip {
  font-size: var(--font-x-small);
  border: 1px solid;
  border-radius: 10px;
  padding: 1px 8px;
}

.stat-label-cell {
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

.stat-label-cell:hover {
  color: var(--lime-light);
}

.stat-label-cell.highlight {
  color: var(--lime-light);
  font-weight: 600;
}

.chart-hint {
  opacity: 0;
  font-size: var(--font-x-small);
  transition: opacity 0.2s ease;
  margin-left: auto;
}

.stat-label-cell:hover .chart-hint {
  opacity: 0.8;
}

.stat-unit {
  color: rgba(255, 255, 255, 0.45);
  font-size: var(--font-x-small);
}

.stat-star {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.25);
  transition: color 0.2s ease;
}

.stat-star:hover {
  color: #fbbf24;
}

.stat-star.starred {
  color: #fbbf24;
}

.value-cell {
  font-family: monospace;
  color: rgba(255, 255, 255, 0.85);
  justify-content: flex-end;
}

.value-cell.editable {
  cursor: pointer;
}

.value-cell.editable:hover {
  background: rgba(255, 255, 255, 0.05);
}

.value-cell.best-value {
  color: var(--lime-light);
  font-weight: 700;
}

.stat-edit-input {
  width: 80px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--lime-primary);
  border-radius: 4px;
  color: white;
  padding: 2px 6px;
  font-family: monospace;
  font-size: var(--font-small);
}

.comparison-chart-section {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.section-title {
  margin: 0 0 12px;
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.comparison-hint {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-size: var(--font-x-small);
}
</style>
