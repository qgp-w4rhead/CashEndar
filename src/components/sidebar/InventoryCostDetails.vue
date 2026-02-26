<template>
  <div class="cost-section" :class="{ 'first-section': isFirst, 'last-section': isLast }">
    <div class="cost-toggle">
      <div class="toggle-switch">
        <div class="toggle-container two-options">
          <button
            :class="['toggle-option small', { active: itemCostMethodPrefs[item.id] !== false }]"
            @click.stop="itemCostMethodPrefs[item.id] = true"
          >
            Depletion
          </button>
          <button
            :class="['toggle-option small', { active: itemCostMethodPrefs[item.id] === false, disabled: !canUsePurchaseMethod(item) }]"
            :disabled="!canUsePurchaseMethod(item)"
            :title="!canUsePurchaseMethod(item) ? 'No purchases available' : ''"
            @click.stop="canUsePurchaseMethod(item) && (itemCostMethodPrefs[item.id] = false)"
          >
            Purchase
          </button>
        </div>
      </div>
    </div>
    <div class="annual-cost-display">
      <div class="annual-cost-amount" v-if="getCurrentAnnualCostReactive(item, itemCostMethodPrefs)">
        ${{ +getCurrentAnnualCostReactive(item, itemCostMethodPrefs).cost.toFixed(2) }}/year
      </div>
      <div class="annual-cost-details" v-if="getCurrentAnnualCostReactive(item, itemCostMethodPrefs)">
        {{ getCurrentAnnualCostReactive(item, itemCostMethodPrefs).details }}
      </div> 
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Payment } from '../../types/payment.types'
import {
  getAnnualCostFromPurchases,
  getAnnualCostFromDepletion,
  getCurrentAnnualCostReactive
} from '../../composables/payment-computables'

defineProps<{
  item: Payment
  isFirst?: boolean
  isLast?: boolean
}>()

// Reactive state for annual cost method preferences (item ID -> boolean)
const itemCostMethodPrefs = ref<Record<string, boolean>>({})

// Helper function to check if purchase method can be used for an item
const canUsePurchaseMethod = (item: Payment) => {
  return getAnnualCostFromPurchases.value(item) !== null
}
</script>

<style scoped>
.cost-section {
  padding: 12px;
  background: oklch(from var(--grey-primary) 0.1 c h / 0.3);
  border-radius: 8px;
  border: 2px solid oklch(from var(--grey-primary) l c h / 0.5);
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.cost-section.first-section {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: none;
}

.cost-section.last-section {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: none;
  margin-top: 0;
}

.cost-section.first-section.last-section {
  border-radius: 8px;
  border: 2px solid oklch(from var(--grey-primary) l c h / 0.5);
}

.cost-section:hover {
  border-color: oklch(from var(--grey-light) l c h / 1);
}

.cost-toggle {
  margin-bottom: 8px;
}

.annual-cost-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.annual-cost-amount {
  color: #ffffff;
  font-size: var(--font-medium);
  font-weight: 700;
  font-family: monospace;
}

.annual-cost-details {
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-x-small);
  font-weight: 400;
  line-height: 1.3;
}
</style>
