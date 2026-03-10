// Payment type service for payment type management
import { PaymentType } from '../types/payment.types'
import { getAllPaymentTypes, addPaymentType, updatePaymentType, deletePaymentType as deletePaymentTypeFromDB } from '../repositories/payment-type.repository'
import { FALLBACK_PAYMENT_TYPES } from '../utils/constants'

export class PaymentTypeService {
  // Load payment types from MongoDB via API
  // The server handles default type initialization automatically
  async loadPaymentTypes(): Promise<PaymentType[]> {
    try {
      console.log('Loading payment types from API...')
      const types = await getAllPaymentTypes()
      console.log('Loaded payment types:', types.length)
      return types
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
