<template>
  <div class="review-grid">
    <!-- Receipt header info -->
    <div class="receipt-meta">
      <div class="meta-field">
        <label>Store</label>
        <input v-model="store" type="text" class="meta-input" placeholder="Unknown store" />
      </div>
      <div class="meta-field">
        <label>Date</label>
        <input v-model="date" type="date" class="meta-input" />
      </div>
      <div class="meta-field">
        <label>Receipt total</label>
        <div class="total-check">
          <span class="total-value">{{ receipt.total !== undefined ? `$${receipt.total.toFixed(2)}` : '—' }}</span>
          <HoverText v-if="receipt.sumMatchesTotal !== null" :text="receipt.sumMatchesTotal ? 'Line items add up to the receipt total' : `Line items sum to $${includedSum.toFixed(2)} — review for missed or wrong lines`">
            <span class="sum-indicator" :class="receipt.sumMatchesTotal ? 'sum-ok' : 'sum-bad'">
              {{ receipt.sumMatchesTotal ? '✓' : '⚠' }}
            </span>
          </HoverText>
        </div>
      </div>
      <div class="meta-field">
        <label>Included</label>
        <span class="total-value">{{ includedRows.length }} / {{ rows.length }} lines · ${{ includedSum.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Bulk bar -->
    <div v-if="selectedRows.length > 1" class="bulk-bar">
      <span class="bulk-count">{{ selectedRows.length }} selected</span>
      <CustomDropdown
        v-model="bulkType"
        :options="typeOptions"
        class="bulk-type-dropdown"
      />
      <button class="bulk-btn" @click="applyBulkType">Set type</button>
      <button class="bulk-btn" @click="excludeSelected">Exclude</button>
      <button class="bulk-btn" @click="includeSelected">Include</button>
      <input
        v-model="bulkName"
        type="text"
        class="bulk-name-input"
        placeholder="Rename all selected to…"
        :list="datalistId"
        @keyup.enter="applyBulkName"
      />
      <button class="bulk-btn" :disabled="!bulkName.trim()" @click="applyBulkName">Merge names</button>
    </div>

    <!-- Line items -->
    <div class="grid-table">
      <div class="grid-header">
        <span class="col-select" @click.stop>
          <CustomsCheckbox :model-value="allSelected" size="small" @update:model-value="toggleSelectAll" />
        </span>
        <span>OCR text</span>
        <span>Item name</span>
        <span class="col-num">Qty</span>
        <span class="col-num">Unit $</span>
        <span class="col-num">Total $</span>
        <span>Type</span>
        <span class="col-num">Skip</span>
      </div>

      <div
        v-for="row in rows"
        :key="row.id"
        class="grid-row"
        :class="{ excluded: row.excluded, discount: row.isDiscount }"
      >
        <span class="col-select" @click.stop>
          <CustomsCheckbox :model-value="row.selected" size="small" @update:model-value="row.selected = !row.selected" />
        </span>

        <span class="raw-name" :title="row.rawName">{{ row.rawName }}</span>

        <span class="name-cell">
          <input
            v-model="row.name"
            type="text"
            class="name-input"
            :list="datalistId"
            @input="row.suggestionAccepted = null"
          />
          <span v-if="row.suggestion && row.suggestionAccepted === null" class="alias-suggestion">
            → {{ row.suggestion.item.name }} ({{ Math.round(row.suggestion.score * 100) }}%)
            <button class="chip-btn accept" title="Use this item and remember the receipt name as an alias" @click="acceptSuggestion(row)">✓ link</button>
            <button class="chip-btn reject" title="Keep as a new item" @click="row.suggestionAccepted = false">✗</button>
          </span>
          <span v-else-if="row.suggestionAccepted === true" class="alias-linked">
            aliased to {{ row.suggestion?.item.name }}
          </span>
        </span>

        <input v-model.number="row.quantity" type="number" min="1" step="1" class="num-input" />
        <input v-model.number="row.unitPrice" type="number" step="any" class="num-input" />
        <input v-model.number="row.lineTotal" type="number" step="any" class="num-input" />

        <CustomDropdown v-model="row.type" :options="typeOptions" class="type-dropdown" />

        <span class="col-num" @click.stop>
          <CustomsCheckbox :model-value="row.excluded" size="small" @update:model-value="row.excluded = !row.excluded" />
        </span>
      </div>
    </div>

    <datalist :id="datalistId">
      <option v-for="item in items" :key="item.id" :value="item.name" />
    </datalist>

    <div class="review-footer">
      <button class="footer-btn cancel" @click="emit('cancel')">Back</button>
      <span v-if="saveError" class="save-error">{{ saveError }}</span>
      <button class="footer-btn confirm" :disabled="saving || includedRows.length === 0" @click="saveAll">
        {{ saving ? 'Saving…' : `Add ${includedRows.length} purchase${includedRows.length === 1 ? '' : 's'}` }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ParsedReceipt } from '../../types/ocr.types'
import { Payment } from '../../types/payment.types'
import { payments, paymentTypes } from '../../stores/ui-state.store'
import { items, aliasLookup } from '../../stores/catalog.store'
import { normalizeName, suggestAliasMatches, AliasSuggestion } from '../../services/alias.service'
import { addPayment } from '../../repositories/payment.repository'
import { addItem, addAlias } from '../../repositories/item.repository'

const props = defineProps<{
  receipt: ParsedReceipt
}>()

const emit = defineEmits<{
  cancel: []
  done: [count: number]
}>()

const datalistId = `catalog-items-${Math.random().toString(36).slice(2)}`

interface ReviewRow {
  id: number
  rawName: string
  name: string
  quantity: number
  unitPrice: number | null
  lineTotal: number
  type: string
  excluded: boolean
  isDiscount: boolean
  suggestion: AliasSuggestion | null
  suggestionAccepted: boolean | null // null = undecided
  selected: boolean
}

const store = ref(props.receipt.store ?? '')
const date = ref(props.receipt.date ?? new Date().toISOString().slice(0, 10))

const buildRows = (): ReviewRow[] => {
  return props.receipt.lines.map((line, index) => {
    const resolvedExactly = aliasLookup.value.has(normalizeName(line.rawName))
    const canonical = resolvedExactly ? aliasLookup.value.get(normalizeName(line.rawName))! : null
    const suggestion = !resolvedExactly && !line.isDiscount
      ? (suggestAliasMatches(line.rawName, items.value)[0] ?? null)
      : null

    return {
      id: index,
      rawName: line.rawName,
      name: canonical ?? line.rawName,
      quantity: line.quantity,
      unitPrice: line.unitPrice ?? null,
      lineTotal: line.lineTotal,
      type: 'inventory',
      excluded: !!line.isDiscount, // discounts are receipt plumbing by default
      isDiscount: !!line.isDiscount,
      suggestion,
      suggestionAccepted: null,
      selected: false,
    }
  })
}

const rows = ref<ReviewRow[]>(buildRows())

const includedRows = computed(() => rows.value.filter(row => !row.excluded))
const selectedRows = computed(() => rows.value.filter(row => row.selected))
const includedSum = computed(() => includedRows.value.reduce((sum, row) => sum + (row.lineTotal || 0), 0))

const allSelected = computed(() => rows.value.length > 0 && rows.value.every(row => row.selected))
const toggleSelectAll = () => {
  const target = !allSelected.value
  rows.value.forEach(row => { row.selected = target })
}

// Earning types make no sense on a bill
const typeOptions = computed(() => paymentTypes.value
  .filter(type => !type.isEarning)
  .map(type => ({ value: type.value, label: type.label })))

const acceptSuggestion = (row: ReviewRow) => {
  if (!row.suggestion) return
  row.name = row.suggestion.item.name
  row.suggestionAccepted = true
}

// --- Bulk actions ---
const bulkType = ref('inventory')
const bulkName = ref('')

const applyBulkType = () => {
  selectedRows.value.forEach(row => { row.type = bulkType.value })
}

const excludeSelected = () => {
  selectedRows.value.forEach(row => { row.excluded = true })
}

const includeSelected = () => {
  selectedRows.value.forEach(row => { row.excluded = false })
}

const applyBulkName = () => {
  const name = bulkName.value.trim()
  if (!name) return
  selectedRows.value.forEach(row => {
    row.name = name
    row.suggestionAccepted = row.suggestion ? false : null
  })
  bulkName.value = ''
}

// --- Saving ---
const saving = ref(false)
const saveError = ref('')

const saveAll = async () => {
  saving.value = true
  saveError.value = ''
  try {
    const createdPayments: Payment[] = []
    const lookup = new Map(aliasLookup.value)

    for (const row of includedRows.value) {
      const finalName = row.name.trim()
      if (!finalName) continue

      // Remember the receipt spelling as an alias of the linked item
      if (row.suggestionAccepted === true && row.suggestion) {
        try {
          const updated = await addAlias(row.suggestion.item.id, row.rawName)
          items.value = items.value.map(i => i.id === updated.id ? updated : i)
          lookup.set(normalizeName(row.rawName), updated.name)
        } catch (error) {
          console.warn('Could not store alias:', error)
        }
      } else if (!lookup.has(normalizeName(finalName))) {
        // Brand-new article: create its catalog item
        try {
          const created = await addItem({ name: finalName, aliases: finalName === row.rawName ? [] : [row.rawName] })
          items.value = [...items.value, created]
          lookup.set(normalizeName(finalName), created.name)
        } catch (error) {
          console.warn('Could not create catalog item:', error)
        }
      }

      const quantity = row.quantity && row.quantity > 0 ? row.quantity : 1
      const amount = Math.abs(row.lineTotal || 0)
      const payment: Payment = {
        id: '',
        title: finalName,
        amount: `$${amount.toFixed(2)}`,
        date: date.value,
        type: row.type,
        frequency: 'one-time',
        itemName: finalName,
        quantity,
        unitCost: row.unitPrice ?? (amount / quantity),
      }
      createdPayments.push(await addPayment(payment))
    }

    payments.value = [...payments.value, ...createdPayments]
    emit('done', createdPayments.length)
  } catch (error) {
    console.error('Error saving scanned purchases:', error)
    saveError.value = error instanceof Error ? error.message : 'Failed to save purchases'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.review-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Receipt meta */
.receipt-meta {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.meta-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-field label {
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: white;
  padding: 6px 10px;
  font-size: var(--font-small);
  color-scheme: dark;
}

.meta-input:focus {
  outline: none;
  border-color: var(--lime-primary);
}

.total-check {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-value {
  color: white;
  font-family: monospace;
  font-size: var(--font-small);
  padding: 6px 0;
}

.sum-indicator {
  font-weight: 700;
}

.sum-ok {
  color: var(--lime-light);
}

.sum-bad {
  color: #fbbf24;
}

/* Bulk bar */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: oklch(from var(--lime-primary) l c h / 0.08);
  border: 1px solid oklch(from var(--lime-primary) l c h / 0.35);
  border-radius: 8px;
}

.bulk-count {
  color: var(--lime-light);
  font-size: var(--font-x-small);
  font-weight: 700;
}

.bulk-type-dropdown {
  min-width: 130px;
}

.bulk-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.85);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: var(--font-x-small);
  cursor: pointer;
  transition: all 0.2s ease;
}

.bulk-btn:hover:not(:disabled) {
  border-color: var(--lime-primary);
  color: var(--lime-light);
}

.bulk-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bulk-name-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: white;
  padding: 5px 10px;
  font-size: var(--font-x-small);
  min-width: 180px;
}

/* Grid */
.grid-table {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.grid-header,
.grid-row {
  display: grid;
  grid-template-columns: 34px minmax(90px, 0.9fr) minmax(160px, 1.6fr) 56px 70px 70px minmax(110px, 0.8fr) 44px;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
}

.grid-header {
  background: rgba(255, 255, 255, 0.05);
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.grid-row {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.015);
}

.grid-row.excluded {
  opacity: 0.45;
}

.grid-row.discount .raw-name {
  color: #f87171;
}

.col-select {
  display: flex;
  justify-content: center;
}

.col-num {
  text-align: center;
}

.raw-name {
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
  font-size: var(--font-x-small);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.name-input,
.num-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: white;
  padding: 5px 8px;
  font-size: var(--font-x-small);
  width: 100%;
  box-sizing: border-box;
}

.num-input {
  font-family: monospace;
  text-align: right;
}

.name-input:focus,
.num-input:focus {
  outline: none;
  border-color: var(--lime-primary);
}

.alias-suggestion {
  color: #fbbf24;
  font-size: var(--font-x-small);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.alias-linked {
  color: var(--lime-light);
  font-size: var(--font-x-small);
}

.chip-btn {
  border-radius: 4px;
  border: 1px solid;
  background: transparent;
  font-size: var(--font-x-small);
  padding: 1px 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.chip-btn.accept {
  border-color: var(--lime-primary);
  color: var(--lime-light);
}

.chip-btn.accept:hover {
  background: oklch(from var(--lime-primary) l c h / 0.2);
}

.chip-btn.reject {
  border-color: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.6);
}

.chip-btn.reject:hover {
  border-color: #f87171;
  color: #f87171;
}

.type-dropdown {
  min-width: 0;
}

/* Footer */
.review-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.save-error {
  color: #f87171;
  font-size: var(--font-x-small);
  flex: 1;
  text-align: right;
}

.footer-btn {
  border-radius: 8px;
  padding: 10px 18px;
  font-size: var(--font-small);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.footer-btn.cancel {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
}

.footer-btn.confirm {
  background: oklch(from var(--lime-primary) l c h / 0.25);
  border-color: var(--lime-primary);
  color: var(--lime-light);
}

.footer-btn.confirm:hover:not(:disabled) {
  background: oklch(from var(--lime-primary) l c h / 0.4);
}

.footer-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
