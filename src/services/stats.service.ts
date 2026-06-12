// Stat computation: derived stats (price per portion / 100g / unit) from
// purchase data and stored stats (water content, carbs, custom...) from
// catalog items. Pure functions — no reactive state.
import { Payment } from '../types/payment.types'
import { Item, StatDefinition, StatBasis } from '../types/catalog.types'
import { parseAmount } from '../utils/date-utils'

// Mass/volume units convertible to grams/ml; count-like units return null
// (they can't be normalized per 100g)
export function convertToGrams(size: number, unit?: Payment['itemSizeUnit']): number | null {
  switch (unit) {
    case 'gram':
      return size
    case 'kg':
      return size * 1000
    case 'ml':
      return size
    case 'liter':
      return size * 1000
    case 'cup':
      return size * 240
    case 'tablespoon':
      return size * 15
    case 'teaspoon':
      return size * 5
    default:
      return null
  }
}

// Price of one purchase of the item (per single quantity bought)
export function unitPriceOf(purchase: Payment): number {
  if (purchase.unitCost !== undefined && purchase.unitCost !== null) {
    return purchase.unitCost
  }
  const quantity = purchase.quantity && purchase.quantity > 0 ? purchase.quantity : 1
  return parseAmount(purchase.amount) / quantity
}

export function pricePerPortion(purchase: Payment): number | null {
  const portions = purchase.portionsCount
    ?? (purchase.itemSize && purchase.portionSize && purchase.portionSize > 0
      ? Math.floor(purchase.itemSize / purchase.portionSize)
      : null)
  if (!portions || portions <= 0) return null
  return unitPriceOf(purchase) / portions
}

export function pricePer100g(purchase: Payment): number | null {
  if (!purchase.itemSize || purchase.itemSize <= 0) return null
  const grams = convertToGrams(purchase.itemSize, purchase.itemSizeUnit)
  if (!grams || grams <= 0) return null
  return (unitPriceOf(purchase) / grams) * 100
}

export function pricePerUnit(purchase: Payment): number | null {
  return unitPriceOf(purchase)
}

const DERIVED_STAT_FNS: Record<string, (purchase: Payment) => number | null> = {
  'price-per-portion': pricePerPortion,
  'price-per-100g': pricePer100g,
  'price-per-unit': pricePerUnit,
}

// Value of a stat for an item, given its purchases (most recent first wins
// for derived stats). Stored stats prefer the latest per-purchase override,
// then the item-level value.
export function computeStatValue(
  statDef: StatDefinition,
  item: Item | undefined,
  purchases: Payment[]
): number | null {
  if (statDef.derived) {
    const fn = DERIVED_STAT_FNS[statDef.id]
    if (!fn) return null
    for (const purchase of purchases) {
      const value = fn(purchase)
      if (value !== null && Number.isFinite(value)) return value
    }
    return null
  }

  for (const purchase of purchases) {
    const override = purchase.statOverrides?.[statDef.id]
    if (override !== undefined && override !== null) return override
  }

  const stored = item?.stats?.[statDef.id]
  return stored !== undefined && stored !== null ? stored : null
}

// Time series of a stat across purchases (oldest first), for charting.
// Derived stats vary per purchase; stored stats use overrides and fall
// back to the flat item value.
export function statSeries(
  statDef: StatDefinition,
  item: Item | undefined,
  purchasesOldestFirst: Payment[]
): Array<{ purchase: Payment, value: number }> {
  const series: Array<{ purchase: Payment, value: number }> = []
  purchasesOldestFirst.forEach(purchase => {
    let value: number | null = null
    if (statDef.derived) {
      const fn = DERIVED_STAT_FNS[statDef.id]
      value = fn ? fn(purchase) : null
    } else {
      const override = purchase.statOverrides?.[statDef.id]
      value = override ?? item?.stats?.[statDef.id] ?? null
    }
    if (value !== null && Number.isFinite(value)) {
      series.push({ purchase, value })
    }
  })
  return series
}

// Normalize a price to a comparison basis so different products compare
// "apples to apples" (per portion / per 100g / per unit)
export function normalizedPrice(purchase: Payment, basis: StatBasis): number | null {
  switch (basis) {
    case 'perPortion':
      return pricePerPortion(purchase)
    case 'per100g':
      return pricePer100g(purchase)
    case 'perUnit':
      return pricePerUnit(purchase)
    default:
      return null
  }
}

export function formatStatValue(value: number | null, statDef: StatDefinition): string {
  if (value === null) return '—'
  const rounded = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2)
  if (statDef.unit === '$') return `$${rounded}`
  if (statDef.unit === '%') return `${rounded}%`
  return statDef.unit ? `${rounded} ${statDef.unit}` : `${rounded}`
}
