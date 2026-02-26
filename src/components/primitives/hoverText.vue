<template>
  <div class="hover-text-wrapper">
    <slot v-if="!isHovered">
      <span
        class="hover-trigger"
        @mouseenter="showTooltip"
        @mouseleave="hideTooltip"
        @focus="showTooltip"
        @blur="hideTooltip"
        tabindex="0"
      >
        ?
      </span>
    </slot>

    <div
      v-if="isHovered && tooltipText"
      class="hover-tooltip"
      :class="{ 'tooltip-visible': isHovered }"
      role="tooltip"
    >
      {{ tooltipText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  text: string
  triggerText?: string
  showDefaultTrigger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  triggerText: '?',
  showDefaultTrigger: true
})

const isHovered = ref(false)
const tooltipText = ref('')

const showTooltip = () => {
  tooltipText.value = props.text
  isHovered.value = true
}

const hideTooltip = () => {
  isHovered.value = false
  tooltipText.value = ''
}
</script>

<style scoped>
.hover-text-wrapper {
  position: relative;
  display: inline-block;
  margin-left: 4px;
  vertical-align: top;
}

.hover-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-x-small);
  font-weight: bold;
  cursor: help;
  transition: all 0.2s ease;
  user-select: none;
}

.hover-trigger:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: white;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

.hover-trigger:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  border-color: rgba(59, 130, 246, 0.8);
}

.hover-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: oklch(from var(--grey-dark) l c h / 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-size: var(--font-small);
  font-weight: 500;
  line-height: 1.4;
  white-space: normal;
  word-wrap: break-word;
  max-width: 300px;
  min-width: 150px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.1s ease;
  pointer-events: none;
}

.hover-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid rgba(255, 255, 255, 0.2);
}

.hover-tooltip::after {
  content: '';
  position: absolute;
  top: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 5px solid rgba(30, 41, 59, 0.9);
}

.tooltip-visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(2px);
}

@media (max-width: 768px) {
  .hover-tooltip {
    max-width: 280px;
    font-size: var(--font-x-small);
    padding: 10px 14px;
    left: 0;
    right: 0;
    transform: none;
  }

  .hover-tooltip::before,
  .hover-tooltip::after {
    left: 20px;
    right: auto;
    transform: none;
  }
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(2px);
  }
}

.tooltip-visible {
  animation: tooltipFadeIn 0.1s ease-out;
}

</style>
