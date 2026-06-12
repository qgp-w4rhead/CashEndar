// Mirrors the server-side OCR types (server/ocr/types.ts)

export interface ParsedLine {
  rawName: string
  quantity: number
  unitPrice?: number
  lineTotal: number
  isDiscount?: boolean
}

export interface ParsedReceipt {
  store?: string
  date?: string // YYYY-MM-DD
  total?: number
  sumMatchesTotal: boolean | null
  lines: ParsedLine[]
}

export interface OcrProviderStatus {
  id: string
  label: string
  available: boolean
  supportsPdf: boolean
  reason?: string
}

export interface ScanBillResponse {
  provider: string
  receipt: ParsedReceipt
  rawText: string
}
