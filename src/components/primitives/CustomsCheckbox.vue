<template>
  <label class="custom-checkbox" :class="{ 'is-disabled': disabled, 'is-small': size === 'small' }">
    <input 
      type="checkbox" 
      :checked="modelValue"
      @change="handleChange"
      :disabled="disabled"
      class="checkbox-input"
    >
    <div class="checkbox-visual">
      <div class="checkbox-mark">✓</div>
    </div>
    <span v-if="label" class="checkbox-label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
  size?: 'small' | 'medium'
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: 'medium'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!props.disabled) {
    emit('update:modelValue', target.checked)
  }
}
</script>

<style scoped>
.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  padding: 8px;
  border-radius: 6px;
  position: relative;
}

.custom-checkbox:hover {
  background: rgba(255, 255, 255, 0.05);
}

.custom-checkbox.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.custom-checkbox.is-disabled:hover {
  background: transparent;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.checkbox-visual {
  position: relative;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.custom-checkbox.is-small .checkbox-visual {
  width: 14px;
  height: 14px;
  border-width: 1.5px;
}

.checkbox-input:hover + .checkbox-visual {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.checkbox-input:focus + .checkbox-visual {
  outline: 2px solid oklch(from var(--lime-primary) l c h / 0.5);
  outline-offset: 2px;
}

.checkbox-input:checked + .checkbox-visual {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 1), oklch(from var(--lime-dark) l c h / 1));
  border-color: oklch(from var(--lime-primary) l c h / 1);
  box-shadow: 0 0 0 3px oklch(from var(--lime-primary) l c h / 0.2);
}

.checkbox-input:checked:hover + .checkbox-visual {
  background: linear-gradient(135deg, oklch(from var(--lime-primary) l c h / 0.9), oklch(from var(--lime-dark) l c h / 0.9));
  transform: scale(1.05);
}

.checkbox-mark {
  color: white;
  font-size: var(--font-x-small);
  font-weight: bold;
  transform: scale(0);
  transition: transform 0.2s ease;
  line-height: 1;
}

.custom-checkbox.is-small .checkbox-mark {
  font-size: calc(var(--font-x-small) * 0.8);
}

.checkbox-input:checked + .checkbox-visual .checkbox-mark {
  transform: scale(1);
}

.checkbox-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-small);
  font-weight: 500;
  line-height: 1;
  flex: 1;
}

.custom-checkbox.is-small .checkbox-label {
  font-size: var(--font-x-small);
}

.custom-checkbox.is-disabled .checkbox-label {
  color: rgba(255, 255, 255, 0.4);
}

.custom-checkbox.is-disabled .checkbox-visual {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.02);
}

.custom-checkbox.is-disabled .checkbox-input:checked + .checkbox-visual {
  background: linear-gradient(135deg, oklch(from var(--grey-primary) l c h / 0.5), oklch(from var(--grey-dark) l c h / 0.5));
  border-color: oklch(from var(--grey-primary) l c h / 0.5);
  box-shadow: 0 0 0 3px oklch(from var(--grey-primary) l c h / 0.1);
}
</style>
