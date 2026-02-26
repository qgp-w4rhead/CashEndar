<template>
  <div class="total-remaining-section">
    <div class="total-remaining-header">
      <h4 class="total-remaining-title">Total Remaining Summary</h4>
      <span class="total-remaining-amount">{{ totalRemainingSummary }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { totalRemainingSummary } from '../../composables/payment-computables'
</script>

<style scoped>
/* Total Summary Section */
.total-remaining-section {
  margin-top: 24px;
  background: linear-gradient(270deg, oklch(from var(--lime-dark) l c h / 0.53) 0%, oklch(from var(--lime-primary) l c h / 1) 100%);
  border-radius: 12px;
  border: 1px solid oklch(from var(--lime-primary) l c h / 0.3);
  overflow: hidden;
  box-shadow: 0 8px 32px oklch(from var(--lime-primary) l c h / 0.2);
}

.total-remaining-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.total-remaining-title {
  color: white;
  font-size: var(--font-medium);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-remaining-amount {
  color: white;
  font-size: var(--font-v-big);
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Total Section */
.total-section {
  margin-top: 24px;
  background: linear-gradient(270deg, oklch(from var(--lime-primary) l c h / 0.53) 0%, oklch(from var(--lime-dark) l c h / 1) 100%);
  border-radius: 12px;
  border: 1px solid oklch(from var(--lime-primary) l c h / 0.3);
  overflow: hidden;
  box-shadow: 0 8px 32px oklch(from var(--lime-primary) l c h / 0.2);
}

.total-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
}

.total-title {
  color: white;
  font-size: var(--font-medium);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-amount {
  color: white;
  font-size: var(--font-v-big);
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
