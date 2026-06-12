<template>
  <div v-if="showStatManagerModal" class="modal-overlay stat-manager-overlay">
    <CustomScrollbar class="stat-manager-modal" direction="vertical" max-height="85vh" @click.stop>
      <div class="modal-header">
        <h3>Stats</h3>
        <button class="close-btn" @click="closeStatManagerModal">×</button>
      </div>

      <div class="modal-body">
        <p class="manager-hint">
          Star ★ the stats you care about — starred stats become columns in the
          item table and rows in comparisons.
        </p>

        <div class="stat-list">
          <div v-for="stat in sortedStats" :key="stat.id" class="stat-row">
            <button
              class="star-btn"
              :class="{ starred: stat.starred }"
              :title="stat.starred ? 'Unstar' : 'Star'"
              @click="toggleStar(stat)"
            >★</button>
            <div class="stat-info">
              <span class="stat-name">{{ stat.label }}</span>
              <span class="stat-meta">
                {{ stat.unit || 'no unit' }} · {{ STAT_BASIS_LABELS[stat.basis] }}
                <span v-if="stat.derived" class="derived-chip">auto</span>
                <span v-else-if="!stat.isBuiltin" class="custom-chip">custom</span>
              </span>
            </div>
            <button
              v-if="!stat.isBuiltin"
              class="delete-btn"
              title="Delete custom stat"
              @click="removeStat(stat)"
            >🗑</button>
          </div>
        </div>

        <div class="create-section">
          <h4 class="section-title">Add a custom stat</h4>
          <div class="create-form">
            <input
              v-model="newStatLabel"
              type="text"
              class="form-input"
              placeholder="Name (e.g. Fiber)"
              @keyup.enter="createStat"
            />
            <input
              v-model="newStatUnit"
              type="text"
              class="form-input unit-input"
              placeholder="Unit (e.g. g/100g)"
              @keyup.enter="createStat"
            />
            <CustomDropdown
              v-model="newStatBasis"
              :options="basisDropdownOptions"
              class="basis-dropdown"
            />
            <button class="create-btn" :disabled="!newStatLabel.trim()" @click="createStat">
              + Add
            </button>
          </div>
          <p v-if="createError" class="create-error">{{ createError }}</p>
        </div>
      </div>
    </CustomScrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { showStatManagerModal } from '../../stores/ui-state.store'
import { statDefinitions } from '../../stores/catalog.store'
import { closeStatManagerModal } from '../../composables/payment-handlers'
import { StatBasis, STAT_BASIS_LABELS, StatDefinition } from '../../types/catalog.types'
import { addStatDefinition, updateStatDefinition, deleteStatDefinition } from '../../repositories/stat-definition.repository'
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import CustomDropdown from '../primitives/CustomDropdown.vue'

const sortedStats = computed(() => {
  return [...statDefinitions.value].sort((a, b) => {
    if (a.starred !== b.starred) return a.starred ? -1 : 1
    return a.label.localeCompare(b.label)
  })
})

const toggleStar = async (stat: StatDefinition) => {
  try {
    const updated = await updateStatDefinition({ ...stat, starred: !stat.starred })
    statDefinitions.value = statDefinitions.value.map(s => s.id === updated.id ? updated : s)
  } catch (error) {
    console.error('Error toggling star:', error)
  }
}

const removeStat = async (stat: StatDefinition) => {
  try {
    await deleteStatDefinition(stat.id)
    statDefinitions.value = statDefinitions.value.filter(s => s.id !== stat.id)
  } catch (error) {
    console.error('Error deleting stat:', error)
  }
}

// --- Creation form ---
const newStatLabel = ref('')
const newStatUnit = ref('')
const newStatBasis = ref<StatBasis>('per100g')
const createError = ref('')

const basisDropdownOptions = computed(() => (
  (['per100g', 'perUnit', 'perPortion'] as StatBasis[]).map(basis => ({
    value: basis,
    label: STAT_BASIS_LABELS[basis],
  }))
))

const createStat = async () => {
  const label = newStatLabel.value.trim()
  if (!label) return
  createError.value = ''
  try {
    const created = await addStatDefinition({
      label,
      unit: newStatUnit.value.trim(),
      basis: newStatBasis.value,
      starred: true, // a freshly created stat is presumably wanted
    })
    statDefinitions.value = [...statDefinitions.value, created]
    newStatLabel.value = ''
    newStatUnit.value = ''
  } catch (error: any) {
    createError.value = error?.message?.includes('409')
      ? 'A stat with this name already exists'
      : 'Could not create the stat'
    console.error('Error creating stat:', error)
  }
}
</script>

<style scoped>
.stat-manager-overlay {
  z-index: 1100;
}

.stat-manager-modal {
  background: linear-gradient(135deg, var(--grey-dark) 0%, oklch(from var(--grey-primary) l c h / 0.5) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  width: 95%;
  max-width: 520px;
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

.manager-hint {
  color: rgba(255, 255, 255, 0.55);
  font-size: var(--font-x-small);
  margin: 0 0 16px;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.25);
  transition: color 0.2s ease, transform 0.2s ease;
}

.star-btn:hover {
  color: #fbbf24;
  transform: scale(1.15);
}

.star-btn.starred {
  color: #fbbf24;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.stat-name {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
}

.stat-meta {
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--font-x-small);
  display: flex;
  align-items: center;
  gap: 6px;
}

.derived-chip,
.custom-chip {
  border-radius: 8px;
  padding: 0 8px;
  font-size: var(--font-x-small);
}

.derived-chip {
  background: oklch(from var(--lime-primary) l c h / 0.15);
  color: var(--lime-light);
}

.custom-chip {
  background: rgba(139, 92, 246, 0.18);
  color: #c4b5fd;
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.delete-btn:hover {
  opacity: 1;
}

.create-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.section-title {
  margin: 0 0 12px;
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.create-form {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.form-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: white;
  padding: 8px 10px;
  font-size: var(--font-small);
  flex: 1;
  min-width: 120px;
}

.form-input:focus {
  outline: none;
  border-color: var(--lime-primary);
}

.unit-input {
  max-width: 130px;
}

.basis-dropdown {
  min-width: 130px;
}

.create-btn {
  background: oklch(from var(--lime-primary) l c h / 0.2);
  border: 1px solid var(--lime-primary);
  color: var(--lime-light);
  border-radius: 6px;
  padding: 8px 14px;
  font-size: var(--font-small);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-btn:hover:not(:disabled) {
  background: oklch(from var(--lime-primary) l c h / 0.35);
}

.create-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.create-error {
  margin: 8px 0 0;
  color: #f87171;
  font-size: var(--font-x-small);
}
</style>
