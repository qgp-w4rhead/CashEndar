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
    <CustomScrollbar class="inventory-content" max-height="290px" variant="thin">
      <div class="inventory-body">
        <div class="inventory-list">
          <div v-if="inventoryItems.length === 0" class="inventory-empty">
            No inventory items to track
          </div>
          <div v-for="item in inventoryItems" :key="item.id" class="inventory-item" @click="highlightPaymentDay(item)">
            <div class="inventory-details">
              <InventoryCostSection 
                :item="item"
                @edit-item="openEditMenu"
              />
            </div>
          </div>
        </div>
      </div>
    </CustomScrollbar>
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
import InventoryCostSection from './InventoryCostSection.vue'
import CustomScrollbar from '../primitives/CustomScrollbar.vue'

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
  font-size: var(--font-medium);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.inventory-total {
  color: #ffffff;
  font-size: var(--font-small);
  font-weight: 500;
  background: oklch(from var(--grey-primary) l c h / 0.3);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid oklch(from var(--grey-light) l c h / 0.9);
}

.inventory-content {
  opacity: 1;
  transition: all 0.3s ease;
}

.inventory-header.collapsed + .inventory-content {
  max-height: 0 !important;
  opacity: 0;
  height: 0 !important;
}

.inventory-header.collapsed + .inventory-content .custom-scrollbar {
  height: 0 !important;
}

.inventory-header.collapsed + .inventory-content .scroll-content {
  height: 0 !important;
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
  font-size: var(--font-medium);
  margin-bottom: 4px;
}

.inventory-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-x-small);
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
  font-size: var(--font-medium);
  color: rgba(255, 255, 255, 0.8);
}

.inventory-empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: var(--font-small);
  padding: 20px 0;
  font-style: italic;
}

.inventory-menu {
  margin-left: auto;
  margin-right: 5px;
}

</style>
