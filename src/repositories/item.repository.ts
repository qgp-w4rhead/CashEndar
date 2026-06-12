import { Item } from '../types/catalog.types'
import { apiFetch } from './db'

export async function getAllItems(): Promise<Item[]> {
  return apiFetch<Item[]>('/items')
}

export async function addItem(item: Partial<Item>): Promise<Item> {
  return apiFetch<Item>('/items', {
    method: 'POST',
    body: JSON.stringify(item),
  })
}

export async function updateItem(item: Item): Promise<Item> {
  return apiFetch<Item>(`/items/${item.id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  })
}

export async function deleteItem(id: string): Promise<void> {
  await apiFetch(`/items/${id}`, {
    method: 'DELETE',
  })
}

export async function addAlias(itemId: string, alias: string): Promise<Item> {
  return apiFetch<Item>(`/items/${itemId}/aliases`, {
    method: 'POST',
    body: JSON.stringify({ alias }),
  })
}

export async function removeAlias(itemId: string, alias: string): Promise<Item> {
  return apiFetch<Item>(`/items/${itemId}/aliases`, {
    method: 'DELETE',
    body: JSON.stringify({ alias }),
  })
}

export async function mergeItems(sourceIds: string[], targetId: string): Promise<{ target: Item, paymentsRenamed: number }> {
  return apiFetch<{ target: Item, paymentsRenamed: number }>('/items/merge', {
    method: 'POST',
    body: JSON.stringify({ sourceIds, targetId }),
  })
}
