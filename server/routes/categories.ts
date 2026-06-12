import { Router, Request, Response } from 'express'
import { CategoryModel } from '../models/category.model'

const router = Router()

const DEFAULT_CATEGORIES = [
  { _id: 'pasta', label: 'Pasta', value: 'pasta', color: '#f59e0b', isCustom: false, defaultBasis: 'per100g' },
  { _id: 'bread', label: 'Bread', value: 'bread', color: '#d97706', isCustom: false, defaultBasis: 'per100g' },
  { _id: 'rice', label: 'Rice', value: 'rice', color: '#fbbf24', isCustom: false, defaultBasis: 'per100g' },
  { _id: 'cereal', label: 'Cereal', value: 'cereal', color: '#a16207', isCustom: false, defaultBasis: 'per100g' },
  { _id: 'fruit', label: 'Fruit', value: 'fruit', color: '#ef4444', isCustom: false, defaultBasis: 'per100g' },
  { _id: 'vegetable', label: 'Vegetable', value: 'vegetable', color: '#10b981', isCustom: false, defaultBasis: 'per100g' },
  { _id: 'dairy', label: 'Dairy', value: 'dairy', color: '#60a5fa', isCustom: false, defaultBasis: 'per100g' },
  { _id: 'meat', label: 'Meat', value: 'meat', color: '#dc2626', isCustom: false, defaultBasis: 'per100g' },
  { _id: 'snack', label: 'Snack', value: 'snack', color: '#8b5cf6', isCustom: false, defaultBasis: 'perUnit' },
  { _id: 'beverage', label: 'Beverage', value: 'beverage', color: '#06b6d4', isCustom: false, defaultBasis: 'perUnit' }
]

async function initializeDefaults() {
  const count = await CategoryModel.countDocuments()
  if (count === 0) {
    await CategoryModel.insertMany(DEFAULT_CATEGORIES)
    console.log('Default comparison categories initialized')
  }
}

// GET /api/categories - Get all comparison categories
router.get('/', async (_req: Request, res: Response) => {
  try {
    await initializeDefaults()
    const categories = await CategoryModel.find()
    res.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// POST /api/categories - Create a new comparison category
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body
    if (data.id && !data._id) {
      data._id = data.id
      delete data.id
    }
    const category = new CategoryModel(data)
    const saved = await category.save()
    res.status(201).json(saved)
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// PUT /api/categories/:id - Update a comparison category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body
    delete updateData.id
    delete updateData._id
    const updated = await CategoryModel.findByIdAndUpdate(id, updateData, { new: true })
    if (!updated) {
      res.status(404).json({ error: 'Category not found' })
      return
    }
    res.json(updated)
  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// DELETE /api/categories/:id - Delete a comparison category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deleted = await CategoryModel.findByIdAndDelete(id)
    if (!deleted) {
      res.status(404).json({ error: 'Category not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

export default router
