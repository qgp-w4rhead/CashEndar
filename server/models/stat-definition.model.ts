import { Schema, model } from 'mongoose'

// Stat definitions: built-in (price/portion, water content, carbs...) and
// user-created custom stats. `starred` builds the user's personal stat list.
// `derived` stats are computed from purchase data client-side and never
// stored per item (e.g. price-per-100g).
const statDefinitionSchema = new Schema({
  _id: { type: String },
  label: { type: String, required: true },
  unit: { type: String, default: '' },
  basis: {
    type: String,
    enum: ['per100g', 'perUnit', 'perPortion'],
    default: 'per100g'
  },
  isBuiltin: { type: Boolean, default: false },
  starred: { type: Boolean, default: false },
  derived: { type: Boolean, default: false }
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

export const StatDefinitionModel = model('StatDefinition', statDefinitionSchema)
