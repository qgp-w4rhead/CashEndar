import { Router, Request, Response } from 'express'
import { PaymentModel } from '../models/payment.model'

const router = Router()

// GET /api/payments - Get all payments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const payments = await PaymentModel.find()
    res.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

// GET /api/payments/by-day/:day - Get payments by day
router.get('/by-day/:day', async (req: Request, res: Response) => {
  try {
    const day = parseInt(req.params.day, 10)
    const payments = await PaymentModel.find({ day })
    res.json(payments)
  } catch (error) {
    console.error('Error fetching payments by day:', error)
    res.status(500).json({ error: 'Failed to fetch payments by day' })
  }
})

// POST /api/payments - Create a new payment
router.post('/', async (req: Request, res: Response) => {
  try {
    const paymentData = req.body
    // Remove client-side id if present — let MongoDB generate _id
    delete paymentData.id
    delete paymentData._id
    const payment = new PaymentModel(paymentData)
    const saved = await payment.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error('Error creating payment:', error)
    res.status(500).json({ error: 'Failed to create payment' })
  }
})

// PUT /api/payments/:id - Update a payment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body
    delete updateData.id
    delete updateData._id
    const updated = await PaymentModel.findByIdAndUpdate(id, updateData, { new: true })
    if (!updated) {
      res.status(404).json({ error: 'Payment not found' })
      return
    }
    res.json(updated)
  } catch (error) {
    console.error('Error updating payment:', error)
    res.status(500).json({ error: 'Failed to update payment' })
  }
})

// DELETE /api/payments/:id - Delete a payment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deleted = await PaymentModel.findByIdAndDelete(id)
    if (!deleted) {
      res.status(404).json({ error: 'Payment not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment:', error)
    res.status(500).json({ error: 'Failed to delete payment' })
  }
})

export default router
