<template>
  <div class="slider-container">
    <div class="slider-labels">
      <div class="slider-label slider-label-left" :title="leftLabel">
        {{ shortenedLeftLabel }}
      </div>
      <div class="slider-label slider-label-right" :title="rightLabel">
        {{ shortenedRightLabel }}
      </div>
    </div>

    <div class="slider-wrapper">
      <input
        type="range"
        min="0"
        max="100"
        :value="normalizedValue"
        @input="handleSliderChange"
        class="slider-input"
        :aria-label="`${leftLabel} vs ${rightLabel}`"
      />

      <div class="slider-track">
        <div
          class="slider-fill"
          :style="{ width: `${normalizedValue}%` }"
        ></div>
      </div>

      <div class="slider-people">
        <div class="person person-left">{{ leftPerson }}</div>
        <div class="person person-right">{{ rightPerson }}</div>
      </div>
    </div>

    <div class="slider-stats">
      <div class="stat-item">
        <span class="stat-name">{{ leftLabel }}</span>
        <span class="stat-value">{{ leftValue }}</span>
        <span class="stat-percentage">{{ leftPercent }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-name">{{ rightLabel }}</span>
        <span class="stat-value">{{ rightValue }}</span>
        <span class="stat-percentage">{{ rightPercent }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  leftLabel: string
  rightLabel: string
  leftValue: string
  rightValue: string
  value?: number // 0-100, 50 = balanced
  leftPerson?: string
  rightPerson?: string
}

interface Emits {
  (e: 'update:value', value: number): void
}

const props = withDefaults(defineProps<Props>(), {
  value: 50,
  leftPerson: 'A',
  rightPerson: 'B'
})

const emit = defineEmits<Emits>()

const normalizedValue = computed(() => {
  return Math.max(0, Math.min(100, props.value))
})

const leftPercent = computed(() => Math.round(100 - normalizedValue.value))
const rightPercent = computed(() => Math.round(normalizedValue.value))

const shortenedLeftLabel = computed(() => {
  return props.leftLabel.length > 12 ? props.leftLabel.substring(0, 12) + '...' : props.leftLabel
})

const shortenedRightLabel = computed(() => {
  return props.rightLabel.length > 12 ? props.rightLabel.substring(0, 12) + '...' : props.rightLabel
})

const handleSliderChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:value', parseInt(target.value))
}
</script>

<style scoped>
.slider-container {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.slider-label {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
  text-align: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: help;
  transition: all 0.2s ease;
}

.slider-label:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
}

.slider-label-left {
  background: linear-gradient(135deg, oklch(from var(--grey-primary) l c h / 1), oklch(from var(--grey-dark) l c h / 1));
  color: white;
}

.slider-label-right {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 1), oklch(from var(--lime-dark) l c h / 1));
  color: white;
}

.slider-wrapper {
  position: relative;
  margin: 24px 0;
}

.slider-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 3;
}

.slider-track {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.slider-fill {
  height: 100%;
  background: linear-gradient(90deg, oklch(from var(--grey-primary) l c h / 1) 0%, oklch(from var(--lime-primary) l c h / 1) 100%);
  border-radius: 4px;
  transition: width 0.2s ease;
}

.slider-people {
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.person {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: var(--font-small);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.person-left {
  background: linear-gradient(135deg, oklch(from var(--grey-primary) l c h / 1), oklch(from var(--grey-dark) l c h / 1));
}

.person-right {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 1), oklch(from var(--lime-dark) l c h / 1));
}

.slider-stats {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-name {
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-x-small);
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  color: white;
  font-size: var(--font-medium);
  font-weight: 700;
  display: block;
  margin-bottom: 2px;
  font-family: monospace;
}

.stat-percentage {
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-x-small);
  font-weight: 500;
}

@media (max-width: 768px) {
  .slider-container {
    padding: 16px;
  }

  .slider-labels {
    margin-bottom: 12px;
  }

  .slider-label {
    font-size: var(--font-x-small);
    padding: 6px 8px;
  }

  .slider-wrapper {
    margin: 16px 0;
  }

  .person {
    width: 28px;
    height: 28px;
    font-size: var(--font-x-small);
  }

  .slider-stats {
    flex-direction: column;
    gap: 12px;
  }

  .stat-item {
    padding: 10px;
  }
}
</style>
