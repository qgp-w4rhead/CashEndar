// Tesseract.js provider — pure JS/WASM, zero-config default. Quality on
// crumpled receipts is modest; the review grid catches the rest.
import { OcrProvider, OcrResult } from '../types'

let workerPromise: Promise<any> | null = null

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js')
      return createWorker('eng')
    })()
  }
  return workerPromise
}

export const tesseractProvider: OcrProvider = {
  id: 'tesseract',
  label: 'Tesseract (local)',
  supportsPdf: false,

  async isAvailable() {
    return { available: true }
  },

  async extract(buffer: Buffer, _mimetype: string): Promise<OcrResult> {
    const worker = await getWorker()
    const { data } = await worker.recognize(buffer)
    return { rawText: data.text ?? '' }
  },
}
