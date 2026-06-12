// Deal forecasting and purchase-diff analysis. Pure functions over price
// points and payments — no reactive state, fully unit-testable.
import { Payment } from '../types/payment.types'
import { parsePaymentDate, parseAmount } from '../utils/date-utils'

export interface ForecastPricePoint {
  date: Date
  price: number
}

export interface CheapWindowPrediction {
  kind: 'seasonal' | 'interval'
  nextDate: Date
  monthOfYear?: number // 0-11, for seasonal predictions
  confidence: 'low' | 'medium' | 'high'
  typicalLow: number   // what a good price historically looks like
  typicalPrice: number // overall mean price
  overdue: boolean     // the predicted window is already due
}

const DAY_MS = 24 * 60 * 60 * 1000

const mean = (values: number[]): number => values.reduce((s, v) => s + v, 0) / values.length

const std = (values: number[]): number => {
  const m = mean(values)
  return Math.sqrt(mean(values.map(v => (v - m) ** 2)))
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

const percentile = (values: number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const index = (sorted.length - 1) * p
  const low = Math.floor(index)
  const high = Math.ceil(index)
  return sorted[low] + (sorted[high] - sorted[low]) * (index - low)
}

// Predict when an item will likely be cheap again from its price history.
// Strategy 1 (seasonal): months-of-year whose mean price sits clearly below
// the overall mean are "cheap months" — predict the next one.
// Strategy 2 (interval): prices at/below the 25th percentile are "deals";
// the median gap between deals predicts the next one.
// Returns null when there isn't enough history (≥4 points spanning ≥3 months).
export function predictCheapWindow(
  points: ForecastPricePoint[],
  today: Date = new Date()
): CheapWindowPrediction | null {
  if (points.length < 4) return null

  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime())
  const spanDays = (sorted[sorted.length - 1].date.getTime() - sorted[0].date.getTime()) / DAY_MS
  if (spanDays < 60) return null // need ~3 calendar months of spread

  const prices = sorted.map(p => p.price)
  const overallMean = mean(prices)
  const overallStd = std(prices)

  // --- Strategy 1: month-of-year seasonality ---
  if (overallStd > 0) {
    const byMonth = new Map<number, number[]>()
    sorted.forEach(point => {
      const month = point.date.getMonth()
      if (!byMonth.has(month)) byMonth.set(month, [])
      byMonth.get(month)!.push(point.price)
    })

    const cheapMonths: number[] = []
    byMonth.forEach((monthPrices, month) => {
      if (mean(monthPrices) <= overallMean - 0.5 * overallStd) {
        cheapMonths.push(month)
      }
    })

    // Seasonality is only meaningful if some — but not all — months are cheap
    if (cheapMonths.length > 0 && cheapMonths.length < byMonth.size) {
      let bestDate: Date | null = null
      let bestMonth = -1
      cheapMonths.forEach(month => {
        const candidate = new Date(today.getFullYear(), month, 1)
        if (candidate < new Date(today.getFullYear(), today.getMonth(), 1)) {
          candidate.setFullYear(candidate.getFullYear() + 1)
        }
        if (!bestDate || candidate < bestDate) {
          bestDate = candidate
          bestMonth = month
        }
      })

      const cheapPrices = cheapMonths.flatMap(m => byMonth.get(m) ?? [])
      const spansTwoYears = spanDays >= 360
      const confidence: CheapWindowPrediction['confidence'] =
        sorted.length >= 8 && spansTwoYears ? 'high'
        : sorted.length >= 6 ? 'medium'
        : 'low'

      return {
        kind: 'seasonal',
        nextDate: bestDate!,
        monthOfYear: bestMonth,
        confidence,
        typicalLow: mean(cheapPrices),
        typicalPrice: overallMean,
        overdue: bestMonth === today.getMonth(),
      }
    }
  }

  // --- Strategy 2: deal intervals ---
  const dealThreshold = percentile(prices, 0.25)
  const deals = sorted.filter(p => p.price <= dealThreshold)
  if (deals.length < 2) return null

  const gaps: number[] = []
  for (let i = 1; i < deals.length; i++) {
    gaps.push((deals[i].date.getTime() - deals[i - 1].date.getTime()) / DAY_MS)
  }
  const medianGap = median(gaps)
  if (medianGap <= 0) return null

  const lastDeal = deals[deals.length - 1].date
  const nextDate = new Date(lastDeal.getTime() + medianGap * DAY_MS)
  const overdue = nextDate.getTime() < today.getTime()

  return {
    kind: 'interval',
    nextDate: overdue ? today : nextDate,
    confidence: deals.length >= 3 ? 'medium' : 'low',
    typicalLow: mean(deals.map(d => d.price)),
    typicalPrice: overallMean,
    overdue,
  }
}

// --- Purchase diff (GitHub-style) ---

export type DiffKind = 'added' | 'removed' | 'more' | 'less'

export interface PurchaseDiffLine {
  name: string
  kind: DiffKind
  currentQty: number
  baselineQty: number // average per month over the baseline window
  deltaQty: number
  currentCost: number
  baselineCost: number // average per month over the baseline window
  deltaCost: number
}

// "Buying more or less than usual?" — compares the month containing
// `reference` against the average of the `baselineMonths` before it.
// Quantities are aggregated through `resolveName` so aliases collapse
// into one line. ±20% around the baseline counts as "usual".
export function computePurchaseDiff(
  payments: Payment[],
  reference: Date = new Date(),
  baselineMonths = 3,
  resolveName: (name: string) => string = name => name
): PurchaseDiffLine[] {
  const refKey = reference.getFullYear() * 12 + reference.getMonth()
  const baselineKeys = new Set<number>()
  for (let i = 1; i <= baselineMonths; i++) baselineKeys.add(refKey - i)

  interface Bucket { currentQty: number, currentCost: number, baselineQty: number, baselineCost: number }
  const buckets = new Map<string, Bucket>()

  payments.forEach(payment => {
    if (payment.type !== 'inventory' || !payment.itemName) return
    const parsed = parsePaymentDate(payment.date)
    if (!parsed) return
    const key = parsed.year * 12 + parsed.month

    const isCurrent = key === refKey
    const isBaseline = baselineKeys.has(key)
    if (!isCurrent && !isBaseline) return

    const name = resolveName(payment.itemName)
    if (!buckets.has(name)) {
      buckets.set(name, { currentQty: 0, currentCost: 0, baselineQty: 0, baselineCost: 0 })
    }
    const bucket = buckets.get(name)!
    const qty = payment.quantity && payment.quantity > 0 ? payment.quantity : 1
    const cost = parseAmount(payment.amount)

    if (isCurrent) {
      bucket.currentQty += qty
      bucket.currentCost += cost
    } else {
      bucket.baselineQty += qty
      bucket.baselineCost += cost
    }
  })

  const lines: PurchaseDiffLine[] = []
  buckets.forEach((bucket, name) => {
    const baselineAvgQty = bucket.baselineQty / baselineMonths
    const baselineAvgCost = bucket.baselineCost / baselineMonths

    let kind: DiffKind | null = null
    if (bucket.currentQty > 0 && baselineAvgQty === 0) {
      kind = 'added'
    } else if (bucket.currentQty === 0 && baselineAvgQty > 0) {
      kind = 'removed'
    } else if (bucket.currentQty >= baselineAvgQty * 1.2 && bucket.currentQty > baselineAvgQty) {
      kind = 'more'
    } else if (bucket.currentQty <= baselineAvgQty * 0.8 && bucket.currentQty < baselineAvgQty) {
      kind = 'less'
    }
    if (!kind) return

    lines.push({
      name,
      kind,
      currentQty: bucket.currentQty,
      baselineQty: Math.round(baselineAvgQty * 10) / 10,
      deltaQty: Math.round((bucket.currentQty - baselineAvgQty) * 10) / 10,
      currentCost: bucket.currentCost,
      baselineCost: Math.round(baselineAvgCost * 100) / 100,
      deltaCost: Math.round((bucket.currentCost - baselineAvgCost) * 100) / 100,
    })
  })

  const order: Record<DiffKind, number> = { added: 0, more: 1, less: 2, removed: 3 }
  return lines.sort((a, b) => {
    if (order[a.kind] !== order[b.kind]) return order[a.kind] - order[b.kind]
    return Math.abs(b.deltaQty) - Math.abs(a.deltaQty)
  })
}

// --- Shrinkflation detection ---

export interface ShrinkflationAlert {
  name: string
  packDeltaPct: number    // change in pack price, first → last
  per100gDeltaPct: number // change in price per 100g, first → last
}

// Flags items whose price per 100g rose noticeably more than the pack
// price (i.e. the pack got smaller while the shelf price "stayed flat").
export function detectShrinkflation(
  series: Array<{ name: string, packPrices: number[], per100gPrices: number[] }>,
  minPer100gIncreasePct = 5
): ShrinkflationAlert[] {
  const alerts: ShrinkflationAlert[] = []

  series.forEach(({ name, packPrices, per100gPrices }) => {
    if (packPrices.length < 2 || per100gPrices.length < 2) return
    const firstPack = packPrices[0]
    const lastPack = packPrices[packPrices.length - 1]
    const firstPer = per100gPrices[0]
    const lastPer = per100gPrices[per100gPrices.length - 1]
    if (firstPack <= 0 || firstPer <= 0) return

    const packDeltaPct = ((lastPack - firstPack) / firstPack) * 100
    const per100gDeltaPct = ((lastPer - firstPer) / firstPer) * 100

    if (per100gDeltaPct >= minPer100gIncreasePct && per100gDeltaPct > packDeltaPct + 2) {
      alerts.push({
        name,
        packDeltaPct: Math.round(packDeltaPct * 10) / 10,
        per100gDeltaPct: Math.round(per100gDeltaPct * 10) / 10,
      })
    }
  })

  return alerts.sort((a, b) => b.per100gDeltaPct - a.per100gDeltaPct)
}
