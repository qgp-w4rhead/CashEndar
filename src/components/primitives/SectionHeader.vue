<template>
  <div class="section-header">
    <h2 class="section-title">{{ title }}</h2>
    <div class="header-buttons">
      <button v-if="showGearButton" class="gear-btn" @click="$emit('gear-click')" title="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          <path d="M12 8l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z"/>
          <circle cx="12" cy="12" r="1"/>
        </svg>
      </button>
      <slot name="buttons"></slot>
      <button v-if="showAddButton" class="add-btn" @click="$emit('add-click')">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  showGearButton?: boolean
  showAddButton?: boolean
}

withDefaults(defineProps<Props>(), {
  showGearButton: true,
  showAddButton: true
})

defineEmits<{
  'gear-click': []
  'add-click': []
}>()
</script>
