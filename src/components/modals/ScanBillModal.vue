<template>
  <div v-if="showScanBillModal" class="modal-overlay scan-overlay">
    <CustomScrollbar class="scan-modal" :class="{ wide: stage === 'review' }" direction="vertical" max-height="90vh" @click.stop>
      <div class="modal-header">
        <h3>📷 Scan a bill</h3>
        <button class="close-btn" @click="closeScanBillModal">×</button>
      </div>

      <div class="modal-body">
        <!-- Stage 1: upload -->
        <template v-if="stage === 'upload'">
          <div
            class="dropzone"
            :class="{ dragging: isDragging }"
            @click="fileInput?.click()"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*,application/pdf"
              class="hidden-input"
              @change="handleFilePick"
            />
            <template v-if="selectedFile">
              <div class="file-chip">
                {{ selectedFile.name }}
                <span class="file-size">({{ (selectedFile.size / 1024 / 1024).toFixed(1) }} MB)</span>
              </div>
              <span class="drop-hint">click or drop to replace</span>
            </template>
            <template v-else>
              <div class="drop-icon">🧾</div>
              <div class="drop-text">Drop a photo of your bill here</div>
              <span class="drop-hint">or click to pick a file — images everywhere, PDF with Mistral</span>
            </template>
          </div>

          <div class="provider-row">
            <label class="provider-label">OCR engine</label>
            <CustomDropdown
              v-model="selectedProvider"
              :options="providerOptions"
              class="provider-dropdown"
            />
          </div>
          <p v-if="selectedProviderStatus && !selectedProviderStatus.available" class="provider-warning">
            {{ selectedProviderStatus.label }} is not available{{ selectedProviderStatus.reason ? ` — ${selectedProviderStatus.reason}` : '' }}
          </p>

          <p v-if="scanError" class="scan-error">{{ scanError }}</p>

          <div class="upload-footer">
            <button
              class="scan-btn"
              :disabled="!selectedFile || !selectedProviderStatus?.available"
              @click="startScan"
            >
              Analyze bill
            </button>
          </div>
        </template>

        <!-- Stage 2: scanning -->
        <template v-else-if="stage === 'scanning'">
          <div class="scanning-state">
            <div class="scanning-spinner"></div>
            <div class="scanning-text">Reading your bill with {{ selectedProviderStatus?.label }}…</div>
            <span class="drop-hint">local engines can take ~10-30s on first run</span>
          </div>
        </template>

        <!-- Stage 3: review -->
        <template v-else-if="stage === 'review' && scanResult">
          <ReceiptReviewGrid
            :receipt="scanResult.receipt"
            @cancel="stage = 'upload'"
            @done="handleDone"
          />
        </template>
      </div>
    </CustomScrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { showScanBillModal } from '../../stores/ui-state.store'
import { closeScanBillModal, showMessage } from '../../composables/payment-handlers'
import { getOcrProviders, scanBill } from '../../repositories/ocr.repository'
import { OcrProviderStatus, ScanBillResponse } from '../../types/ocr.types'
import CustomScrollbar from '../primitives/CustomScrollbar.vue'
import CustomDropdown from '../primitives/CustomDropdown.vue'
import ReceiptReviewGrid from './ReceiptReviewGrid.vue'

const stage = ref<'upload' | 'scanning' | 'review'>('upload')
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const scanError = ref('')
const scanResult = ref<ScanBillResponse | null>(null)

const providers = ref<OcrProviderStatus[]>([])
const selectedProvider = ref('tesseract')

// (Re)load provider availability every time the modal opens
watch(showScanBillModal, async (open) => {
  if (!open) return
  stage.value = 'upload'
  scanError.value = ''
  scanResult.value = null
  try {
    providers.value = await getOcrProviders()
    const firstAvailable = providers.value.find(p => p.available)
    if (firstAvailable && !providers.value.find(p => p.id === selectedProvider.value)?.available) {
      selectedProvider.value = firstAvailable.id
    }
  } catch (error) {
    console.error('Error loading OCR providers:', error)
    scanError.value = 'Could not reach the OCR service — is the server running?'
  }
})

const providerOptions = computed(() => providers.value.map(provider => ({
  value: provider.id,
  label: provider.available ? provider.label : `${provider.label} — unavailable`,
  disabled: !provider.available,
})))

const selectedProviderStatus = computed(() => providers.value.find(p => p.id === selectedProvider.value))

const setFile = (file: File | undefined | null) => {
  if (!file) return
  scanError.value = ''
  if (file.type === 'application/pdf' && !selectedProviderStatus.value?.supportsPdf) {
    const pdfProvider = providers.value.find(p => p.available && p.supportsPdf)
    if (pdfProvider) {
      selectedProvider.value = pdfProvider.id
    } else {
      scanError.value = 'PDF bills need the Mistral provider (set MISTRAL_API_KEY) — or upload a photo instead'
      return
    }
  }
  selectedFile.value = file
}

const handleFilePick = (event: Event) => {
  setFile((event.target as HTMLInputElement).files?.[0])
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  setFile(event.dataTransfer?.files?.[0])
}

const startScan = async () => {
  if (!selectedFile.value) return
  stage.value = 'scanning'
  scanError.value = ''
  try {
    scanResult.value = await scanBill(selectedFile.value, selectedProvider.value)
    stage.value = 'review'
  } catch (error) {
    console.error('Error scanning bill:', error)
    scanError.value = error instanceof Error ? error.message : 'Scan failed'
    stage.value = 'upload'
  }
}

const handleDone = (count: number) => {
  showMessage(`Added ${count} purchase${count === 1 ? '' : 's'} from the scanned bill`, 'success')
  selectedFile.value = null
  closeScanBillModal()
}
</script>

<style scoped>
.scan-overlay {
  z-index: 1100;
}

.scan-modal {
  background: linear-gradient(135deg, var(--grey-dark) 0%, oklch(from var(--grey-primary) l c h / 0.5) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  width: 95%;
  max-width: 560px;
  animation: modalSlideIn 0.3s ease-out;
  transition: max-width 0.3s ease;
}

.scan-modal.wide {
  max-width: 1000px;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-100px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: var(--font-medium);
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: white;
}

.modal-body {
  padding: 20px 24px;
}

/* Dropzone */
.dropzone {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dropzone:hover,
.dropzone.dragging {
  border-color: var(--lime-primary);
  background: oklch(from var(--lime-primary) l c h / 0.05);
}

.hidden-input {
  display: none;
}

.drop-icon {
  font-size: 36px;
}

.drop-text {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
}

.drop-hint {
  color: rgba(255, 255, 255, 0.45);
  font-size: var(--font-x-small);
}

.file-chip {
  color: var(--lime-light);
  font-weight: 600;
  font-size: var(--font-small);
  word-break: break-all;
}

.file-size {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

/* Provider picker */
.provider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.provider-label {
  color: var(--grey-light);
  font-size: var(--font-x-small);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.provider-dropdown {
  flex: 1;
}

.provider-warning {
  margin: 8px 0 0;
  color: #fbbf24;
  font-size: var(--font-x-small);
}

.scan-error {
  margin: 12px 0 0;
  color: #f87171;
  font-size: var(--font-x-small);
}

.upload-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.scan-btn {
  background: oklch(from var(--lime-primary) l c h / 0.25);
  border: 1px solid var(--lime-primary);
  color: var(--lime-light);
  border-radius: 8px;
  padding: 10px 22px;
  font-size: var(--font-small);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scan-btn:hover:not(:disabled) {
  background: oklch(from var(--lime-primary) l c h / 0.4);
}

.scan-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Scanning state */
.scanning-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 40px 20px;
}

.scanning-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--lime-primary);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.scanning-text {
  color: white;
  font-weight: 600;
  font-size: var(--font-small);
}
</style>
