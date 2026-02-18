<template>
  <div class="payment-calendar">
    <div class="payments-sidebar">
      <div class="section-header">
        <h2 class="section-title">Next payments</h2>
        <div class="header-buttons">
          <button class="gear-btn" @click="openGearMenu" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              <path d="M12 8l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z"/>
              <circle cx="12" cy="12" r="1"/>
            </svg>
          </button>
          <Sort />
          <Filter />
          <button class="add-btn" @click="openAddMenu">+</button>
        </div>
      </div>

      <div v-for="payment in sortedPayments" :key="payment.id" class="payment-item" @click="highlightPaymentDay(payment)">
        <div class="payment-avatar">
          <div :class="`avatar-circle ${payment.type}`" :style="getAvatarStyle(payment.type)">{{ payment.type.charAt(0).toUpperCase() }}</div>
        </div>
        <div class="payment-details">
          <div class="payment-title">{{ payment.title }}</div>
          <div class="payment-date">{{ payment.date }}</div>
          <div :class="['payment-amount', getPaymentTypeClass(payment.type)]">{{ payment.amount }}</div>
        </div>
        <div class="payment-menu">
          <button class="menu-btn" @click.stop="openEditMenu(payment)">⋯</button>
        </div>
      </div>

      <div class="next-payments-section">
        <div
          :class="['next-payments-header', { collapsed: isNextPaymentsCollapsed }]"
          @click="toggleNextPaymentsSection"
        >
          <h4 class="next-payments-title">
            <span class="tumbler-icon">▶</span>
            Upcoming Payments Summary
          </h4>
          <span class="next-payments-total">-{{ nextPaymentsTotal }}</span>
        </div>
        <div class="next-payments-content">
          <div class="next-payments-body">
            <div class="next-payments-summary">
              <span class="next-payments-period">{{ nextPaymentsPeriod }}</span>
            </div>
            <div class="next-payments-list">
              <div v-if="nextPayments.length === 0" class="next-payments-empty">
                No upcoming payments for the rest of the month
              </div>
              <div v-for="payment in nextPayments" :key="payment.id" class="next-payment-item" @click="highlightPaymentDay(payment)">
                <span class="payment-id">#{{ payment.id }}</span>
                <span class="next-payment-name">{{ payment.title }}</span>
                <span class="next-payment-amount">-{{ payment.amount }} {{ payment.day }}th</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="earnings-section">
        <div
          :class="['earnings-header', { collapsed: isEarningsCollapsed }]"
          @click="toggleEarningsSection"
        >
          <h4 class="earnings-title">
            <span class="tumbler-icon">▶</span>
            Upcoming Earnings Summary
          </h4>
          <span class="earnings-total">{{ earningsTotal }}</span>
        </div>
        <div class="earnings-content">
          <div class="earnings-body">
            <div class="earnings-summary">
              <span class="earnings-period">{{ earningsPeriod }}</span>
            </div>
            <div class="earnings-list">
              <div v-if="nextEarnings.length === 0" class="earnings-empty">
                No upcoming earnings for the rest of the month
              </div>
              <div v-for="earning in nextEarnings" :key="earning.id" class="earning-item" @click="highlightPaymentDay(earning)">
                <span class="earning-id">#{{ earning.id }}</span>
                <span class="earning-name">{{ earning.title }}</span>
                <span class="earning-amount">{{ earning.amount }} {{ earning.day }}th</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Remaining />

      <Inventory />

      <TotalSection />
    </div>

    <Calendar />

    <div v-if="showEditMenu" class="modal-overlay edit-modal-overlay">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Payment</h3>
          <button class="close-btn" @click="closeEditMenu">×</button>
        </div>

        <div class="modal-body">

            <div v-if="editForm.type === 'inventory'">
              <InventoryFieldsSectionStepper
                :form-data="editForm"
                :get-estimated-portions="getEstimatedPortions"
                :get-depletion-time-in-days="getDepletionTimeInDays"
                :get-last-purchases="getLastPurchases"
                :get-estimated-next-purchase-date="getEstimatedNextPurchaseDate"
                @add-resupply="addResupply"
                @delete-purchase="deleteSinglePurchase"
                @save="savePayment"
              />
            </div>


            
            <div v-else>
              
              <div class="form-group side-by-side">
                <div class="form-field">
                  <label for="paymentTitle">Payment Title</label>
                  <input
                    id="paymentTitle"
                    v-model="editForm.title"
                    type="text"
                    class="form-input"
                    placeholder="Enter payment title"
                  >
                </div>
                <div class="form-field">
                  <div class="label-with-button">
                    <label for="paymentType">Payment Type</label>
                    <button class="add-type-btn" @click="addPaymentTypeFromEdit" title="Add new payment type">+</button>
                  </div>
                  <CustomDropdown
                    id="paymentType"
                    v-model="editForm.type"
                    :options="paymentTypeOptions"
                    placeholder="Select payment type"
                  />
                </div>
              </div>

              <div class="form-group side-by-side">
                <div class="form-field">
                  <label for="paymentAmount">Amount</label>
                  <input
                    id="paymentAmount"
                    v-model="editForm.amount"
                    type="number"
                    step="0.01"
                    class="form-input"
                    placeholder="0.00"
                    @blur="handleAmountInputBlur"
                    @keyup.enter="handleAmountInputKeyUp"
                  >
                </div>
                <div class="form-field">
                  <label for="paymentDate">Date</label>
                  <input
                    id="paymentDate"
                    v-model="editForm.date"
                    type="date"
                    class="form-input"
                    required
                  >
                </div>
              </div>
            </div>

          <div v-if="editForm.type !== 'inventory'" class="form-group">
            <div class="form-field">
              <label>Payment Frequency</label>
              <div class="toggle-switch">
                <div class="toggle-container four-options">
                  <button
                    :class="['toggle-option', { active: editForm.frequency === 'one-time' }]"
                    @click="editForm.frequency = 'one-time'"
                  >
                    One-Time
                  </button>
                  <button
                    :class="['toggle-option', { active: editForm.frequency === 'weekly' }]"
                    @click="editForm.frequency = 'weekly'"
                  >
                    Weekly
                  </button>
                  <button
                    :class="['toggle-option', { active: editForm.frequency === 'bi-monthly' }]"
                    @click="editForm.frequency = 'bi-monthly'"
                  >
                    Bi-Monthly
                  </button>
                  <button
                    :class="['toggle-option', { active: editForm.frequency === 'recurring' }]"
                    @click="editForm.frequency = 'recurring'"
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-separator"></div>

        <div class="modal-footer">
          <div class="btn-group">
            <button class="btn btn-success" @click="savePayment">
              Save Changes
            </button>
            <button class="btn btn-secondary" @click="deletePayment">
              Delete Payment
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddMenu" class="modal-overlay">
      <div class="add-modal" @click.stop>
        <div class="modal-header">
          <div v-if="selectedDayPayments.length === 0" class="selected-date-display" @click="openDatePicker">
            {{ getSelectedDayDate() }}
          </div>
          <div class="modal-toggle">
            <div class="toggle-switch">
              <div class="toggle-container two-options">
                <button
                  :class="['toggle-option', { active: addForm.type !== 'inventory' }]"
                  @click="setPaymentMode"
                >
                  Payment
                </button>
                <button
                  :class="['toggle-option', { active: addForm.type === 'inventory' }]"
                  @click="setInventoryMode"
                >
                  Inventory
                </button>
              </div>
            </div>
          </div>
          <button class="close-btn" @click="closeAddMenu">×</button>
        </div>

        <div class="modal-body">
          
          <div v-if="selectedDayPayments.length > 0" class="day-payments-section">
            <h4 class="section-subtitle">Payments for {{ getSelectedDayDate() }}</h4>
            <h4 class="underline-subtitle"></h4>
            <div class="day-payments-list">
              <div v-for="payment in selectedDayPayments" :key="payment.id" class="day-payment-item" :class="{ 'forgone-payment': forgoneInstances.has(payment.id) }">
                <div class="payment-avatar">
                  <div :class="`avatar-circle ${payment.type}`" :style="getAvatarStyle(payment.type)">{{ payment.type.charAt(0).toUpperCase() }}</div>
                </div>
                <div class="payment-details">
                  <div class="payment-title">{{ payment.title }}</div>
                  <div class="payment-time">{{ payment.time }}</div>
                  <div class="payment-amount">{{ payment.amount }}</div>
                </div>
                <div class="payment-menu">
                  <button
                    class="forgo-btn"
                    @click="toggleForgoPayment(payment)"
                    :title="payment.forgone ? 'Unforgo this payment' : 'Forgo this payment'"
                  >
                    {{ payment.forgone ? '↺' : '⊘' }}
                  </button>
                  <button class="menu-btn" @click="openEditMenu(payment)">⋯</button>
                </div>
              </div>
            </div>
          </div>

          <div class="add-payment-section">

            <div v-if="addForm.type === 'inventory'">
              <h3>{{ 'Add Inventory Item' }}</h3>
              <InventoryFieldsSectionStepper
                :form-data="addForm"
                :get-estimated-portions="getEstimatedPortionsFromData"
                :get-depletion-time-in-days="getDepletionTimeInDaysFromData"
                :get-last-purchases="getLastPurchases"
                :get-estimated-next-purchase-date="getEstimatedNextPurchaseDate"
                @add-resupply="addResupply"
                @delete-purchase="deleteSinglePurchase"
                @save="saveNewPayment"
              />
            </div>

            <div v-else>
              <h3>{{ 'Add New Payment' }}</h3>
              <div class="form-group side-by-side">
                <div class="form-field">
                  <div class="label-with-button payment-type-container">
                    <label for="addPaymentType" class="payment-type-end payment-type-clickable" @click="addPaymentTypeFromAdd">Payment Type</label>
                  </div>
                  <CustomDropdown
                    id="addPaymentType"
                    v-model="addForm.type"
                    :options="paymentTypeOptions"
                    placeholder="Select payment type"
                    class="dropdown-align-end"
                  />
                </div>
                <div class="form-field">
                  <label for="addPaymentTitle">Product / Service</label>
                  <input
                    id="addPaymentTitle"
                    v-model="addForm.title"
                    type="text"
                    class="form-input"
                    placeholder="Enter payment title"
                  >
                </div>
              </div>

              <div class="form-group">
                <div class="form-field amount-centered">
                  <label for="addPaymentAmount">Amount</label>
                  <input
                    id="addPaymentAmount"
                    v-model="addForm.amount"
                    type="number"
                    step="0.01"
                    class="form-input"
                    placeholder="0.00"
                    @blur="handleAmountInputBlur"
                    @keyup.enter="handleAmountInputKeyUp"
                  >
                </div>
              </div>
            </div>

            <div v-if="addForm.type !== 'inventory'" class="form-group">
              <label class="frequency-centered">Payment Frequency</label>
              <div class="toggle-switch">
                <div class="toggle-container four-options">
                  <button
                    :class="['toggle-option', { active: addForm.frequency === 'one-time' }]"
                    @click="addForm.frequency = 'one-time'"
                  >
                    One-Time
                  </button>
                  <button
                    :class="['toggle-option', { active: addForm.frequency === 'weekly' }]"
                    @click="addForm.frequency = 'weekly'"
                  >
                    Weekly
                  </button>
                  <button
                    :class="['toggle-option', { active: addForm.frequency === 'bi-monthly' }]"
                    @click="addForm.frequency = 'bi-monthly'"
                  >
                    Bi-Monthly
                  </button>
                  <button
                    :class="['toggle-option', { active: addForm.frequency === 'recurring' }]"
                    @click="addForm.frequency = 'recurring'"
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div v-if="saveMessage" class="save-message" :class="saveMessageType">
            {{ saveMessage }}
          </div>

          <div v-if="addForm.type !== 'inventory'" class="btn-group">
            <button
              class="btn btn-success"
              @click="saveNewPayment"
              :disabled="isSavingPayment"
              :class="{ 'btn-loading': isSavingPayment }"
            >
              <span v-if="isSavingPayment" class="loading-spinner"></span>
              {{ isSavingPayment ? 'Saving...' : (selectedDayPayments.length > 0 ? 'Add Payment' : 'Save Payment') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPaymentTypeModal" class="modal-overlay payment-type-modal-overlay">
      <div class="payment-type-modal" @click.stop>
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
            <div class="payment-types-list">
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
                    class="btn btn-danger btn-sm"
                    @click="confirmDeletePaymentType(type)"
                    title="Delete payment type"
                  >
                    Delete
                  </button>
                  <button
                    v-else
                    class="btn btn-secondary btn-sm"
                    disabled
                    title="Cannot delete default payment types"
                  >
                    Default
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="btn-group">
            <button class="btn btn-primary" @click="closePaymentTypeModal">
              Close
            </button>
            <button class="btn btn-success" @click="saveNewPaymentType">
              Add Payment Type
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPieChartModal" class="modal-overlay">
      <div class="pie-chart-modal" @click.stop>
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

              <div class="chart-legend-list">
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
              </div>
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
      </div>
    </div>

    <div v-if="showItemChartModal" class="modal-overlay">
      <div class="item-chart-modal" @click.stop>
        <div class="modal-header">
          <h3>Inventory Items Chart</h3>
          <button class="close-btn" @click="closeItemChartModal">×</button>
        </div>

        <div class="modal-body">
          <div class="chart-container">
            <div class="chart-header">
              <h4 class="chart-title">Compare Inventory Items</h4>
              <div class="chart-legend">
                <div class="chart-total">{{ itemChartItems.length }} items</div>
              </div>
            </div>

            <div class="item-comparison-table">
              <div class="table-header">
                <div class="header-cell">Item</div>
                <div class="header-cell">Portion Size</div>
                <div class="header-cell">Count</div>
                <div class="header-cell">Cost</div>
                <div class="header-cell">Est. Depletion</div>
              </div>

              <div
                v-for="item in itemChartItems"
                :key="item.item.id"
                class="table-row"
                :class="{ 'selected-row': selectedChartItem === item }"
                @click="selectedChartItem = item"
              >
                <div class="table-cell item-name">
                  <div class="item-avatar">
                    {{ item.itemName.charAt(0).toUpperCase() }}
                  </div>
                  <span>{{ item.itemName }}</span>
                </div>
                <div class="table-cell portion-size">
                  <div class="comparison-bar">
                    <div
                      :class="'bar-fill'"
                      :style="{
                        width: `${Math.min(100, ((item.item.itemSize && item.item.portionSize ? item.item.portionSize / item.item.itemSize : 0) * 100))}%`
                      }"
                    ></div>
                    <div
                      v-if="item.item.itemSize && item.item.portionSize && (item.item.portionSize / item.item.itemSize) > 1"
                      class="bar-fill-overdraw"
                      :style="{
                        width: `${Math.min(100, (((item.item.portionSize - item.item.itemSize) / item.item.itemSize) * 100))}%`
                      }"
                    ></div>
                  </div>
                  <span class="cell-value">{{ item.item.itemSize && item.item.portionSize ? getSimplifiedFraction(item.item.portionSize, item.item.itemSize) : 'N/A' }}</span>
                </div>
                <div class="table-cell portions-count">
                  <div class="comparison-bar">
                    <div
                      :class="'bar-fill'"
                      :style="{
                        width: `${Math.min(100, (getPortionsRemaining(item.item) / getTotalPortions(item.item)) * 100)}%`
                      }"
                    ></div>
                  </div>
                  <span class="cell-value">{{ getPortionsRemaining(item.item) }} / {{ getTotalPortions(item.item) }}</span>
                </div>
                <div class="table-cell product-cost">
                  <span class="cell-value">{{ item.productCost ? `$${item.productCost.toFixed(2)}` : '$0.00' }}</span>
                </div>
                <div class="table-cell depletion-date">
                  <span class="cell-value">{{ item.depletionDate || (getPortionsRemaining(item.item) <= 0 ? 'Depleted' : (item.isTracked ? 'No tracking' : 'No tracking')) }}</span>
                  <hover-text v-if="item.isTracked" :text="`Tracked with: ${item.item.depletionRate}`">
                    <span class="tracking-indicator" :class="{ 'depleted-indicator': getPortionsRemaining(item.item) <= 0 }">●</span>
                  </hover-text>
                </div>
              </div>
            </div>

            <div v-if="selectedChartItem" class="selected-item-details">
              <h4 class="details-title">Selected Item : {{ selectedChartItem.itemName }}</h4>
              <div class="details-flex">
                <div class="detail-item">
                  <label>Portion Size:</label>
                  <span>{{ selectedChartItem.portionSize || 'Not specified' }}</span>
                </div>
                <div class="detail-item">
                  <label>Portions Remaining:</label>
                  <span>{{ selectedChartItem.portionsCount || 0 }} portions</span>
                </div>
                <div class="detail-item">
                  <label>Product Cost:</label>
                  <span>{{ selectedChartItem.productCost ? `$${selectedChartItem.productCost.toFixed(2)}` : '$0.00' }}</span>
                </div>
                <div class="detail-item">
                  <label>Tracking:</label>
                  <span>{{ selectedChartItem.isTracked ? 'Enabled' : 'Disabled' }}</span>
                </div>
                <div v-if="selectedChartItem.depletionDate" class="detail-item">
                  <label>Est. Depletion Date:</label>
                  <span>{{ selectedChartItem.depletionDate }}</span>
                </div>
              </div>
            </div>

            <div class="chart-summary">
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Items:</span>
                  <span class="stat-value">{{ itemChartItems.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Tracked Items:</span>
                  <span class="stat-value">{{ itemChartItems.filter(i => i.isTracked).length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Total Value:</span>
                  <span class="stat-value">${{ itemChartItems.reduce((sum, item) => sum + (item.productCost || 0), 0).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showGearMenu" class="modal-overlay">
      <div class="gear-modal" @click.stop>
        <div class="modal-header">
          <h3>Settings</h3>
          <button class="close-btn" @click="closeGearMenu">×</button>
        </div>

        <div class="modal-body">
          <div class="settings-section">
            <h4 class="settings-title">Payment Management</h4>
            <div class="settings-options">
              <button class="settings-btn" @click="handleManagePaymentTypes">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Manage Payment Types
              </button>
              <button class="settings-btn" @click="exportPayments">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export Payments
              </button>
              <button class="settings-btn" @click="importPayments">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="17,10 12,15 7,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                </svg>
                Import Payments
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h4 class="settings-title">Calendar Settings</h4>
            <div class="settings-options">
              <button class="settings-btn" @click="resetCalendarView">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                Reset to Current Month
              </button>
              <button class="settings-btn" @click="clearAllPayments">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                  <line x1="10" y1="11" x2="10" y2="17"/>
                  <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                Clear All Payments
              </button>
            </div>
          </div>

          <div class="settings-section">
            <h4 class="settings-title">About</h4>
            <div class="settings-info">
              <p class="settings-text">Payment Calendar v1.0</p>
              <p class="settings-text">Manage your payments with ease</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

    <!-- Custom Date Picker Component -->
    <DatePicker
      :is-visible="showDatePicker"
      :initial-date="selectedDate"
      @close="closeDatePicker"
      @select="handleDateSelection"
    />
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import './PaymentCalendar.css'

import { Payment, PaymentType } from '../types/payment.types'

import InventoryFieldsSectionStepper from './primitives/inventoryStepper.vue'
import DatePicker from './primitives/DatePicker.vue'
import Sort from './sidebar/Sort.vue'
import Filter from './sidebar/Filter.vue'
import Remaining from './sidebar/Remaining.vue'
import Inventory from './sidebar/Inventory.vue'
import TotalSection from './sidebar/TotalSection.vue'
import Calendar from './calendar/Calendar.vue'
import CustomDropdown from './primitives/CustomDropdown.vue'

import { paymentService } from '../services/payment.service'
import { paymentTypeService } from '../services/payment-type.service'
import { calendarService } from '../services/calendar.service'
import { COLOR_PRESETS } from '../utils/constants'

import {
  currentDate,
  currentMonth,
  currentYear,
  isTransitioning,
  payments,
  paymentTypes,
  showEditMenu,
  editingPayment,
  editForm,
  showAddMenu,
  addForm,
  isSavingPayment,
  saveMessage,
  saveMessageType,
  selectedDate,
  selectedDayPayments,
  preSelectedDay,
  pulsatingDays,
  pulsatingTimer,
  showPaymentTypeModal,
  editingPaymentType,
  paymentTypeForm,
  showGearMenu,
  sortMode,
  showPieChartModal,
  showItemChartModal,
  hoveredSlice,
  modalStack,
  isNextPaymentsCollapsed,
  isEarningsCollapsed,
  isInventoryCollapsed,
  forgoneInstances,
  showEarningsInNextPayments,
  selectedPaymentTypes,
  isFilteringEnabled
} from '../stores/ui-state.store'

import {
  sortedPayments,
  currentMonthName,
  currentMonthYear,
  calendarDates,
  nextPayments,
  nextPaymentsTotal,
  nextPaymentsPeriod,
  nextEarnings,
  earningsTotal,
  earningsPeriod,
  totalRemainingSummary,
  allMonthPayments,
  allMonthEarnings,
  totalAmount,
  chartData,
  chartTotal,
  chartPeriod,
  largestCategory,
  getPaymentTypeClass,
  getPaymentTypeClassForDay,
  getDayStyle,
  getSlicePath,
  inventoryItems,
  getPortionsRemaining,
  getEstimatedPortions,
  getEstimatedPortionsFromData,
  getEstimatedDepletionDate,
  parsePortionSize,
  getTotalPortions,
  itemChartItems,
  selectedChartItem,
  getDepletionTimeInDays,
  getDepletionTimeInDaysFromData,
  getPortionSizeFraction,
  getLastPurchases,
  getEstimatedNextPurchaseDate,
  getAnnualCostFromPurchases,
  getAnnualCostFromDepletion,
  getCurrentAnnualCost,
  getCurrentAnnualCostReactive,
  getSimplifiedFraction
} from '../composables/payment-computables'

import {
  openModal,
  closeModal,
  handleEscapeKey,
  openGearMenu,
  closeGearMenu,
  exportPayments,
  importPayments,
  resetCalendarView,
  clearAllPayments,
  openPaymentTypeModal,
  closePaymentTypeModal,
  savePaymentType,
  deletePaymentType,
  confirmDeletePaymentType,
  saveNewPaymentType,
  addPaymentTypeFromEdit,
  addPaymentTypeFromAdd,
  handleManagePaymentTypes,
  openEditMenu,
  closeEditMenu,
  savePayment,
  deletePayment,
  openAddMenu,
  openInventoryAddMenu,
  closeAddMenu,
  handleDayClick,
  showDayPaymentsForDay,
  resetDayPayments,
  getSelectedDayDate,
  saveNewPayment,
  showMessage,
  highlightPaymentDay,
  goToPrevMonth,
  goToNextMonth,
  toggleNextPaymentsSection,
  toggleEarningsSection,
  toggleInventorySection,
  togglePieChart,
  closePieChartModal,
  toggleItemChart,
  closeItemChartModal,
  loadPayments,
  loadPaymentTypes,
  initializeComponent,
  formatCurrencyAmount,
  handleAmountInputBlur,
  handleAmountInputKeyUp,
  addResupply,
  deleteSinglePurchase,
  toggleForgoPayment,
  openDatePicker,
  closeDatePicker,
  handleDateSelection,
  showDatePicker
} from '../composables/payment-handlers'

// Color presets from shared constants
const colorPresets = COLOR_PRESETS


// Helper function to display frequency in a user-friendly format
const getFrequencyDisplay = (frequency: string) => {
  switch (frequency) {
    case 'one-time':
      return 'One-Time'
    case 'weekly':
      return 'Weekly'
    case 'bi-monthly':
      return 'Bi-Monthly'
    case 'recurring':
      return 'Monthly'
    default:
      return frequency
  }
}


// Helper function to get avatar style for custom payment types
const getAvatarStyle = (paymentTypeValue: string) => {
  const paymentType = paymentTypes.value.find(type => type.value === paymentTypeValue)
  if (paymentType && paymentType.isCustom) {
    return { background: `linear-gradient(135deg, ${paymentType.color}, ${paymentType.color}dd)` }
  }
  return {}
}

// Convert paymentTypes to dropdown options format
const paymentTypeOptions = computed(() => {
  return paymentTypes.value
    .filter(t => t.value !== 'inventory')
    .map(type => ({
      value: type.value,
      label: type.label
    }))
})


// Toggle between payment and inventory modes in add modal
const setPaymentMode = () => {
  // Switch to regular payment mode - prefer credit card, fallback to first available
  const regularPaymentTypes = paymentTypes.value.filter(t => t.value !== 'inventory')
  const creditType = regularPaymentTypes.find(t => t.value === 'credit')

  if (creditType) {
    addForm.type = creditType.value
  } else if (regularPaymentTypes.length > 0) {
    addForm.type = regularPaymentTypes[0].value
  } else {
    // Fallback if no regular payment types exist
    addForm.type = 'utility' // Default fallback
  }
}

const setInventoryMode = () => {
  // Switch to inventory mode
  addForm.type = 'inventory'
}

// Initialize component on mount
onMounted(async () => {
  await initializeComponent()
  document.addEventListener('keydown', handleEscapeKey)
})
</script>
