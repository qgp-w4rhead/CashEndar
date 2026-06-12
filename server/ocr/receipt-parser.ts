// Heuristic receipt parser: turns raw OCR text into structured line items.
// Pure function — fully unit-testable, shared by all OCR providers that
// don't return structured data themselves.
import { ParsedLine, ParsedReceipt } from './types'

// Lines that are receipt plumbing, not articles
const SKIP_PATTERN = /\b(subtotal|sous[- ]total|total\s+(due|tax)|tax|tva|vat|cash|card|change|credit|debit|balance|due|tender|payment|invoice|receipt|merci|thank|welcome|cashier|terminal|approval|auth|ref\b|www\.|http)/i
const TOTAL_PATTERN = /\btotal\b/i
const SUBTOTAL_PATTERN = /\b(sub|sous)[- ]?total\b/i
const DISCOUNT_PATTERN = /\b(discount|rabais|remise|coupon|promo|sale|off|savings?)\b/i

// Money tokens with optional sign/currency before or after ("$1.99",
// "4,99 €", "0.50-")
const ANY_PRICE_PATTERN = /-?[$€£]?\d{1,5}[.,]\d{2}(?:\s?[-€£$])?/g

// "2 x 1.99" / "2 @ 1.99" quantity-with-unit-price patterns
const QTY_AT_PRICE_PATTERN = /(\d{1,3})\s*[xX@*]\s*[$€£]?(\d{1,5}[.,]\d{2})/
// "0.512 kg x 2.99" weighed items
const WEIGHT_PATTERN = /(\d+[.,]\d{1,3})\s*(kg|lb)\s*[xX@*]\s*[$€£]?(\d{1,5}[.,]\d{2})/i
// Leading small quantity: "2 MILK" or "2x MILK"
const LEADING_QTY_PATTERN = /^(\d{1,2})\s*[xX]?\s+(?=[A-Za-z])/

const parseMoney = (token: string): number => {
  const negative = /-/.test(token)
  const cleaned = token.replace(/[^0-9.,]/g, '').replace(',', '.')
  const value = parseFloat(cleaned)
  return negative ? -value : value
}

const lastPriceOf = (line: string): number | null => {
  const matches = line.match(ANY_PRICE_PATTERN)
  if (!matches || matches.length === 0) return null
  return parseMoney(matches[matches.length - 1])
}

// Extract a date from any line; supports YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY,
// DD.MM.YY... Ambiguous day/month defaults to day-first.
export function extractDate(text: string): string | null {
  const isoMatch = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    if (+month >= 1 && +month <= 12 && +day >= 1 && +day <= 31) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
  }

  const dmyMatch = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/)
  if (dmyMatch) {
    let [, first, second, year] = dmyMatch
    if (year.length === 2) year = `20${year}`
    let day: number
    let month: number
    if (+first > 12) {
      day = +first
      month = +second
    } else if (+second > 12) {
      month = +first
      day = +second
    } else {
      // Ambiguous — day-first is the worldwide majority on receipts
      day = +first
      month = +second
    }
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  return null
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const rawLines = rawText
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)

  const lines: ParsedLine[] = []
  let store: string | undefined
  let date: string | undefined
  let total: number | undefined

  rawLines.forEach((line, index) => {
    if (!date) {
      const found = extractDate(line)
      if (found) date = found
    }

    const price = lastPriceOf(line)

    // Store name: first early line that has no price and isn't junk
    if (!store && index < 5 && price === null) {
      const candidate = line.replace(/[*=_-]{2,}/g, '').trim()
      if (candidate.length >= 3 && !/\d{4,}/.test(candidate) && !extractDate(candidate)) {
        store = candidate
      }
    }

    if (price === null) return

    // Total line (but not subtotal): keep the last one seen
    if (TOTAL_PATTERN.test(line) && !SUBTOTAL_PATTERN.test(line)) {
      total = Math.abs(price)
      return
    }

    if (SKIP_PATTERN.test(line)) return

    // Pull quantity/weight info out of the original line BEFORE stripping
    // prices — price-stripping would mangle decimals like "0.512 kg"
    let quantity = 1
    let unitPrice: number | undefined
    let name: string

    const weightMatch = line.match(WEIGHT_PATTERN)
    const qtyAtMatch = line.match(QTY_AT_PRICE_PATTERN)
    if (weightMatch) {
      // Weighed item: quantity stays 1, unit price is the per-kg rate
      unitPrice = parseMoney(weightMatch[3])
      name = line.replace(WEIGHT_PATTERN, ' ')
    } else if (qtyAtMatch) {
      quantity = parseInt(qtyAtMatch[1], 10)
      unitPrice = parseMoney(qtyAtMatch[2])
      name = line.replace(QTY_AT_PRICE_PATTERN, ' ')
    } else {
      name = line
    }

    name = name.replace(ANY_PRICE_PATTERN, ' ').replace(/\s+/g, ' ').trim()

    if (!weightMatch && !qtyAtMatch) {
      const leadingQty = name.match(LEADING_QTY_PATTERN)
      if (leadingQty) {
        quantity = parseInt(leadingQty[1], 10)
        name = name.replace(LEADING_QTY_PATTERN, '').trim()
      }
    }

    // Drop leftover codes/punctuation noise around the name
    name = name.replace(/^[-*#@:.\s]+|[-*#@:.\s]+$/g, '').trim()
    if (name.length < 2 || /^\d+$/.test(name)) return

    const isDiscount = price < 0 || DISCOUNT_PATTERN.test(line)
    const lineTotal = isDiscount ? -Math.abs(price) : price

    lines.push({
      rawName: name,
      quantity: Math.max(1, quantity),
      unitPrice: unitPrice ?? (quantity > 1 ? Math.abs(lineTotal) / quantity : Math.abs(lineTotal)),
      lineTotal,
      ...(isDiscount ? { isDiscount: true } : {}),
    })
  })

  let sumMatchesTotal: boolean | null = null
  if (total !== undefined) {
    const sum = lines.reduce((acc, line) => acc + line.lineTotal, 0)
    sumMatchesTotal = Math.abs(sum - total) <= 0.05
  }

  return { store, date, total, sumMatchesTotal, lines }
}
