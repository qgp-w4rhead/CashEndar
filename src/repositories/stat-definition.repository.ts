import { StatDefinition } from '../types/catalog.types'
import { apiFetch } from './db'

export async function getAllStatDefinitions(): Promise<StatDefinition[]> {
  return apiFetch<StatDefinition[]>('/stat-definitions')
}

export async function addStatDefinition(stat: Partial<StatDefinition>): Promise<StatDefinition> {
  return apiFetch<StatDefinition>('/stat-definitions', {
    method: 'POST',
    body: JSON.stringify(stat),
  })
}

export async function updateStatDefinition(stat: StatDefinition): Promise<StatDefinition> {
  return apiFetch<StatDefinition>(`/stat-definitions/${stat.id}`, {
    method: 'PUT',
    body: JSON.stringify(stat),
  })
}

export async function deleteStatDefinition(id: string): Promise<void> {
  await apiFetch(`/stat-definitions/${id}`, {
    method: 'DELETE',
  })
}
