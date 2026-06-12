import { Router, Request, Response } from 'express'
import { ItemModel } from '../models/item.model'
import { PaymentModel } from '../models/payment.model'

const router = Router()

// GET /api/items - Get all catalog items
router.get('/', async (_req: Request, res: Response) => {
  try {
    const items = await ItemModel.find()
    res.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    res.status(500).json({ error: 'Failed to fetch items' })
  }
})

// POST /api/items - Create a new catalog item
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body
    delete data.id
    delete data._id
    const item = new ItemModel(data)
    const saved = await item.save()
    res.status(201).json(saved)
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ error: 'An item with this name already exists' })
      return
    }
    console.error('Error creating item:', error)
    res.status(500).json({ error: 'Failed to create item' })
  }
})

// PUT /api/items/:id - Update a catalog item
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body
    delete updateData.id
    delete updateData._id
    const updated = await ItemModel.findByIdAndUpdate(id, updateData, { new: true })
    if (!updated) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json(updated)
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ error: 'An item with this name already exists' })
      return
    }
    console.error('Error updating item:', error)
    res.status(500).json({ error: 'Failed to update item' })
  }
})

// DELETE /api/items/:id - Delete a catalog item
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const deleted = await ItemModel.findByIdAndDelete(id)
    if (!deleted) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting item:', error)
    res.status(500).json({ error: 'Failed to delete item' })
  }
})

// POST /api/items/:id/aliases - Add an alias to an item
// An alias may only belong to one item (otherwise resolution is ambiguous)
router.post('/:id/aliases', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { alias } = req.body
    if (!alias || typeof alias !== 'string' || !alias.trim()) {
      res.status(400).json({ error: 'alias is required' })
      return
    }
    const trimmed = alias.trim()

    const conflicting = await ItemModel.findOne({
      _id: { $ne: id },
      $or: [{ name: trimmed }, { aliases: trimmed }]
    })
    if (conflicting) {
      res.status(409).json({ error: `Alias already used by item "${conflicting.name}"` })
      return
    }

    const updated = await ItemModel.findByIdAndUpdate(
      id,
      { $addToSet: { aliases: trimmed } },
      { new: true }
    )
    if (!updated) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json(updated)
  } catch (error) {
    console.error('Error adding alias:', error)
    res.status(500).json({ error: 'Failed to add alias' })
  }
})

// DELETE /api/items/:id/aliases - Remove an alias from an item
router.delete('/:id/aliases', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { alias } = req.body
    const updated = await ItemModel.findByIdAndUpdate(
      id,
      { $pull: { aliases: alias } },
      { new: true }
    )
    if (!updated) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    res.json(updated)
  } catch (error) {
    console.error('Error removing alias:', error)
    res.status(500).json({ error: 'Failed to remove alias' })
  }
})

// POST /api/items/merge - Merge items into a target item
// Folds source names + aliases + stats into the target, rewrites payments'
// itemName to the target name, then deletes the sources.
router.post('/merge', async (req: Request, res: Response) => {
  try {
    const { sourceIds, targetId } = req.body as { sourceIds: string[], targetId: string }
    if (!Array.isArray(sourceIds) || sourceIds.length === 0 || !targetId) {
      res.status(400).json({ error: 'sourceIds (non-empty array) and targetId are required' })
      return
    }
    if (sourceIds.includes(targetId)) {
      res.status(400).json({ error: 'targetId cannot be part of sourceIds' })
      return
    }

    const target = await ItemModel.findById(targetId)
    if (!target) {
      res.status(404).json({ error: 'Target item not found' })
      return
    }
    const sources = await ItemModel.find({ _id: { $in: sourceIds } })
    if (sources.length === 0) {
      res.status(404).json({ error: 'No source items found' })
      return
    }

    const sourceNames: string[] = []
    for (const source of sources) {
      sourceNames.push(String(source.name))
      for (const alias of source.aliases) {
        if (alias !== target.name && !target.aliases.includes(alias)) {
          target.aliases.push(alias)
        }
      }
      // Source names become aliases of the target so old data keeps resolving
      if (source.name !== target.name && !target.aliases.includes(source.name)) {
        target.aliases.push(source.name)
      }
      // Keep existing target stats; fill gaps from sources
      const sourceStats = source.stats as Map<string, number> | undefined
      const targetStats = target.stats as Map<string, number> | undefined
      if (sourceStats && targetStats) {
        sourceStats.forEach((value: number, key: string) => {
          if (!targetStats.has(key)) {
            targetStats.set(key, value)
          }
        })
      }
    }

    await target.save()
    const renamed = await PaymentModel.updateMany(
      { itemName: { $in: sourceNames } },
      { $set: { itemName: target.name } }
    )
    await ItemModel.deleteMany({ _id: { $in: sourceIds } })

    res.json({ target: target.toJSON(), paymentsRenamed: renamed.modifiedCount })
  } catch (error) {
    console.error('Error merging items:', error)
    res.status(500).json({ error: 'Failed to merge items' })
  }
})

export default router
