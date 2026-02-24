<template>
  <div ref="dropdownRef" class="custom-dropdown" :class="{ 'is-open': isOpen, 'is-disabled': disabled }">
    <div 
      class="dropdown-trigger form-input unit-select dropdown-end"
      @click="toggleDropdown"
      @keydown="handleKeydown"
      :tabindex="disabled ? -1 : 0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-disabled="disabled"
      aria-haspopup="listbox"
    >
      <span class="selected-value">{{ displayValue }}</span>
      <div class="dropdown-arrow" :class="{ 'open': isOpen }">▼</div>
    </div>
    
    <div v-if="isOpen" class="dropdown-menu" @click.stop>
      <!-- Unit conversion toggle button -->
      <div v-if="hasUnitApproximations" class="unit-conversion-toggle">
        <button 
          @click="toggleUnitSystem"
          class="conversion-btn"
          :class="{ 'imperial': isImperial }"
        >
          {{ isImperial ? 'Show Metric' : 'Show Imperial' }}
        </button>
      </div>
      
      <div 
        v-for="(group, groupIndex) in groupedOptions" 
        :key="group.name || 'ungrouped'"
        class="option-group"
      >
        <div v-if="group.name" class="group-header">{{ group.name }}</div>
        <div
          v-for="option in group.options"
          :key="option.value"
          class="dropdown-option"
          :class="{ 
            'is-selected': isSelected(option.value),
            'is-disabled': option.disabled,
            'is-grouped': group.name
          }"
          @click="selectOption(option)"
          @keydown="handleOptionKeydown($event, option)"
          role="option"
          :aria-selected="isSelected(option.value)"
          tabindex="-1"
        >
          <span class="option-label">{{ option.label }}</span>
          <span v-if="getOptionApproximation(option)" class="option-approximation">{{ getOptionApproximation(option) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface DropdownOption {
  value: string
  label: string
  approximation?: string
  approximationImperial?: string
  disabled?: boolean
  group?: string
}

interface Props {
  modelValue: string | number
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select an option',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isOpen = ref(false)
const focusedIndex = ref(-1)
const isImperial = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Group options by group name
const groupedOptions = computed(() => {
  const groups: { name?: string; options: DropdownOption[] }[] = []
  const grouped = new Map<string, DropdownOption[]>()
  
  // Separate grouped and ungrouped options
  const ungrouped: DropdownOption[] = []
  
  props.options.forEach(option => {
    if (option.group) {
      if (!grouped.has(option.group)) {
        grouped.set(option.group, [])
      }
      grouped.get(option.group)!.push(option)
    } else {
      ungrouped.push(option)
    }
  })
  
  // Add ungrouped options first
  if (ungrouped.length > 0) {
    groups.push({ options: ungrouped })
  }
  
  // Add grouped options
  grouped.forEach((options, groupName) => {
    groups.push({ name: groupName, options })
  })
  
  return groups
})

// Get display value for the trigger
const displayValue = computed(() => {
  const selectedOption = props.options.find(option => option.value === props.modelValue)
  return selectedOption ? selectedOption.label : props.placeholder
})

// Check if an option is selected
const isSelected = (value: string | number) => {
  return value === props.modelValue
}

// Toggle dropdown open/closed
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    focusedIndex.value = 0
  }
}

// Select an option
const selectOption = (option: DropdownOption) => {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  isOpen.value = false
}

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return
  
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      toggleDropdown()
      break
    case 'ArrowDown':
      event.preventDefault()
      if (!isOpen.value) {
        toggleDropdown()
      } else {
        focusNextOption()
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) {
        toggleDropdown()
      } else {
        focusPreviousOption()
      }
      break
    case 'Escape':
      event.preventDefault()
      isOpen.value = false
      break
  }
}

// Handle option keyboard navigation
const handleOptionKeydown = (event: KeyboardEvent, option: DropdownOption) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectOption(option)
      break
    case 'ArrowDown':
      event.preventDefault()
      focusNextOption()
      break
    case 'ArrowUp':
      event.preventDefault()
      focusPreviousOption()
      break
    case 'Escape':
      event.preventDefault()
      isOpen.value = false
      break
  }
}

// Focus next option
const focusNextOption = () => {
  const allOptions = getAllOptions()
  if (allOptions.length === 0) return
  
  do {
    focusedIndex.value = (focusedIndex.value + 1) % allOptions.length
  } while (allOptions[focusedIndex.value].disabled && focusedIndex.value !== 0)
  
  scrollOptionIntoView()
}

// Focus previous option
const focusPreviousOption = () => {
  const allOptions = getAllOptions()
  if (allOptions.length === 0) return
  
  do {
    focusedIndex.value = focusedIndex.value <= 0 ? allOptions.length - 1 : focusedIndex.value - 1
  } while (allOptions[focusedIndex.value].disabled && focusedIndex.value !== allOptions.length - 1)
  
  scrollOptionIntoView()
}

// Get all flat options for navigation
const getAllOptions = () => {
  return groupedOptions.value.flatMap(group => group.options)
}

// Scroll focused option into view
const scrollOptionIntoView = () => {
  const allOptions = document.querySelectorAll('.dropdown-option')
  if (allOptions[focusedIndex.value]) {
    allOptions[focusedIndex.value].scrollIntoView({ block: 'nearest' })
  }
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Close dropdown when disabled changes to true
watch(() => props.disabled, (newDisabled) => {
  if (newDisabled) {
    isOpen.value = false
  }
})

// Check if any options have unit approximations
const hasUnitApproximations = computed(() => {
  return props.options.some(option => option.approximation || option.approximationImperial)
})

// Toggle between metric and imperial units
const toggleUnitSystem = () => {
  isImperial.value = !isImperial.value
}

// Get the appropriate approximation based on current unit system
const getOptionApproximation = (option: DropdownOption) => {
  if (isImperial.value && option.approximationImperial) {
    return option.approximationImperial
  }
  return option.approximation
}
</script>

<style scoped>
.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.dropdown-trigger.dropdown-end {
  justify-content: flex-end;
}

.dropdown-trigger.is-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.selected-value {
  flex: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.dropdown-trigger.dropdown-end .selected-value {
  text-align: right;
  margin-right: 8px;
}

.dropdown-arrow {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  transition: transform 0.2s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: max-content;
  margin-top: 4px;
  background: oklch(from var(--grey-dark) l c h / 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  backdrop-filter: blur(10px);
  max-height: 240px;
  overflow-y: auto;
}

.unit-conversion-toggle {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.conversion-btn {
  background: oklch(from var(--lime-primary) l c h / 0.1);
  border: 1px solid oklch(from var(--lime-primary) l c h / 0.3);
  color: oklch(from var(--lime-primary) l c h / 1);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.conversion-btn:hover {
  background: oklch(from var(--lime-primary) l c h / 0.2);
  border-color: oklch(from var(--lime-primary) l c h / 1);
  transform: translateY(-1px);
}

.conversion-btn.imperial {
  background: oklch(from var(--grey-primary) l c h / 0.1);
  border-color: oklch(from var(--grey-primary) l c h / 0.3);
  color: oklch(from var(--grey-light) l c h / 1);
}

.conversion-btn.imperial:hover {
  background: oklch(from var(--grey-primary) l c h / 0.2);
  border-color: oklch(from var(--grey-primary) l c h / 1);
}

.option-group {
  margin-bottom: 0;
}

.option-group:last-child {
  margin-bottom: 0;
}

.group-header {
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dropdown-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
}

.dropdown-option.is-grouped {
  padding-left: 20px;
}

.dropdown-option:hover,
.dropdown-option:focus {
  background: oklch(from var(--lime-primary) l c h / 0.2);
  color: oklch(from var(--lime-primary) l c h / 1);
  outline: none;
}

.dropdown-option.is-selected {
  background: oklch(from var(--lime-primary) l c h / 0.3);
  color: oklch(from var(--lime-primary) l c h / 1);
  font-weight: 600;
}

.dropdown-option.is-disabled {
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  pointer-events: none;
}

.option-label {
  flex: 1;
}

.option-approximation {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-weight: 400;
  margin-left: 8px;
  white-space: nowrap;
}

/* Scrollbar styling */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
