// Mistral Document AI provider — best-in-class receipt OCR via the
// mistral-ocr-latest model. Uses document annotations (a JSON schema) so
// line items come back structured; falls back to the returned markdown +
// the shared heuristic parser when annotation parsing fails.
// Enabled by setting MISTRAL_API_KEY.
import { OcrProvider, OcrResult, ParsedReceipt, ParsedLine } from '../types'
import { parseReceiptText, extractDate } from '../receipt-parser'

const OCR_ENDPOINT = process.env.MISTRAL_OCR_URL || 'https://api.mistral.ai/v1/ocr'
const OCR_MODEL = process.env.MISTRAL_OCR_MODEL || 'mistral-ocr-latest'

// JSON schema for document annotations: what we want extracted per receipt
const RECEIPT_ANNOTATION_SCHEMA = {
  type: 'object',
  properties: {
    merchant: { type: 'string', description: 'Store / merchant name' },
    date: { type: 'string', description: 'Purchase date, ISO format YYYY-MM-DD' },
    total: { type: 'number', description: 'Final total amount paid' },
    lineItems: {
      type: 'array',
      description: 'Every purchased article on the receipt (exclude totals, taxes and payment lines; include discounts with negative totals)',
      items: {
        type: 'object',
        properties: {
          rawName: { type: 'string', description: 'Article name exactly as printed' },
          quantity: { type: 'number', description: 'Quantity bought, 1 if not printed' },
          unitPrice: { type: 'number', description: 'Price per unit if printed' },
          total: { type: 'number', description: 'Line total (negative for discounts)' },
        },
        required: ['rawName', 'total'],
      },
    },
  },
  required: ['lineItems'],
}

function structuredFromAnnotation(annotation: unknown): ParsedReceipt | undefined {
  let parsed: any = annotation
  if (typeof annotation === 'string') {
    try {
      parsed = JSON.parse(annotation)
    } catch {
      return undefined
    }
  }
  if (!parsed || !Array.isArray(parsed.lineItems)) return undefined

  const lines: ParsedLine[] = parsed.lineItems
    .filter((item: any) => item && typeof item.rawName === 'string' && typeof item.total === 'number')
    .map((item: any) => {
      const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1
      const isDiscount = item.total < 0
      return {
        rawName: item.rawName.trim(),
        quantity,
        unitPrice: typeof item.unitPrice === 'number'
          ? item.unitPrice
          : Math.abs(item.total) / quantity,
        lineTotal: item.total,
        ...(isDiscount ? { isDiscount: true } : {}),
      }
    })
  if (lines.length === 0) return undefined

  const total = typeof parsed.total === 'number' ? parsed.total : undefined
  let sumMatchesTotal: boolean | null = null
  if (total !== undefined) {
    const sum = lines.reduce((acc: number, line: ParsedLine) => acc + line.lineTotal, 0)
    sumMatchesTotal = Math.abs(sum - total) <= 0.05
  }

  return {
    store: typeof parsed.merchant === 'string' ? parsed.merchant : undefined,
    date: typeof parsed.date === 'string' ? (extractDate(parsed.date) ?? undefined) : undefined,
    total,
    sumMatchesTotal,
    lines,
  }
}

export const mistralProvider: OcrProvider = {
  id: 'mistral',
  label: 'Mistral OCR (cloud)',
  supportsPdf: true,

  async isAvailable() {
    return process.env.MISTRAL_API_KEY
      ? { available: true }
      : { available: false, reason: 'set MISTRAL_API_KEY on the server' }
  },

  async extract(buffer: Buffer, mimetype: string): Promise<OcrResult> {
    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) throw new Error('MISTRAL_API_KEY is not configured')

    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`
    const document = mimetype === 'application/pdf'
      ? { type: 'document_url', document_url: dataUri }
      : { type: 'image_url', image_url: dataUri }

    const response = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OCR_MODEL,
        document,
        document_annotation_format: {
          type: 'json_schema',
          json_schema: {
            name: 'receipt',
            schema: RECEIPT_ANNOTATION_SCHEMA,
          },
        },
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Mistral OCR error ${response.status}: ${body.slice(0, 500)}`)
    }

    const result: any = await response.json()
    const rawText = Array.isArray(result.pages)
      ? result.pages.map((page: any) => page.markdown ?? '').join('\n')
      : ''

    // Annotation missing/unusable — the markdown still goes through the
    // shared heuristic parser downstream
    const structured = structuredFromAnnotation(result.document_annotation)
    return structured ? { rawText, structured } : { rawText }
  },
}
