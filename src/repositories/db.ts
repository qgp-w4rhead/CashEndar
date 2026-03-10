// API base URL — proxied through Vite in dev, configurable for production
// Set VITE_API_BASE in .env to point to the backend machine (e.g. https://api.example.com/api)
export const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const TOKEN_KEY = 'cashendar_token'

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// Helper for making API requests with error handling
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const token = getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearAuthToken()
    throw new Error('Unauthorized — please log in again')
  }

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`API error ${res.status}: ${errorBody}`)
  }

  return res.json()
}

// Kept for backward compatibility — services that call getDB() will get a resolved promise
export async function getDB(): Promise<void> {
  return Promise.resolve()
}
