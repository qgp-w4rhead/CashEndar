import { OcrProviderStatus, ScanBillResponse } from '../types/ocr.types'
import { apiFetch, apiUpload } from './db'

export async function getOcrProviders(): Promise<OcrProviderStatus[]> {
  return apiFetch<OcrProviderStatus[]>('/ocr/providers')
}

export async function scanBill(file: File, provider: string): Promise<ScanBillResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('provider', provider)
  return apiUpload<ScanBillResponse>('/ocr/scan', formData)
}
