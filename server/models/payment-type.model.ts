import { Schema, model } from 'mongoose'

const paymentTypeSchema = new Schema({
  _id: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, required: true, unique: true },
  color: { type: String, required: true },
  isCustom: { type: Boolean, required: true, default: false },
  isEarning: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id
      delete ret.__v
      return ret
    }
  }
})

export const PaymentTypeModel = model('PaymentType', paymentTypeSchema)
