import { Schema, model } from 'mongoose'

const itemSchema = new Schema({
  name: { type: String, required: true, unique: true },
  aliases: { type: [String], default: [] },
  brand: { type: String },
  categoryId: { type: String },
  // statDefinitionId -> value (e.g. { 'water-content': 86 })
  stats: { type: Map, of: Number, default: {} }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    flattenMaps: true,
    transform: (_doc, ret) => {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.__v
      return ret
    }
  }
})

itemSchema.index({ aliases: 1 })
itemSchema.index({ categoryId: 1 })

export const ItemModel = model('Item', itemSchema)
