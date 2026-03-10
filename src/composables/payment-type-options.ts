import { computed } from 'vue'
import { paymentTypes } from '../stores/ui-state.store'

export const paymentTypeOptions = computed(() => {
  return paymentTypes.value
    .filter(t => t.value !== 'inventory')
    .map(type => ({
      value: type.value,
      label: type.label
    }))
})
