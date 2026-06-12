<template>
  <div class="widget-card">
    <div class="widget-header">
      <h4 class="widget-title">★ Your stats</h4>
      <button class="manage-link" @click="openStatManagerModal">manage</button>
    </div>

    <div v-if="starredStatsColumns.length === 0" class="widget-empty">
      Star some stats (★) to see them here for your top items.
    </div>
    <div v-else-if="starredStatsOverview.length === 0" class="widget-empty">
      No tracked items yet — add purchases or scan a bill.
    </div>

    <div v-else class="stats-grid" :style="gridStyle">
      <div class="grid-head">Item</div>
      <div v-for="stat in starredStatsColumns" :key="stat.id" class="grid-head stat-head">
        {{ stat.label }}
      </div>

      <template v-for="row in starredStatsOverview" :key="row.name">
        <div class="grid-item-name">{{ row.name }}</div>
        <div v-for="value in row.values" :key="`${row.name}-${value.statId}`" class="grid-value">
          {{ value.formatted }}
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { starredStatsOverview, starredStatsColumns } from '../../composables/dashboard-computables'
import { openStatManagerModal } from '../../composables/payment-handlers'

const gridStyle = computed(() => ({
  gridTemplateColumns: `minmax(120px, 1.4fr) repeat(${starredStatsColumns.value.length}, minmax(70px, 1fr))`,
}))
</script>

<style scoped>
.manage-link {
  background: none;
  border: none;
  color: var(--lime-light);
  font-size: var(--font-x-small);
  cursor: pointer;
  text-decoration: underline;
}

.stats-grid {
  display: grid;
  gap: 1px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.grid-head {
  background: rgba(255, 255, 255, 0.04);
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 6px 10px;
}

.stat-head {
  text-align: right;
}

.grid-item-name {
  background: rgba(20, 20, 20, 0.8);
  color: white;
  font-weight: 600;
  font-size: var(--font-x-small);
  padding: 6px 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-value {
  background: rgba(20, 20, 20, 0.8);
  color: rgba(255, 255, 255, 0.85);
  font-family: monospace;
  font-size: var(--font-x-small);
  padding: 6px 10px;
  text-align: right;
}
</style>
