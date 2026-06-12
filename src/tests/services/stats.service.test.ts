import { describe, it, expect } from 'vitest'
import {
  convertToGrams,
  unitPriceOf,
  pricePerPortion,
  pricePer100g,
  computeStatValue,
  statSeries,
  normalizedPrice,
  formatStatValue,
} from '../../services/stats.service'
import { Payment } from '../../types/payment.types'
import { Item, StatDefinition } from '../../types/catalog.types'

const makePurchase = (overrides: Partial<Payment> = {}): Payment => ({
  id: 'p1',
  title: 'Pasta Barilla',
  amount: '$3.00',
  date: '2026-05-01',
  type: 'inventory',
  frequency: 'one-time',
  itemName: 'Pasta Barilla',
  ...overrides,
})

const makeStat = (overrides: Partial<StatDefinition> = {}): StatDefinition => ({
  id: 'water-content',
  label: 'Water content',
  unit: '%',
  basis: 'per100g',
  isBuiltin: true,
  starred: false,
  derived: false,
  ...overrides,
})

const item: Item = {
  id: 'i1',
  name: 'Pasta Barilla',
  aliases: [],
  stats: { 'water-content': 12, carbs: 70 },
}

describe('convertToGrams', () => {
  it('converts mass and volume units', () => {
    expect(convertToGrams(500, 'gram')).toBe(500)
    expect(convertToGrams(1.5, 'kg')).toBe(1500)
    expect(convertToGrams(2, 'liter')).toBe(2000)
    expect(convertToGrams(330, 'ml')).toBe(330)
  })

  it('returns null for count-like units', () => {
    expect(convertToGrams(4, 'piece')).toBeNull()
    expect(convertToGrams(1, 'single')).toBeNull()
    expect(convertToGrams(2, undefined)).toBeNull()
  })
})

describe('unitPriceOf', () => {
  it('prefers stored unitCost', () => {
    expect(unitPriceOf(makePurchase({ unitCost: 2.5, amount: '$10.00', quantity: 4 }))).toBe(2.5)
  })

  it('falls back to amount divided by quantity', () => {
    expect(unitPriceOf(makePurchase({ amount: '$10.00', quantity: 4 }))).toBe(2.5)
    expect(unitPriceOf(makePurchase({ amount: '$10.00' }))).toBe(10)
  })
})

describe('derived price stats', () => {
  it('computes price per portion from portionsCount', () => {
    expect(pricePerPortion(makePurchase({ amount: '$4.00', portionsCount: 8 }))).toBe(0.5)
  })

  it('computes price per portion from itemSize/portionSize', () => {
    expect(pricePerPortion(makePurchase({ amount: '$4.00', itemSize: 500, portionSize: 125 }))).toBe(1)
  })

  it('computes price per 100g with unit conversion', () => {
    expect(pricePer100g(makePurchase({ amount: '$3.00', itemSize: 500, itemSizeUnit: 'gram' }))).toBe(0.6)
    expect(pricePer100g(makePurchase({ amount: '$10.00', itemSize: 1, itemSizeUnit: 'kg' }))).toBe(1)
  })

  it('returns null when size is missing or not mass-like', () => {
    expect(pricePer100g(makePurchase({ amount: '$3.00' }))).toBeNull()
    expect(pricePer100g(makePurchase({ amount: '$3.00', itemSize: 4, itemSizeUnit: 'piece' }))).toBeNull()
  })
})

describe('computeStatValue', () => {
  it('reads stored stats from the item', () => {
    const value = computeStatValue(makeStat(), item, [makePurchase()])
    expect(value).toBe(12)
  })

  it('prefers per-purchase overrides over item values', () => {
    const purchase = makePurchase({ statOverrides: { 'water-content': 14 } })
    expect(computeStatValue(makeStat(), item, [purchase])).toBe(14)
  })

  it('computes derived stats from the most recent purchase with data', () => {
    const stat = makeStat({ id: 'price-per-100g', unit: '$', derived: true })
    const recentNoSize = makePurchase({ amount: '$5.00' })
    const olderWithSize = makePurchase({ amount: '$3.00', itemSize: 500, itemSizeUnit: 'gram' })
    expect(computeStatValue(stat, item, [recentNoSize, olderWithSize])).toBe(0.6)
  })

  it('returns null when nothing is known', () => {
    const stat = makeStat({ id: 'unknown-custom' })
    expect(computeStatValue(stat, undefined, [makePurchase()])).toBeNull()
  })
})

describe('statSeries', () => {
  it('tracks derived stats across purchases', () => {
    const stat = makeStat({ id: 'price-per-100g', unit: '$', derived: true })
    const purchases = [
      makePurchase({ amount: '$3.00', itemSize: 500, itemSizeUnit: 'gram' }),
      makePurchase({ amount: '$3.00', itemSize: 400, itemSizeUnit: 'gram' }), // shrinkflation!
    ]
    const series = statSeries(stat, item, purchases)
    expect(series.map(s => s.value)).toEqual([0.6, 0.75])
  })

  it('uses overrides then flat item value for stored stats', () => {
    const purchases = [
      makePurchase({ statOverrides: { 'water-content': 10 } }),
      makePurchase(),
    ]
    const series = statSeries(makeStat(), item, purchases)
    expect(series.map(s => s.value)).toEqual([10, 12])
  })
})

describe('normalizedPrice', () => {
  const purchase = makePurchase({ amount: '$4.00', itemSize: 500, itemSizeUnit: 'gram', portionsCount: 8 })

  it('normalizes by each basis', () => {
    expect(normalizedPrice(purchase, 'perPortion')).toBe(0.5)
    expect(normalizedPrice(purchase, 'per100g')).toBe(0.8)
    expect(normalizedPrice(purchase, 'perUnit')).toBe(4)
  })
})

describe('formatStatValue', () => {
  it('formats by unit', () => {
    expect(formatStatValue(0.5, makeStat({ unit: '$' }))).toBe('$0.50')
    expect(formatStatValue(86, makeStat({ unit: '%' }))).toBe('86.00%')
    expect(formatStatValue(null, makeStat())).toBe('—')
  })
})
