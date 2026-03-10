<template>
  <CustomScrollbar class="payment-type-modal" max-height="90vh" @click.stop>
    <div class="modal-header">
      <h3>Manage Payment Types</h3>
      <button class="close-btn" @click="closePaymentTypeModal">×</button>
    </div>

    <div class="modal-body">
      <div class="add-type-section">
        <h4 class="section-subtitle">Add New Payment Type</h4>
        <hr></hr>

        <div class="form-group side-by-side">
          <div class="form-field">
            <div class="label-with-char-count">
              <label for="typeName">Payment Type Name</label>
              <div class="char-count">{{ paymentTypeForm.name.length }}/30</div>
            </div>
            <input
              id="typeName"
              v-model="paymentTypeForm.name"
              type="text"
              class="form-input full"
              placeholder="Enter payment type name"
              maxlength="30"
            >
          </div>
          <div class="form-field">
            <label>Type</label>
            <div class="toggle-switch">
              <div class="toggle-container two-options">
                <button
                  :class="['toggle-option', { active: !paymentTypeForm.isEarning }]"
                  @click="paymentTypeForm.isEarning = false"
                >
                  Payment
                </button>
                <button
                  :class="['toggle-option', { active: paymentTypeForm.isEarning }]"
                  @click="paymentTypeForm.isEarning = true"
                >
                  Earning
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <div class="form-field">
            <label>Color</label>
            <div class="color-picker side-by-side">
              <div class="color-presets">
                <button
                  v-for="preset in colorPresets"
                  :key="preset.color"
                  :class="['color-preset', { active: paymentTypeForm.color === preset.color }]"
                  :style="{ backgroundColor: preset.color }"
                  @click="paymentTypeForm.color = preset.color"
                  :title="preset.name"
                ></button>
              </div>
              <div class="custom-color-input">
                <input
                  type="color"
                  v-model="paymentTypeForm.color"
                  class="color-input"
                >
                <span class="color-value">{{ paymentTypeForm.color }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <div class="form-field">
            <label>Preview</label>
            <div class="color-preview">
              <div
                class="preview-circle"
                :style="{ backgroundColor: paymentTypeForm.color }"
              >
                {{ paymentTypeForm.name.charAt(0).toUpperCase() || 'A' }}
              </div>
              <span class="preview-text">{{ paymentTypeForm.name || 'Preview' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="existing-types-section">
        <h4 class="section-subtitle">Existing Payment Types</h4>
        <hr></hr>
        <CustomScrollbar class="payment-types-list" max-height="360px" variant="thin">
          <div v-for="type in paymentTypes" :key="type.id" class="payment-type-item">
            <div class="type-info">
              <div class="type-preview">
                <div
                  class="type-circle"
                  :style="{ backgroundColor: type.color }"
                >
                  {{ type.label.charAt(0).toUpperCase() }}
                </div>
                <div class="type-details">
                  <div class="type-label">{{ type.label }}</div>
                  <div class="type-value">{{ type.value }}</div>
                </div>
              </div>
            </div>
            <div class="type-actions">
              <button
                v-if="type.isCustom"
                class="btn danger sm"
                @click="confirmDeletePaymentType(type)"
                title="Delete payment type"
              >
                Delete
              </button>
              <button
                v-else
                class="btn secondary sm"
                disabled
                title="Cannot delete default payment types"
              >
                Default
              </button>
            </div>
          </div>
        </CustomScrollbar>
      </div>
    </div>

    <div class="modal-footer">
      <div class="btn-group">
        <button class="btn primary" @click="closePaymentTypeModal">
          Close
        </button>
        <button class="btn success" @click="saveNewPaymentType">
          Add Payment Type
        </button>
      </div>
    </div>
  </CustomScrollbar>
</template>

<script setup lang="ts">
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import { COLOR_PRESETS } from '../../utils/constants'
import { paymentTypes, paymentTypeForm } from '../../stores/ui-state.store'

import {
  closePaymentTypeModal,
  saveNewPaymentType,
  confirmDeletePaymentType
} from '../../composables/payment-handlers'

const colorPresets = COLOR_PRESETS
</script>
