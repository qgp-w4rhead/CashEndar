import { describe, it, expect } from 'vitest'
import { formatCurrencyAmount, isValidPaymentImport } from '../../utils/validation-utils'

describe('formatCurrencyAmount', () => {
  it('rounds to 2 decimal places', () => {
    expect(formatCurrencyAmount('12.567')).toBe('12.57')
  })

  it('handles integers by padding decimals', () => {
    expect(formatCurrencyAmount('5')).toBe('5.00')
  })

  it('strips non-numeric characters before parsing', () => {
    expect(formatCurrencyAmount('$3.50')).toBe('3.50')
  })

  it('returns empty string for empty input', () => {
    expect(formatCurrencyAmount('')).toBe('')
  })

  it('returns empty string for non-numeric input', () => {
    expect(formatCurrencyAmount('abc')).toBe('')
  })
})

describe('isValidPaymentImport', () => {
  it('returns true for a fully valid payment object', () => {
    expect(isValidPaymentImport({
      id: '1',
      title: 'Rent',
      amount: '$1200',
      date: 'January 1st, 2025',
      type: 'rent'
    })).toBe(true)
  })

  it('returns false when id is missing', () => {
    expect(isValidPaymentImport({ title: 'Rent', amount: '$1200', date: 'Jan 1', type: 'rent' })).toBe(false)
  })

  it('returns false when title is missing', () => {
    expect(isValidPaymentImport({ id: '1', amount: '$1200', date: 'Jan 1', type: 'rent' })).toBe(false)
  })

  it('returns false when amount is missing', () => {
    expect(isValidPaymentImport({ id: '1', title: 'Rent', date: 'Jan 1', type: 'rent' })).toBe(false)
  })

  it('returns false for empty object', () => {
    expect(isValidPaymentImport({})).toBe(false)
  })
})
