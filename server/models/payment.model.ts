import { Schema, model } from 'mongoose'

const paymentSchema = new Schema({
  title: { type: String, required: true },
  amount: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String },
  type: { type: String, required: true },
  day: { type: Number },
  dayOfWeek: { type: Number },
  referenceDate: { type: Number },
  frequency: {
    type: String,
    required: true,
    enum: ['one-time', 'recurring', 'weekly', 'bi-monthly']
  },
  itemName: { type: String },
  brand: { type: String },
  quantity: { type: Number },
  unitCost: { type: Number },
  portionSize: { type: Number },
  portionsCount: { type: Number },
  itemSize: { type: Number },
  itemSizeUnit: {
    type: String,
    enum: ['single', 'gram', 'kg', 'ml', 'liter', 'cup', 'tablespoon', 'teaspoon', 'piece', 'can', 'bottle']
  },
  depletionRate: { type: Number },
  depletionUnit: {
    type: String,
    enum: ['day', 'week', 'month']
  },
  depletionTime: { type: Number },
  forgone: { type: Boolean },
  expirationPeriod: { type: Number },
  expirationUnit: {
    type: String,
    enum: ['day', 'week', 'month', 'year']
  },
  freshnessOffset: { type: Number },
  freshnessOffsetUnit: {
    type: String,
    enum: ['day', 'week', 'month', 'year']
  },
  calculatedExpirationDate: { type: String }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

paymentSchema.index({ day: 1 })
paymentSchema.index({ type: 1 })

export const PaymentModel = model('Payment', paymentSchema)
