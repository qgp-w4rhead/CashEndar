import { Router, Request, Response } from 'express'
import { StatDefinitionModel } from '../models/stat-definition.model'

const router = Router()

const DEFAULT_STAT_DEFINITIONS = [
  // Derived stats are computed from purchase data (price, size, portions)
  { _id: 'price-per-portion', label: 'Price / portion', unit: '$', basis: 'perPortion', isBuiltin: true, starred: true, derived: true },
  { _id: 'price-per-100g', label: 'Price / 100g', unit: '$', basis: 'per100g', isBuiltin: true, starred: true, derived: true },
  { _id: 'price-per-unit', label: 'Price / unit', unit: '$', basis: 'perUnit', isBuiltin: true, starred: false, derived: true },
  // Stored stats hold a value per item (entered by the user or seeded)
  { _id: 'water-content', label: 'Water content', unit: '%', basis: 'per100g', isBuiltin: true, starred: true, derived: false },
  { _id: 'carbs', label: 'Carbs', unit: 'g/100g', basis: 'per100g', isBuiltin: true, starred: false, derived: false },
  { _id: 'protein', label: 'Protein', unit: 'g/100g', basis: 'per100g', isBuiltin: true, starred: false, derived: false },
  { _id: 'sugar', label: 'Sugar', unit: 'g/100g', basis: 'per100g', isBuiltin: true, starred: false, derived: false },
  { _id: 'kcal', label: 'Calories', unit: 'kcal/100g', basis: 'per100g', isBuiltin: true, starred: false, derived: false }
]

async function initializeDefaults() {
  const count = await StatDefinitionModel.countDocuments()
  if (count === 0) {
    await StatDefinitionModel.insertMany(DEFAULT_STAT_DEFINITIONS)
    console.log('Default stat definitions initialized')
  }
}

// GET /api/stat-definitions - Get all stat definitions
router.get('/', async (_req: Request, res: Response) => {
  try {
    await initializeDefaults()
    const stats = await StatDefinitionModel.find()
    res.json(stats)
  } catch (error) {
    console.error('Error fetching stat definitions:', error)
    res.status(500).json({ error: 'Failed to fetch stat definitions' })
  }
})

// POST /api/stat-definitions - Create a custom stat definition
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body
    if (data.id && !data._id) {
      data._id = data.id
      delete data.id
    }
    if (!data._id && data.label) {
      data._id = String(data.label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }
    // User-created stats are custom by definition
    data.isBuiltin = false
    data.derived = false
    const stat = new StatDefinitionModel(data)
    const saved = await stat.save()
    res.status(201).json(saved)
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ error: 'A stat with this id already exists' })
      return
    }
    console.error('Error creating stat definition:', error)
    res.status(500).json({ error: 'Failed to create stat definition' })
  }
})

// PUT /api/stat-definitions/:id - Update a stat definition (incl. starring)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body
    delete updateData.id
    delete updateData._id
    const updated = await StatDefinitionModel.findByIdAndUpdate(id, updateData, { new: true })
    if (!updated) {
      res.status(404).json({ error: 'Stat definition not found' })
      return
    }
    res.json(updated)
  } catch (error) {
    console.error('Error updating stat definition:', error)
    res.status(500).json({ error: 'Failed to update stat definition' })
  }
})

// DELETE /api/stat-definitions/:id - Delete a stat definition
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const existing = await StatDefinitionModel.findById(id)
    if (!existing) {
      res.status(404).json({ error: 'Stat definition not found' })
      return
    }
    if (existing.isBuiltin) {
      res.status(400).json({ error: 'Built-in stats cannot be deleted' })
      return
    }
    await existing.deleteOne()
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting stat definition:', error)
    res.status(500).json({ error: 'Failed to delete stat definition' })
  }
})

export default router
