import { describe, it, expect } from 'vitest'
import { parseReceiptText, extractDate } from '../ocr/receipt-parser'

describe('extractDate', () => {
  it('parses ISO dates', () => {
    expect(extractDate('Date: 2026-06-03 14:22')).toBe('2026-06-03')
  })

  it('parses day-first dates', () => {
    expect(extractDate('21/06/2026')).toBe('2026-06-21')
    expect(extractDate('21.06.26')).toBe('2026-06-21')
  })

  it('parses month-first dates when the day exceeds 12', () => {
    expect(extractDate('06/21/2026')).toBe('2026-06-21')
  })

  it('defaults ambiguous dates to day-first', () => {
    expect(extractDate('03/06/2026')).toBe('2026-06-03')
  })

  it('returns null without a date', () => {
    expect(extractDate('TOTAL 12.99')).toBeNull()
  })
})

describe('parseReceiptText', () => {
  it('parses a simple receipt with store, date, items and total', () => {
    const receipt = parseReceiptText(`
SUPERMART
123 Main Street
2026-06-03
MILK 1L 2.49
BREAD WHOLE 1.99
PASTA BARILLA 500G 1.79
SUBTOTAL 6.27
TAX 0.00
TOTAL 6.27
CARD 6.27
`)
    expect(receipt.store).toBe('SUPERMART')
    expect(receipt.date).toBe('2026-06-03')
    expect(receipt.total).toBe(6.27)
    expect(receipt.sumMatchesTotal).toBe(true)
    expect(receipt.lines).toHaveLength(3)
    expect(receipt.lines[0]).toMatchObject({ rawName: 'MILK 1L', lineTotal: 2.49, quantity: 1 })
    expect(receipt.lines[2]).toMatchObject({ rawName: 'PASTA BARILLA 500G', lineTotal: 1.79 })
  })

  it('parses quantity x unit-price lines', () => {
    const receipt = parseReceiptText(`
STORE
YOGURT 2 x 1.25 2.50
TOTAL 2.50
`)
    expect(receipt.lines).toHaveLength(1)
    expect(receipt.lines[0]).toMatchObject({
      rawName: 'YOGURT',
      quantity: 2,
      unitPrice: 1.25,
      lineTotal: 2.5,
    })
    expect(receipt.sumMatchesTotal).toBe(true)
  })

  it('parses weighed items keeping quantity 1', () => {
    const receipt = parseReceiptText(`
GROCER
BANANAS 0.512 kg x 2.99 1.53
TOTAL 1.53
`)
    expect(receipt.lines).toHaveLength(1)
    expect(receipt.lines[0]).toMatchObject({
      rawName: 'BANANAS',
      quantity: 1,
      unitPrice: 2.99,
      lineTotal: 1.53,
    })
  })

  it('treats trailing-minus and discount lines as negative', () => {
    const receipt = parseReceiptText(`
SHOP
CHIPS 3.00
PROMO DISCOUNT 0.50-
TOTAL 2.50
`)
    expect(receipt.lines).toHaveLength(2)
    expect(receipt.lines[1]).toMatchObject({ isDiscount: true, lineTotal: -0.5 })
    expect(receipt.sumMatchesTotal).toBe(true)
  })

  it('flags a mismatching total', () => {
    const receipt = parseReceiptText(`
SHOP
CHIPS 3.00
TOTAL 9.99
`)
    expect(receipt.sumMatchesTotal).toBe(false)
  })

  it('handles comma decimals and currency symbols', () => {
    const receipt = parseReceiptText(`
EUROMARKT
03.06.2026
KASE GOUDA 4,99 €
TOTAL 4,99 €
`)
    expect(receipt.date).toBe('2026-06-03')
    expect(receipt.lines[0]).toMatchObject({ rawName: 'KASE GOUDA', lineTotal: 4.99 })
  })

  it('skips payment and tax plumbing lines', () => {
    const receipt = parseReceiptText(`
SHOP
SODA 1.00
TVA 5.5% 0.05
CASH 10.00
CHANGE 9.00
TOTAL 1.00
`)
    expect(receipt.lines).toHaveLength(1)
    expect(receipt.lines[0].rawName).toBe('SODA')
  })

  it('parses leading quantities like "2 MILK"', () => {
    const receipt = parseReceiptText(`
SHOP
2 MILK 4.98
TOTAL 4.98
`)
    expect(receipt.lines[0]).toMatchObject({ rawName: 'MILK', quantity: 2, unitPrice: 2.49 })
  })

  it('returns no lines for unusable text', () => {
    const receipt = parseReceiptText('hello world\nnothing here')
    expect(receipt.lines).toHaveLength(0)
    expect(receipt.sumMatchesTotal).toBeNull()
  })
})
