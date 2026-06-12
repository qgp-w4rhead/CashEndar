import { describe, it, expect } from 'vitest'
import {
  predictCheapWindow,
  computePurchaseDiff,
  detectShrinkflation,
  ForecastPricePoint,
} from '../../services/forecast.service'
import { Payment } from '../../types/payment.types'

const point = (iso: string, price: number): ForecastPricePoint => ({
  date: new Date(iso),
  price,
})

describe('predictCheapWindow', () => {
  it('returns null with fewer than 4 points', () => {
    expect(predictCheapWindow([point('2025-01-01', 2), point('2025-06-01', 3)], new Date('2026-01-01'))).toBeNull()
  })

  it('returns null when points span less than ~3 months', () => {
    const points = [
      point('2026-01-01', 2), point('2026-01-10', 3),
      point('2026-01-20', 2), point('2026-02-01', 3),
    ]
    expect(predictCheapWindow(points, new Date('2026-03-01'))).toBeNull()
  })

  it('detects a seasonal cheap month across two years', () => {
    // July is consistently cheap; other months are expensive
    const points = [
      point('2024-03-05', 4.0), point('2024-07-10', 2.0), point('2024-11-02', 4.2),
      point('2025-03-07', 4.1), point('2025-07-12', 2.1), point('2025-11-05', 4.3),
      point('2024-05-01', 3.9), point('2025-05-03', 4.0),
    ]
    const prediction = predictCheapWindow(points, new Date('2026-01-15'))
    expect(prediction).not.toBeNull()
    expect(prediction!.kind).toBe('seasonal')
    expect(prediction!.monthOfYear).toBe(6) // July
    expect(prediction!.nextDate.getFullYear()).toBe(2026)
    expect(prediction!.typicalLow).toBeCloseTo(2.05, 2)
    expect(prediction!.confidence).toBe('high')
  })

  it('predicts the next deal from sale intervals when no seasonality', () => {
    // Deal every ~60 days, same months won't repeat across years
    const points = [
      point('2026-01-01', 2.0), point('2026-01-20', 3.0),
      point('2026-03-01', 2.0), point('2026-03-20', 3.1),
      point('2026-05-01', 2.0), point('2026-05-15', 3.0),
    ]
    const prediction = predictCheapWindow(points, new Date('2026-05-20'))
    expect(prediction).not.toBeNull()
    expect(prediction!.kind).toBe('interval')
    // Last deal May 1 + median gap (~60d) => ~June 30
    expect(prediction!.nextDate.getMonth()).toBe(5) // June
    expect(prediction!.overdue).toBe(false)
  })

  it('marks interval predictions overdue when the gap already passed', () => {
    const points = [
      point('2025-01-01', 2.0), point('2025-02-01', 3.0),
      point('2025-03-01', 2.0), point('2025-04-01', 3.0),
      point('2025-05-01', 2.0),
    ]
    const prediction = predictCheapWindow(points, new Date('2026-01-01'))
    expect(prediction).not.toBeNull()
    expect(prediction!.overdue).toBe(true)
  })
})

const purchase = (itemName: string, date: string, qty = 1, amount = '$2.00'): Payment => ({
  id: `${itemName}-${date}`,
  title: itemName,
  amount,
  date,
  type: 'inventory',
  frequency: 'one-time',
  itemName,
  quantity: qty,
})

describe('computePurchaseDiff', () => {
  const reference = new Date(2026, 5, 15) // June 2026; baseline = Mar+Apr+May

  it('flags newly bought items as added', () => {
    const diff = computePurchaseDiff([purchase('Quinoa', '2026-06-02')], reference)
    expect(diff).toEqual([expect.objectContaining({ name: 'Quinoa', kind: 'added', currentQty: 1, baselineQty: 0 })])
  })

  it('flags items no longer bought as removed', () => {
    const diff = computePurchaseDiff([
      purchase('Soda', '2026-03-10'),
      purchase('Soda', '2026-04-12'),
      purchase('Soda', '2026-05-09'),
    ], reference)
    expect(diff).toEqual([expect.objectContaining({ name: 'Soda', kind: 'removed', currentQty: 0, baselineQty: 1 })])
  })

  it('flags more / less around a ±20% band', () => {
    const payments = [
      // Milk: baseline avg 2/mo, current 4 => more
      purchase('Milk', '2026-03-01', 2), purchase('Milk', '2026-04-01', 2), purchase('Milk', '2026-05-01', 2),
      purchase('Milk', '2026-06-01', 4),
      // Bread: baseline avg 2/mo, current 1 => less
      purchase('Bread', '2026-03-02', 2), purchase('Bread', '2026-04-02', 2), purchase('Bread', '2026-05-02', 2),
      purchase('Bread', '2026-06-02', 1),
      // Eggs: baseline avg 1/mo, current 1 => unchanged (excluded)
      purchase('Eggs', '2026-03-03'), purchase('Eggs', '2026-04-03'), purchase('Eggs', '2026-05-03'),
      purchase('Eggs', '2026-06-03'),
    ]
    const diff = computePurchaseDiff(payments, reference)
    const byName = Object.fromEntries(diff.map(line => [line.name, line]))
    expect(byName['Milk'].kind).toBe('more')
    expect(byName['Bread'].kind).toBe('less')
    expect(byName['Eggs']).toBeUndefined()
  })

  it('aggregates aliases into one canonical line', () => {
    const resolve = (name: string) => name.startsWith('PST') ? 'Pasta Barilla' : name
    const diff = computePurchaseDiff([
      purchase('Pasta Barilla', '2026-06-05', 1),
      purchase('PST BARILLA', '2026-06-20', 2),
    ], reference, 3, resolve)
    expect(diff).toEqual([expect.objectContaining({ name: 'Pasta Barilla', kind: 'added', currentQty: 3 })])
  })

  it('ignores non-inventory payments and other periods', () => {
    const rent: Payment = { id: 'r', title: 'Rent', amount: '$900', date: '2026-06-01', type: 'rent', frequency: 'recurring' }
    const old = purchase('Milk', '2025-06-01')
    expect(computePurchaseDiff([rent, old], reference)).toEqual([])
  })

  it('orders lines added, more, less, removed', () => {
    const payments = [
      purchase('New Thing', '2026-06-01'),
      purchase('Milk', '2026-03-01', 2), purchase('Milk', '2026-04-01', 2), purchase('Milk', '2026-05-01', 2),
      purchase('Milk', '2026-06-01', 4),
      purchase('Bread', '2026-03-02', 2), purchase('Bread', '2026-04-02', 2), purchase('Bread', '2026-05-02', 2),
      purchase('Bread', '2026-06-02', 1),
      purchase('Soda', '2026-03-10'), purchase('Soda', '2026-04-12'), purchase('Soda', '2026-05-09'),
    ]
    const kinds = computePurchaseDiff(payments, reference).map(l => l.kind)
    expect(kinds).toEqual(['added', 'more', 'less', 'removed'])
  })
})

describe('detectShrinkflation', () => {
  it('flags rising per-100g price with flat pack price', () => {
    const alerts = detectShrinkflation([
      { name: 'Chips', packPrices: [3.0, 3.0], per100gPrices: [1.5, 1.875] }, // -50g pack
      { name: 'Pasta', packPrices: [2.0, 2.2], per100gPrices: [0.4, 0.44] },  // plain price rise
    ])
    expect(alerts).toHaveLength(1)
    expect(alerts[0].name).toBe('Chips')
    expect(alerts[0].per100gDeltaPct).toBeCloseTo(25, 1)
    expect(alerts[0].packDeltaPct).toBeCloseTo(0, 1)
  })

  it('needs at least two points per series', () => {
    expect(detectShrinkflation([{ name: 'X', packPrices: [3], per100gPrices: [1.5] }])).toEqual([])
  })
})
