// Payment type service for payment type management
import { PaymentType } from '../types/payment.types'
import { paymentDB } from './payment-db.service'

export class PaymentTypeService {
  // Color presets for payment types
  getColorPresets() {
    return [
      { name: 'Red', color: '#ef4444' },
      { name: 'Blue', color: '#3b82f6' },
      { name: 'Yellow', color: '#eab308' },
      { name: 'Green', color: '#10b981' },
      { name: 'Purple', color: '#8b5cf6' },
      { name: 'Pink', color: '#ec4899' },
      { name: 'Orange', color: '#f97316' },
      { name: 'Teal', color: '#14b8a6' }
    ]
  }

  // Load payment types from database
  async loadPaymentTypes() {
    try {
      console.log('Starting payment types load...')

      // Force database initialization with retry logic
      let initAttempts = 0
      const maxAttempts = 3

      while (initAttempts < maxAttempts) {
        try {
          await paymentDB.init()
          console.log('Database initialized successfully')
          break
        } catch (initError) {
          initAttempts++
          console.warn(`Database init attempt ${initAttempts} failed:`, initError)
          if (initAttempts >= maxAttempts) throw initError
          await new Promise(resolve => setTimeout(resolve, 100)) // Wait 100ms before retry
        }
      }

      // Try to initialize default types
      try {
        await paymentDB.initializeDefaultPaymentTypes()
        console.log('Default types initialized')
      } catch (initError) {
        console.warn('Default types initialization failed:', initError)
      }

      // Get all payment types with retry logic
      let types = []
      let typeAttempts = 0

      while (typeAttempts < maxAttempts) {
        try {
          types = await paymentDB.getAllPaymentTypes()
          console.log('Loaded payment types:', types)
          break
        } catch (typeError) {
          typeAttempts++
          console.warn(`Get payment types attempt ${typeAttempts} failed:`, typeError)
          if (typeAttempts >= maxAttempts) throw typeError
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      if (types && types.length > 0) {
        console.log('Using database payment types:', types.length)
        return types
      } else {
        console.log('No payment types in database, using fallback defaults')
        // Database is empty, use fallback defaults
      const defaultTypes: PaymentType[] = [
          { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
          { id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
          { id: 'credit', label: 'Credit', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
          { id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
          { id: 'inventory', label: 'Inventory', value: 'inventory', color: '#8b5cf6', isCustom: false, isEarning: false },
          { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
        ]

        // Try to save defaults to database for future use
        try {
          for (const type of defaultTypes) {
            await paymentDB.addPaymentType(type)
          }
          console.log('Default types saved to database')
        } catch (saveError) {
          console.warn('Could not save default types to database:', saveError)
        }

        return defaultTypes
      }
    } catch (error) {
      console.error('Error loading payment types:', error)
      // Fallback to default types if database fails completely
      return [
        { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
        { id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
        { id: 'credit', label: 'Credit', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
        { id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
        { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
      ]
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
        await paymentDB.updatePaymentType(updatedType)
        return updatedType
      } else {
        // Check if type value already exists
        const existingTypes = await paymentDB.getAllPaymentTypes()
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
        await paymentDB.addPaymentType(newType)
        return newType
      }
    } catch (error) {
      console.error('Error saving payment type:', error)
      throw error
    }
  }

  // Delete payment type
  async deletePaymentType(type: PaymentType, payments: any[]) {
    if (!type.isCustom) return // Don't allow deletion of default types

    // Check if any payments use this type
    const paymentsUsingType = payments.filter(p => p.type === type.value)
    if (paymentsUsingType.length > 0) {
      throw new Error(`Cannot delete "${type.label}" because ${paymentsUsingType.length} payment(s) are using this type.`)
    }

    try {
      await paymentDB.deletePaymentType(type.id)
    } catch (error) {
      console.error('Error deleting payment type:', error)
      throw error
    }
  }
}

// Export singleton instance
export const paymentTypeService = new PaymentTypeService()
