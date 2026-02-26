<template>
  <div class="sort-btn-container">
    <button class="sort-btn" :title="getSortButtonTitle()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="19" y2="12"></line>
        <line x1="8" y1="18" x2="16" y2="18"></line>
      </svg>
    </button>
    <div class="sort-dropdown">
      <button
        class="sort-option"
        :class="{ active: sortMode === 'date-asc' }"
        @click="setSortMode('date-asc')"
      >
        Date (Earliest First)
      </button>
      <button
        class="sort-option"
        :class="{ active: sortMode === 'date-desc' }"
        @click="setSortMode('date-desc')"
      >
        Date (Latest First)
      </button>
      <button
        class="sort-option"
        :class="{ active: sortMode === 'amount-asc' }"
        @click="setSortMode('amount-asc')"
      >
        Amount (Lowest First)
      </button>
      <button
        class="sort-option"
        :class="{ active: sortMode === 'amount-desc' }"
        @click="setSortMode('amount-desc')"
      >
        Amount (Highest First)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sortMode } from '../../stores/ui-state.store'

// Set sort mode directly
const setSortMode = (mode: 'date-asc' | 'date-desc' | 'amount-asc' | 'amount-desc') => {
  sortMode.value = mode
}

// Get sort button title based on current sort mode
const getSortButtonTitle = () => {
  switch (sortMode.value) {
    case 'date-asc':
      return 'Sort by date (earliest first)'
    case 'date-desc':
      return 'Sort by date (latest first)'
    case 'amount-asc':
      return 'Sort by amount (lowest first)'
    case 'amount-desc':
      return 'Sort by amount (highest first)'
    default:
      return 'Sort payments'
  }
}
</script>

<style scoped>
.sort-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: var(--font-medium);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.sort-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.sort-btn-container {
  position: relative;
}

.sort-dropdown {
  margin: 10px 0px 0px 0px;
  position: absolute;
  top: 100%;
  right: 0;
  background: linear-gradient(135deg, oklch(from var(--grey-dark) l c h / 1) 0%, oklch(from var(--grey-primary) l c h / 0.5) 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  min-width: 180px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  z-index: 1000;
}

.sort-btn-container:hover .sort-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.sort-option {
  display: block;
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  font-size: var(--font-small);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0;
}

.sort-option:first-child {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.sort-option:last-child {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.sort-option:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sort-option.active {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 1), oklch(from var(--lime-dark) l c h / 1));
  color: white;
}

.sort-option:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
