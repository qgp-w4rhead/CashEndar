// OCR provider abstraction: every provider turns an uploaded bill into raw
// text; providers that can also return structured line items directly
// (e.g. Mistral document annotations) fill `structured`.

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
  // true/false when a total was found and (mis)matches the line sum, null when no total
  sumMatchesTotal: boolean | null
  lines: ParsedLine[]
}

export interface OcrResult {
  rawText: string
  structured?: ParsedReceipt
}

export interface OcrProvider {
  id: string
  label: string
  // Why the provider is unavailable (e.g. missing API key) — shown in the UI
  isAvailable(): Promise<{ available: boolean, reason?: string }>
  supportsPdf: boolean
  extract(buffer: Buffer, mimetype: string): Promise<OcrResult>
}
