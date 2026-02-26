<template>
  <div class="calendar-header">
    <button class="nav-btn prev" @click="onPrev" title="Previous">‹</button>
    
    <div class="title-container">
      <h3 class="title">{{ title }}</h3>
    </div>
    
    <button class="nav-btn next" @click="onNext" title="Next">›</button>
    
    <button class="pie-chart-btn" @click="onTogglePieChart" title="View Summary Chart">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20"/>
      </svg>
    </button>
    
    <button class="item-chart-btn" @click="onToggleItemChart" title="View Inventory Items Chart">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 3v18h18"/>
        <path d="M9 9h6"/>
        <path d="M9 12h6"/>
        <path d="M9 15h6"/>
        <path d="M3 3l6 6"/>
      </svg>
    </button>
    
    <button class="view-toggle-btn" @click="onToggleView" :title="viewMode === 'month' ? 'Switch to Week View' : 'Switch to Month View'">
      <svg v-if="viewMode === 'month'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="7" height="7" rx="1"></rect>
        <rect x="14" y="4" width="7" height="7" rx="1"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  viewMode: 'month' | 'week'
  title: string
  onPrev: () => void
  onNext: () => void
  onToggleView: () => void
  onTogglePieChart: () => void
  onToggleItemChart: () => void
}

defineProps<Props>()
</script>

<style scoped>
.calendar-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  padding: 0 8px;
  gap: 12px;
  flex-shrink: 0;
}

.calendar-header > * {
  flex: 0 0 auto;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  min-width: 0; /* Allows title to shrink if needed */
}

.title {
  color: white;
  font-size: var(--font-v-big);
  font-weight: 600;
  margin: 0;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--font-medium);
  transition: all 0.2s ease;
  flex-shrink: 0; /* Prevents arrows from shrinking */
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.pie-chart-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--font-small);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.pie-chart-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.pie-chart-btn svg {
  width: 20px;
  height: 20px;
}

.item-chart-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--font-small);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.item-chart-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
  border-color: oklch(from var(--grey-primary) l c h / 1);
  box-shadow: 0 0 0 2px oklch(from var(--grey-primary) l c h / 0.3);
}

.item-chart-btn svg {
  width: 20px;
  height: 20px;
}

.view-toggle-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--font-small);
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.view-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.view-toggle-btn svg {
  width: 16px;
  height: 16px;
}
</style>
