// Reactive data for the dashboard widgets: deal forecasts, purchase diff,
// shrinkflation alerts and starred stats at a glance. Pure analysis lives
// in forecast.service / stats.service — this file only wires reactivity.
import { computed } from 'vue'
import { payments } from '../stores/ui-state.store'
import { aliasLookup, itemByCanonicalName, starredStats } from '../stores/catalog.store'
import { resolveCanonicalName } from '../services/alias.service'
import {
  predictCheapWindow,
  computePurchaseDiff,
  detectShrinkflation,
  CheapWindowPrediction,
  ForecastPricePoint,
} from '../services/forecast.service'
import { unitPriceOf, pricePer100g, computeStatValue, formatStatValue } from '../services/stats.service'
import { parsePaymentDate, parseAmount } from '../utils/date-utils'
import { Payment } from '../types/payment.types'
import { PriceHistoryData } from './payment-computables'

// All inventory purchases grouped by canonical item name, oldest first
export const purchasesByCanonicalName = computed(() => {
  const groups = new Map<string, Payment[]>()
  payments.value.forEach(payment => {
    if (payment.type !== 'inventory' || !payment.itemName) return
    const name = resolveCanonicalName(payment.itemName, aliasLookup.value)
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name)!.push(payment)
  })

  groups.forEach(group => {
    group.sort((a, b) => {
      const dateA = parsePaymentDate(a.date)
      const dateB = parsePaymentDate(b.date)
      if (!dateA || !dateB) return 0
      return new Date(dateA.year, dateA.month, dateA.day).getTime()
        - new Date(dateB.year, dateB.month, dateB.day).getTime()
    })
  })
  return groups
})

const toPricePoints = (purchases: Payment[]): ForecastPricePoint[] => {
  const points: ForecastPricePoint[] = []
  purchases.forEach(purchase => {
    const parsed = parsePaymentDate(purchase.date)
    if (!parsed) return
    points.push({
      date: new Date(parsed.year, parsed.month, parsed.day),
      price: unitPriceOf(purchase),
    })
  })
  return points
}

export interface DealForecastEntry {
  name: string
  prediction: CheapWindowPrediction
  lastPrice: number
  history: PriceHistoryData
}

// "When is it expected to be cheap again" — one entry per item with enough
// history, soonest window first
export const dealForecasts = computed<DealForecastEntry[]>(() => {
  const entries: DealForecastEntry[] = []
  const today = new Date()

  purchasesByCanonicalName.value.forEach((purchases, name) => {
    const points = toPricePoints(purchases)
    const prediction = predictCheapWindow(points, today)
    if (!prediction) return

    const prices = points.map(p => p.price)
    const historyPoints = points.map(p => ({
      date: p.date,
      price: p.price,
      formattedDate: p.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))

    entries.push({
      name,
      prediction,
      lastPrice: prices[prices.length - 1],
      history: {
        points: historyPoints,
        low: Math.min(...prices),
        high: Math.max(...prices),
        peak: Math.max(...prices),
        last: prices[prices.length - 1],
        best: Math.min(...prices),
      },
    })
  })

  return entries.sort((a, b) => a.prediction.nextDate.getTime() - b.prediction.nextDate.getTime())
})

export const forecastInsufficientCount = computed(() => {
  return purchasesByCanonicalName.value.size - dealForecasts.value.length
})

// GitHub-style purchase diff: this month vs the average of the prior months
export const purchaseDiffFor = (baselineMonths: number) => {
  return computePurchaseDiff(
    payments.value,
    new Date(),
    baselineMonths,
    name => resolveCanonicalName(name, aliasLookup.value)
  )
}

// Shrinkflation: price per 100g rose while the pack price stayed flat
export const shrinkflationAlerts = computed(() => {
  const series: Array<{ name: string, packPrices: number[], per100gPrices: number[] }> = []

  purchasesByCanonicalName.value.forEach((purchases, name) => {
    const packPrices: number[] = []
    const per100gPrices: number[] = []
    purchases.forEach(purchase => {
      const per100g = pricePer100g(purchase)
      if (per100g === null) return
      packPrices.push(unitPriceOf(purchase))
      per100gPrices.push(per100g)
    })
    series.push({ name, packPrices, per100gPrices })
  })

  return detectShrinkflation(series)
})

// Per-100g price series for an item, chartable in PriceHistoryChart
export const per100gHistoryFor = (name: string): PriceHistoryData => {
  const purchases = purchasesByCanonicalName.value.get(name) ?? []
  const points: PriceHistoryData['points'] = []
  purchases.forEach(purchase => {
    const parsed = parsePaymentDate(purchase.date)
    const per100g = pricePer100g(purchase)
    if (!parsed || per100g === null) return
    const date = new Date(parsed.year, parsed.month, parsed.day)
    points.push({
      date,
      price: Math.round(per100g * 100) / 100,
      formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  })
  const prices = points.map(p => p.price)
  if (prices.length === 0) {
    return { points: [], low: 0, high: 0, peak: 0, last: 0, best: 0 }
  }
  return {
    points,
    low: Math.min(...prices),
    high: Math.max(...prices),
    peak: Math.max(...prices),
    last: prices[prices.length - 1],
    best: Math.min(...prices),
  }
}

export interface StarredStatsRow {
  name: string
  totalSpent: number
  values: Array<{ statId: string, formatted: string }>
}

// Starred stats for the items the user spends the most on
export const starredStatsOverview = computed<StarredStatsRow[]>(() => {
  const stats = starredStats.value.slice(0, 3)
  if (stats.length === 0) return []

  const rows: StarredStatsRow[] = []
  purchasesByCanonicalName.value.forEach((purchases, name) => {
    const totalSpent = purchases.reduce((sum, p) => sum + parseAmount(p.amount), 0)
    const newestFirst = [...purchases].reverse()
    const catalogItem = itemByCanonicalName.value.get(name)
    rows.push({
      name,
      totalSpent,
      values: stats.map(stat => ({
        statId: stat.id,
        formatted: formatStatValue(computeStatValue(stat, catalogItem, newestFirst), stat),
      })),
    })
  })

  return rows.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 6)
})

export const starredStatsColumns = computed(() => starredStats.value.slice(0, 3))
