// Reactive state for the product catalog: items (with aliases),
// comparison categories and stat definitions
import { ref, computed } from 'vue'
import { Item, ComparisonCategory, StatDefinition } from '../types/catalog.types'
import { buildAliasLookup } from '../services/alias.service'

export const items = ref<Item[]>([])
export const categories = ref<ComparisonCategory[]>([])
export const statDefinitions = ref<StatDefinition[]>([])

// Normalized name/alias -> canonical name, rebuilt only when items change.
// Keeps alias resolution O(1) inside hot grouping loops.
export const aliasLookup = computed(() => buildAliasLookup(items.value))

export const starredStats = computed(() => statDefinitions.value.filter(s => s.starred))

export const categoryById = computed(() => {
  const map = new Map<string, ComparisonCategory>()
  categories.value.forEach(category => map.set(category.id, category))
  return map
})

export const itemByCanonicalName = computed(() => {
  const map = new Map<string, Item>()
  items.value.forEach(item => map.set(item.name, item))
  return map
})
