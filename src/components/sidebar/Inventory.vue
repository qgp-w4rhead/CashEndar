<template>
  <div class="inventory-section">
    <div :class="['inventory-header', { collapsed: isInventoryCollapsed }]">
      <div class="inventory-title-area" @click="toggleInventorySection">
        <h4 class="inventory-title">
          <span class="tumbler-icon">▶</span>
          Inventory Tracker
        </h4>
      </div>
      <span style="margin-right: 10px;" class="inventory-total">{{ inventoryItems.length }} items</span>
      <button class="add-btn" @click.stop="openInventoryAddMenu">+</button>
    </div>
    <div class="inventory-content">
      <div class="inventory-body">
        <div class="inventory-list">
          <div v-if="inventoryItems.length === 0" class="inventory-empty">
            No inventory items to track
          </div>
          <div v-for="item in inventoryItems" :key="item.id" class="inventory-item" @click="highlightPaymentDay(item)">
            <div class="inventory-details">
            <div class="cost-section">
              <div class="annual-cost-display">
                <div class="inventory-name">{{ item.itemName || 'Unnamed Item' }}</div>
                <div class="inventory-meta">
                  <span class="portions-left">{{ getPortionsRemaining(item).toFixed(2) }} portions left</span>
                  <span class="depletion-date" v-if="getEstimatedDepletionDate(item)">· {{ getEstimatedDepletionDate(item) }} remaining</span>
                  <span class="expiration-display" v-if="getExpirationDisplay(item)">· {{ getExpirationDisplay(item) }}</span>
                </div>
                <div class="inventory-amount">{{ item.amount }}</div>
              </div>
              <div class="inventory-menu">
                <button class="menu-btn" @click.stop="openEditMenu(item)">⋯</button>
              </div> 
            </div>

              <div class="cost-section" v-if="getAnnualCostFromPurchases(item) || getAnnualCostFromDepletion(item)">
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
                    ${{ getCurrentAnnualCostReactive(item, itemCostMethodPrefs).cost.toFixed(2) }}/year
                  </div>
                  <div class="annual-cost-details" v-if="getCurrentAnnualCostReactive(item, itemCostMethodPrefs)">
                    {{ getCurrentAnnualCostReactive(item, itemCostMethodPrefs).details }}
                  </div> 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Payment } from '../../types/payment.types'
import { isInventoryCollapsed, payments } from '../../stores/ui-state.store'
import {
  inventoryItems,
  getPortionsRemaining,
  getEstimatedDepletionDate,
  getAnnualCostFromPurchases,
  getAnnualCostFromDepletion,
  getCurrentAnnualCostReactive,
  isPurchaseExpired
} from '../../composables/payment-computables'
import {
  toggleInventorySection,
  openInventoryAddMenu,
  openEditMenu,
  highlightPaymentDay
} from '../../composables/payment-handlers'

// Reactive state for annual cost method preferences (item ID -> boolean)
const itemCostMethodPrefs = ref<Record<string, boolean>>({})

// Helper function to get expiration display text
const getExpirationDisplay = (item: Payment) => {
  if (!item.expirationPeriod || !item.expirationUnit) return null
  
  const expirationText = `${item.expirationPeriod} ${item.expirationUnit}${item.expirationPeriod === 1 ? '' : 's'}`
  const offsetText = item.freshnessOffset ? `, was fresh ${item.freshnessOffset} ${item.freshnessOffsetUnit || 'day'}${item.freshnessOffset === 1 ? '' : 's'} ago` : ''
  
  return `Shelf life: ${expirationText}${offsetText}`
}

// Helper function to check if purchase method can be used for an item
const canUsePurchaseMethod = (item: Payment) => {
  return getAnnualCostFromPurchases.value(item) !== null
}
</script>

<style scoped>
/* Inventory Tracker Section */
.inventory-section {
  margin-top: 24px;
  background: oklch(from var(--lime-primary) l c h / 0.05);
  border-radius: 12px;
  border: 1px solid oklch(from var(--lime-primary) l c h / 0.2);
  overflow: show;
}

.inventory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  transition: all 0.2s ease;
  background: oklch(from var(--grey-primary) l c h / 0.02);
}

.inventory-title-area {
  display: flex;
  align-items: center;
  flex: 1;
  cursor: pointer;
}

.inventory-header:hover {
  background: oklch(from var(--grey-primary) l c h / 0.05);
}

.inventory-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.inventory-total {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  background: oklch(from var(--grey-primary) l c h / 0.3);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid oklch(from var(--grey-light) l c h / 0.9);
}

.inventory-content {
  max-height: 290px;
  opacity: 1;
  transition: all 0.3s ease;
  overflow: auto;
}

.inventory-header.collapsed + .inventory-content {
  max-height: 0;
  opacity: 0;
}

.inventory-body {
  padding: 6px 24px 24px 24px;
}

.inventory-item {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 2px solid oklch(from var(--grey-primary) l c h / 0.1);
  transition: all 0.2s ease;
}

.inventory-item:hover {
  border-color: oklch(from var(--grey-light) l c h / 1);
}

.inventory-avatar {
  margin-right: 16px;
}

.avatar-circle.inventory {
  background: linear-gradient(135deg, oklch(from var(--grey-primary) l c h / 1), oklch(from var(--grey-light) l c h / 1));
  border: 2px solid oklch(from var(--grey-primary) l c h / 0.3);
}

.inventory-details {
  flex: 1;
}

.inventory-name {
  color: white;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 4px;
}

.inventory-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
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

.inventory-amount {
  font-weight: 700;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.inventory-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  padding: 20px 0;
  font-style: italic;
}

.inventory-menu {
  margin-left: auto;
  margin-right: 5px;
}

/* Annual Cost Estimate Section */
.cost-section {
  margin-top: 12px;
  padding: 12px;
  background: oklch(from var(--grey-primary) 0.1 c h / 0.3);
  border-radius: 8px;
  border: 2px solid oklch(from var(--grey-primary) l c h / 0.5);
  display: flex;
  align-items: flex-start;
  gap: 16px;
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
  font-size: 16px;
  font-weight: 700;
  font-family: monospace;
}

.annual-cost-method {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 500;
}

.annual-cost-details {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-weight: 400;
  line-height: 1.3;
}
</style>
