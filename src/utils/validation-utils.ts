// Format a currency string to 2 decimal places
export function formatCurrencyAmount(value: string): string {
  if (!value) return ''

  const numericValue = parseFloat(value.replace(/[^0-9.-]+/g, ''))
  if (isNaN(numericValue)) return ''

  return numericValue.toFixed(2)
}

// Validate a payment has the required fields for import
export function isValidPaymentImport(payment: any): boolean {
  return !!(payment.id && payment.title && payment.amount && payment.date && payment.type)
}
