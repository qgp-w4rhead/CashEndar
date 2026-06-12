// OCR provider registry
import { OcrProvider } from './types'
import { tesseractProvider } from './providers/tesseract.provider'
import { easyocrProvider } from './providers/easyocr.provider'
import { mistralProvider } from './providers/mistral.provider'

export const ocrProviders: OcrProvider[] = [
  tesseractProvider,
  easyocrProvider,
  mistralProvider,
]

export function getProvider(id: string): OcrProvider | undefined {
  return ocrProviders.find(provider => provider.id === id)
}

export interface ProviderStatus {
  id: string
  label: string
  available: boolean
  supportsPdf: boolean
  reason?: string
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  return Promise.all(ocrProviders.map(async provider => {
    const { available, reason } = await provider.isAvailable()
    return {
      id: provider.id,
      label: provider.label,
      available,
      supportsPdf: provider.supportsPdf,
      ...(reason ? { reason } : {}),
    }
  }))
}
