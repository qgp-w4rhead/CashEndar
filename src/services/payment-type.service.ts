// Payment type service for payment type management
import { PaymentType } from '../types/payment.types'
import { getAllPaymentTypes, addPaymentType, updatePaymentType, deletePaymentType as deletePaymentTypeFromDB } from '../repositories/payment-type.repository'
import { getDB } from '../repositories/db'
import { DEFAULT_PAYMENT_TYPES, FALLBACK_PAYMENT_TYPES } from '../utils/constants'

// Retry an async operation up to maxAttempts times with a delay between retries
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, delayMs = 100): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      console.warn(`Attempt ${attempt} failed:`, error)
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }
  throw lastError
}

async function initializeDefaultPaymentTypes(): Promise<void> {
  try {
    const existingTypes = await getAllPaymentTypes()
    console.log('Existing payment types:', existingTypes.length, existingTypes.map(t => t.value))

    if (existingTypes.length === 0) {
      console.log('No existing types found, initializing defaults...')
      for (const type of DEFAULT_PAYMENT_TYPES) {
        await addPaymentType({ ...type })
        console.log('Added default type:', type.value)
      }
    } else {
      // Ensure required types exist
      const requiredTypes = [
        { value: 'earnings', data: { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true } },
        { value: 'inventory', data: { id: 'inventory', label: 'Inventory', value: 'inventory', color: '#8b5cf6', isCustom: false, isEarning: false } }
      ]

      for (const required of requiredTypes) {
        if (!existingTypes.find(t => t.value === required.value)) {
          console.log(`${required.data.label} type missing, adding it...`)
          await addPaymentType(required.data as PaymentType)
        }
      }
    }
  } catch (error) {
    console.error('Error initializing default payment types:', error)
  }
}

export class PaymentTypeService {
  // Load payment types from database
  async loadPaymentTypes(): Promise<PaymentType[]> {
    try {
      console.log('Starting payment types load...')

      // Force database initialization with retry
      await withRetry(() => getDB())
      console.log('Database initialized successfully')

      // Try to initialize default types
      try {
        await initializeDefaultPaymentTypes()
        console.log('Default types initialized')
      } catch (initError) {
        console.warn('Default types initialization failed:', initError)
      }

      // Get all payment types with retry
      const types = await withRetry(() => getAllPaymentTypes())
      console.log('Loaded payment types:', types)

      if (types && types.length > 0) {
        console.log('Using database payment types:', types.length)
        return types
      } else {
        console.log('No payment types in database, using fallback defaults')
        const defaultTypes: PaymentType[] = DEFAULT_PAYMENT_TYPES.map(t => ({ ...t }))

        // Try to save defaults to database for future use
        try {
          for (const type of defaultTypes) {
            await addPaymentType(type)
          }
          console.log('Default types saved to database')
        } catch (saveError) {
          console.warn('Could not save default types to database:', saveError)
        }

        return defaultTypes
      }
    } catch (error) {
      console.error('Error loading payment types:', error)
      return FALLBACK_PAYMENT_TYPES.map(t => ({ ...t }))
    }
  }

  // Save new payment type
  async savePaymentType(paymentTypeForm: { name: string; color: string; isEarning: boolean }, editingPaymentType?: PaymentType) {
    if (!paymentTypeForm.name.trim()) return

    try {
      const typeValue = paymentTypeForm.name.toLowerCase().replace(/\s+/g, '_')

      if (editingPaymentType) {
        // Update existing type
        const updatedType: PaymentType = {
          ...editingPaymentType,
          label: paymentTypeForm.name.trim(),
          value: typeValue,
          color: paymentTypeForm.color,
          isEarning: paymentTypeForm.isEarning
        }
        await updatePaymentType(updatedType)
        return updatedType
      } else {
        // Check if type value already exists
        const existingTypes = await getAllPaymentTypes()
        const existingType = existingTypes.find(t => t.value === typeValue)
        if (existingType) {
          throw new Error(`A payment type with value "${typeValue}" already exists.`)
        }

        // Add new type
        const newType: PaymentType = {
          id: Date.now().toString(),
          label: paymentTypeForm.name.trim(),
          value: typeValue,
          color: paymentTypeForm.color,
          isCustom: true,
          isEarning: paymentTypeForm.isEarning
        }
        await addPaymentType(newType)
        return newType
      }
    } catch (error) {
      console.error('Error saving payment type:', error)
      throw error
    }
  }

  // Delete payment type
  async deletePaymentType(type: PaymentType) {
    if (!type.isCustom) return // Don't allow deletion of default types

    try {
      await deletePaymentTypeFromDB(type.id)
    } catch (error) {
      console.error('Error deleting payment type:', error)
      throw error
    }
  }
}

// Export singleton instance
export const paymentTypeService = new PaymentTypeService()
