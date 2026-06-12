import { Schema, model } from 'mongoose'

// Comparison categories: items in the same category are comparable
// "apples to apples" (pasta vs pasta, bread vs bread, fruit vs fruit by gram)
const categorySchema = new Schema({
  _id: { type: String },
  label: { type: String, required: true },
  value: { type: String, required: true, unique: true },
  color: { type: String, required: true },
  isCustom: { type: Boolean, default: false },
  // How items of this category are normalized when compared
  defaultBasis: {
    type: String,
    enum: ['per100g', 'perUnit', 'perPortion'],
    default: 'per100g'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.id = ret._id
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

export const CategoryModel = model('Category', categorySchema)
