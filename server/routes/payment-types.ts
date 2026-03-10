import { Router, Request, Response } from 'express'
import { PaymentTypeModel } from '../models/payment-type.model'

const router = Router()

const DEFAULT_PAYMENT_TYPES = [
  { _id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
  { _id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
  { _id: 'credit', label: 'Credit', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
  { _id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
  { _id: 'inventory', label: 'Inventory', value: 'inventory', color: '#8b5cf6', isCustom: false, isEarning: false },
  { _id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
]

// Initialize default payment types if none exist
async function initializeDefaults() {
  const count = await PaymentTypeModel.countDocuments()
  if (count === 0) {
    await PaymentTypeModel.insertMany(DEFAULT_PAYMENT_TYPES)
    console.log('Default payment types initialized')
  }
}

// GET /api/payment-types - Get all payment types
router.get('/', async (_req: Request, res: Response) => {
  try {
    await initializeDefaults()
    const types = await PaymentTypeModel.find()
    res.json(types)
  } catch (error) {
    console.error('Error fetching payment types:', error)
    res.status(500).json({ error: 'Failed to fetch payment types' })
  }
})

// POST /api/payment-types - Create a new payment type
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body
    // Use provided id as _id, or generate from label
    if (data.id && !data._id) {
      data._id = data.id
      delete data.id
    }
    const paymentType = new PaymentTypeModel(data)
    const saved = await paymentType.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error('Error creating payment type:', error)
    res.status(500).json({ error: 'Failed to create payment type' })
  }
})

// PUT /api/payment-types/:id - Update a payment type
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body
    delete updateData.id
    delete updateData._id
    const updated = await PaymentTypeModel.findByIdAndUpdate(id, updateData, { new: true })
    if (!updated) {
      res.status(404).json({ error: 'Payment type not found' })
      return
    }
    res.json(updated)
  } catch (error) {
    console.error('Error updating payment type:', error)
    res.status(500).json({ error: 'Failed to update payment type' })
  }
})

// DELETE /api/payment-types/:id - Delete a payment type
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deleted = await PaymentTypeModel.findByIdAndDelete(id)
    if (!deleted) {
      res.status(404).json({ error: 'Payment type not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment type:', error)
    res.status(500).json({ error: 'Failed to delete payment type' })
  }
})

export default router
