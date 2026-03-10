<template>
  <CustomScrollbar class="pie-chart-modal" max-height="90vh" @click.stop>
    <div class="modal-header">
      <h3>Payment Summary Chart</h3>
      <button class="close-btn" @click="closePieChartModal">×</button>
    </div>

    <div class="modal-body">
      <div class="chart-container">
        <div class="chart-header">
          <h4 class="chart-title">{{ chartPeriod }}</h4>
          <div class="chart-legend">
            <div class="chart-total">{{ chartTotal }}</div>
          </div>
        </div>

        <div class="pie-chart-wrapper">
          <svg class="pie-chart-svg" viewBox="0 0 200 200">

            <g v-for="(slice, index) in chartData" :key="slice.type">
              <path
                :d="getSlicePath(slice, index)"
                :fill="slice.color"
                :stroke="slice.color"
                stroke-width="2"
                class="pie-slice"
                :class="{ 'slice-highlighted': hoveredSlice === slice.type }"
                @mouseenter="hoveredSlice = slice.type"
                @mouseleave="hoveredSlice = null"
              />
            </g>

            <circle cx="100" cy="100" r="40" fill="var(--bg-color)" opacity="0.75"/>
          </svg>

          <div v-if="chartData.length === 0" class="stat-value">
            <p>No information for this month</p>
          </div>

          <CustomScrollbar class="chart-legend-list" max-height="250px" variant="thin">
            <div
              v-for="slice in chartData"
              :key="slice.type"
              class="legend-item"
              :class="{ 'legend-highlighted': hoveredSlice === slice.type }"
              @mouseenter="hoveredSlice = slice.type"
              @mouseleave="hoveredSlice = null"
            >
              <div class="legend-color" :style="{ backgroundColor: slice.color }"></div>
              <div class="legend-info">
                <div class="legend-label">{{ slice.label }}</div>
                <div class="legend-value">{{ slice.formattedAmount }}</div>
                <div class="legend-percentage">{{ slice.percentage }}%</div>
              </div>
            </div>
          </CustomScrollbar>
        </div>

        <div class="chart-summary">
          <div class="summary-stats">
            <div class="stat-item">
              <span class="stat-label">Total Payments:</span>
              <span class="stat-value">{{ chartTotal }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Categories:</span>
              <span class="stat-value">{{ chartData.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Largest Category:</span>
              <span class="stat-value">{{ largestCategory }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CustomScrollbar>
</template>

<script setup lang="ts">
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import { hoveredSlice } from '../../stores/ui-state.store'

import {
  chartData,
  chartTotal,
  chartPeriod,
  largestCategory,
  getSlicePath
} from '../../composables/payment-computables'

import {
  closePieChartModal
} from '../../composables/payment-handlers'
</script>
