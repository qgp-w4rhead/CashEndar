// Catalog loading and lazy backfill: every distinct payment itemName that
// doesn't resolve to a catalog item becomes one, so the catalog is always
// derivable from existing data without a migration step.
import { Payment } from '../types/payment.types'
import { Item } from '../types/catalog.types'
import { items, categories, statDefinitions } from '../stores/catalog.store'
import { getAllItems, addItem } from '../repositories/item.repository'
import { getAllCategories } from '../repositories/category.repository'
import { getAllStatDefinitions } from '../repositories/stat-definition.repository'
import { buildAliasLookup, normalizeName } from './alias.service'

export async function loadCatalog(): Promise<void> {
  try {
    const [loadedItems, loadedCategories, loadedStats] = await Promise.all([
      getAllItems(),
      getAllCategories(),
      getAllStatDefinitions(),
    ])
    items.value = loadedItems
    categories.value = loadedCategories
    statDefinitions.value = loadedStats
  } catch (error) {
    console.error('Error loading catalog:', error)
    items.value = []
    categories.value = []
    statDefinitions.value = []
  }
}

// Create catalog items for itemNames that don't resolve yet.
// Dedupes by normalized name (first occurrence keeps its casing).
export async function backfillCatalogFromPayments(payments: Payment[]): Promise<void> {
  const lookup = buildAliasLookup(items.value)
  const pending = new Map<string, string>()

  payments.forEach(payment => {
    if (!payment.itemName) return
    const normalized = normalizeName(payment.itemName)
    if (!normalized || lookup.has(normalized) || pending.has(normalized)) return
    pending.set(normalized, payment.itemName.trim())
  })

  if (pending.size === 0) return

  const created: Item[] = []
  for (const name of pending.values()) {
    try {
      created.push(await addItem({ name, aliases: [] }))
    } catch (error) {
      // 409 = item already exists (e.g. created in another tab) — safe to skip
      console.warn(`Could not backfill catalog item "${name}":`, error)
    }
  }

  if (created.length > 0) {
    items.value = [...items.value, ...created]
    console.log(`Catalog backfill created ${created.length} item(s) from payment history`)
  }
}
