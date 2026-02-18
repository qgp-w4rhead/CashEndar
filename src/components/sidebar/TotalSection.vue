<template>
  <div class="total-section">
    <div class="total-header">
      <h4 class="total-title">Total</h4>
      <span class="total-amount">{{ totalAmount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { totalAmount } from '../../composables/payment-computables'
</script>

<style scoped>
/* Total Section */
.total-section {
  margin-top: 24px;
  background: linear-gradient(270deg, #10b98186, #059669 100%);
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.3);
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.2);
}

.total-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.total-title {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.total-amount {
  color: white;
  font-size: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
