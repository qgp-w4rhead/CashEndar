<template>
  <div class="cost-sections-wrapper">
    <!-- Header Section -->
    <div class="cost-section" :class="{ 'first-section': true, 'last-section': !showDetails }">
      <div class="inventory-details-column">
        <div class="inventory-name">{{ props.item.itemName || 'Unnamed Item' }}</div>
        <div class="inventory-brand" v-if="props.item.brand">{{ props.item.brand }}</div>
        <div class="inventory-amount">
          <span class="amount-total">TOTAL: {{ props.item.amount }}</span>
          <span class="amount-separator"> | </span>
          <span class="amount-avg">AVG: {{ getAverageCost(props.item) }}</span>
        </div>
      </div>
      <div class="inventory-meta-column">
        <div class="inventory-meta-item">
          <span class="portions-left">{{ +getPortionsRemaining(props.item).toFixed(2) }} portions left</span>
        </div>
        <div class="inventory-meta-item" v-if="getEstimatedDepletionDate(props.item)">
          <span class="depletion-date">{{ getEstimatedDepletionDate(props.item) }} remaining</span>
        </div>
        <div class="inventory-meta-item" v-if="getExpirationDisplay(props.item)">
          <span class="expiration-display">{{ getExpirationDisplay(props.item) }}</span>
        </div>
      </div>
      <div class="inventory-menu">
        <div class="menu-bar-container" @click.stop="$emit('edit-item', props.item)">
          <div class="menu-bar"></div>
        </div>
      </div> 
    </div>

    <!-- Separator -->
    <div class="section-separator" v-if="showDetails"></div>

    <!-- Details Section -->
    <div class="cost-section" v-if="showDetails" :class="{ 'first-section': false, 'last-section': true }">
      <div class="cost-toggle">
        <div class="toggle-switch">
          <div class="toggle-container two-options">
            <button
              :class="['toggle-option small', { active: itemCostMethodPrefs[props.item.id] !== false }]"
              @click.stop="itemCostMethodPrefs[props.item.id] = true"
            >
              Depletion
            </button>
            <button
              :class="['toggle-option small', { active: itemCostMethodPrefs[props.item.id] === false, disabled: !canUsePurchaseMethod(props.item) }]"
              :disabled="!canUsePurchaseMethod(props.item)"
              :title="!canUsePurchaseMethod(props.item) ? 'No purchases available' : ''"
              @click.stop="canUsePurchaseMethod(props.item) && (itemCostMethodPrefs[props.item.id] = false)"
            >
              Purchase
            </button>
          </div>
        </div>
      </div>
      <div class="annual-cost-display">
        <div class="annual-cost-amount" v-if="getCurrentAnnualCostReactive(props.item, itemCostMethodPrefs)">
          ${{ +getCurrentAnnualCostReactive(props.item, itemCostMethodPrefs).cost.toFixed(2) }}/year
        </div>
        <div class="annual-cost-details" v-if="getCurrentAnnualCostReactive(props.item, itemCostMethodPrefs)">
          <div class="annual-cost-detail-line">
            {{ getCurrentAnnualCostReactive(props.item, itemCostMethodPrefs).details.split('×')[0].trim() }}
          </div>
          <div class="annual-cost-detail-line">
            {{ getCurrentAnnualCostReactive(props.item, itemCostMethodPrefs).details.split('×')[1]?.trim() || '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Payment } from '../../types/payment.types'
import {
  getPortionsRemaining,
  getEstimatedDepletionDate,
  getAnnualCostFromPurchases,
  getAnnualCostFromDepletion,
  getCurrentAnnualCostReactive
} from '../../composables/payment-computables'

const props = defineProps<{
  item: Payment
}>()

defineEmits<{
  'edit-item': [item: Payment]
}>()

// Reactive state for annual cost method preferences (item ID -> boolean)
const itemCostMethodPrefs = ref<Record<string, boolean>>({})

// Helper function to get expiration display text
const getExpirationDisplay = (item: Payment) => {
  if (!item.expirationPeriod || !item.expirationUnit) return null
  
  const expirationText = `${item.expirationPeriod} ${item.expirationUnit}${item.expirationPeriod === 1 ? '' : 's'}`
  const offsetText = item.freshnessOffset ? `, was fresh ${item.freshnessOffset} ${item.freshnessOffsetUnit || 'day'}${item.freshnessOffset === 1 ? '' : 's'} ago` : ''
  
  return `Shelf life: ${expirationText}${offsetText}`
}

// Helper function to calculate average cost
const getAverageCost = (item: Payment) => {
  // If we have quantity and unitCost, calculate average
  if (item.quantity && item.unitCost) {
    return `$${item.unitCost.toFixed(2)}`
  }
  
  // Try to parse from amount string (format: "$X.XX")
  const amountMatch = item.amount.match(/\$(\d+\.?\d*)/)
  if (amountMatch) {
    const totalAmount = parseFloat(amountMatch[1])
    if (item.quantity && item.quantity > 0) {
      return `$${(totalAmount / item.quantity).toFixed(2)}`
    }
  }
  
  // Fallback to showing the same as total if we can't calculate average
  return item.amount
}

// Helper function to check if purchase method can be used for an item
const canUsePurchaseMethod = (item: Payment) => {
  return getAnnualCostFromPurchases.value(item) !== null
}

// Computed property to determine if details should be shown
const showDetails = computed(() => {
  return getAnnualCostFromPurchases.value(props.item) || getAnnualCostFromDepletion.value(props.item)
})
</script>

<style scoped>
.cost-sections-wrapper {
  display: flex;
  flex-direction: column;
}

.cost-section {
  padding: 12px;
  background: oklch(from var(--grey-primary) 0.1 c h / 0.3);
  border-radius: 8px;
  border: 2px solid oklch(from var(--grey-primary) l c h / 0.5);
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.inventory-details-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
}

.inventory-meta-column {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 150px;
}

.inventory-meta-item {
  font-size: var(--font-medium);
  color: rgba(255, 255, 255, 0.6);
  text-align: right;
  padding-right: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
}

.inventory-meta-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
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

.section-separator {
  height: 1px;
  background: oklch(from var(--grey-primary) l c h / 0.3);
  margin: -1px 0;
  position: relative;
  z-index: 1;
}

.cost-sections-wrapper:hover .section-separator {
  background: oklch(from var(--grey-light) l c h / 1);
}

.cost-toggle {
  margin-bottom: 8px;
}

.annual-cost-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.inventory-name {
  color: white;
  font-weight: 600;
  font-size: var(--font-medium);
}

.inventory-brand {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  font-size: var(--font-small);
}

.inventory-amount {
  font-weight: 700;
  font-size: var(--font-small);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  gap: 4px;
}

.amount-total {
  color: rgba(255, 255, 255, 0.9);
}

.amount-separator {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.amount-avg {
  color: rgba(255, 255, 255, 0.7);
}

.portions-left {
  color: oklch(from var(--grey-light) l c h / 1);
  font-weight: 500;
}

.depletion-date {
  color: rgba(255, 255, 255, 0.5);
}

.expiration-display {
  color: rgba(255, 255, 255, 0.5);
}

.inventory-menu {
  align-self: center;
}

.menu-bar-container {
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100vh;
  transition: background 0.2s ease;
}

.menu-bar {
  width: 6px;
  height: 32px;
  background: var(--lime-primary);
  border-radius: 100vh;
  transition: background 0.2s ease;
}

.menu-bar-container:hover .menu-bar {
  background: var(--lime-light);
}

.annual-cost-amount {
  color: #ffffff;
  font-size: var(--font-medium);
  font-weight: 700;
  font-family: monospace;
  text-align: right;
}

.annual-cost-details {
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-x-small);
  font-weight: 400;
  line-height: 1.3;
  text-align: right;
}

.annual-cost-detail-line {
  margin-bottom: 2px;
}

.annual-cost-detail-line:last-child {
  margin-bottom: 0;
}
</style>
