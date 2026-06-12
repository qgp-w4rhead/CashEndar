import { ComparisonCategory } from '../types/catalog.types'
import { apiFetch } from './db'

export async function getAllCategories(): Promise<ComparisonCategory[]> {
  return apiFetch<ComparisonCategory[]>('/categories')
}

export async function addCategory(category: Partial<ComparisonCategory>): Promise<ComparisonCategory> {
  return apiFetch<ComparisonCategory>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  })
}

export async function updateCategory(category: ComparisonCategory): Promise<ComparisonCategory> {
  return apiFetch<ComparisonCategory>(`/categories/${category.id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/categories/${id}`, {
    method: 'DELETE',
  })
}
