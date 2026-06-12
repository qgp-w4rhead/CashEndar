<template>
  <div class="widget-card">
    <div class="widget-header">
      <h4 class="widget-title">⇅ Purchase diff</h4>
      <div class="baseline-picker">
        <span class="widget-subtitle">this month vs avg of</span>
        <button
          v-for="n in [1, 3, 6]"
          :key="n"
          class="baseline-btn"
          :class="{ active: baselineMonths === n }"
          @click="baselineMonths = n"
        >{{ n }}mo</button>
      </div>
    </div>

    <div v-if="diffLines.length === 0" class="widget-empty">
      No changes from your usual buying — or not enough history this month yet.
    </div>

    <div v-else class="diff-block">
      <template v-for="section in sections" :key="section.kind">
        <div v-if="section.lines.length > 0" class="diff-section">
          <div class="diff-section-header">@@ {{ section.label }} @@</div>
          <div
            v-for="line in section.lines"
            :key="line.name"
            class="diff-line"
            :class="lineClass(line.kind)"
          >
            <span class="diff-gutter">{{ gutterSign(line.kind) }}</span>
            <span class="diff-qty">{{ qtyLabel(line) }}</span>
            <span class="diff-name">{{ line.name }}</span>
            <span class="diff-usual">{{ usualLabel(line) }}</span>
            <span class="diff-cost" :class="{ negative: line.deltaCost < 0 }">
              {{ line.deltaCost >= 0 ? '+' : '−' }}${{ Math.abs(line.deltaCost).toFixed(2) }}
            </span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { payments } from '../../stores/ui-state.store'
import { purchaseDiffFor } from '../../composables/dashboard-computables'
import { DiffKind, PurchaseDiffLine } from '../../services/forecast.service'

const baselineMonths = ref(3)

const diffLines = computed(() => {
  // referencing payments keeps the diff reactive to new purchases
  void payments.value.length
  return purchaseDiffFor(baselineMonths.value)
})

const sections = computed(() => ([
  { kind: 'added', label: 'newly bought', lines: diffLines.value.filter(l => l.kind === 'added') },
  { kind: 'more', label: 'more than usual', lines: diffLines.value.filter(l => l.kind === 'more') },
  { kind: 'less', label: 'less than usual', lines: diffLines.value.filter(l => l.kind === 'less') },
  { kind: 'removed', label: 'stopped buying', lines: diffLines.value.filter(l => l.kind === 'removed') },
]))

const gutterSign = (kind: DiffKind): string => {
  return kind === 'added' || kind === 'more' ? '+' : '−'
}

const lineClass = (kind: DiffKind): string => {
  return kind === 'added' || kind === 'more' ? 'diff-plus' : 'diff-minus'
}

const qtyLabel = (line: PurchaseDiffLine): string => {
  if (line.kind === 'added') return `${line.currentQty}×`
  if (line.kind === 'removed') return `0×`
  const delta = Math.abs(line.deltaQty)
  return `${delta % 1 === 0 ? delta : delta.toFixed(1)}×`
}

const usualLabel = (line: PurchaseDiffLine): string => {
  if (line.kind === 'added') return '(new)'
  if (line.kind === 'removed') return `(usually ${line.baselineQty}/mo)`
  return `(${line.currentQty} vs usual ${line.baselineQty})`
}
</script>

<style scoped>
.baseline-picker {
  display: flex;
  align-items: center;
  gap: 6px;
}

.baseline-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: var(--font-x-small);
  cursor: pointer;
  transition: all 0.2s ease;
}

.baseline-btn.active {
  border-color: var(--lime-primary);
  color: var(--lime-light);
  background: oklch(from var(--lime-primary) l c h / 0.15);
}

.diff-block {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  font-size: var(--font-x-small);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.diff-section-header {
  background: rgba(96, 165, 250, 0.08);
  color: #93c5fd;
  padding: 4px 12px;
  font-style: italic;
}

.diff-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 4px 12px;
}

.diff-line.diff-plus {
  background: rgba(16, 185, 129, 0.10);
}

.diff-line.diff-minus {
  background: rgba(239, 68, 68, 0.10);
}

.diff-gutter {
  width: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.diff-plus .diff-gutter,
.diff-plus .diff-qty {
  color: #34d399;
}

.diff-minus .diff-gutter,
.diff-minus .diff-qty {
  color: #f87171;
}

.diff-qty {
  width: 36px;
  flex-shrink: 0;
  font-weight: 700;
}

.diff-name {
  color: white;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diff-usual {
  color: rgba(255, 255, 255, 0.45);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diff-cost {
  color: #34d399;
  font-weight: 600;
  flex-shrink: 0;
}

.diff-cost.negative {
  color: #f87171;
}
</style>
