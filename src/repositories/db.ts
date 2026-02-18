// Shared IndexedDB connection manager
const DB_NAME = 'PaymentCalendarDB'
const DB_VERSION = 3
const PAYMENT_STORE = 'payments'
const TYPE_STORE = 'paymentTypes'
const COUNTER_STORE = 'counters'

export { PAYMENT_STORE, TYPE_STORE, COUNTER_STORE }

let db: IDBDatabase | null = null

export async function getDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      if (!database.objectStoreNames.contains(PAYMENT_STORE)) {
        const store = database.createObjectStore(PAYMENT_STORE, { keyPath: 'id' })
        store.createIndex('day', 'day', { unique: false })
        store.createIndex('type', 'type', { unique: false })
      }

      if (!database.objectStoreNames.contains(TYPE_STORE)) {
        const typeStore = database.createObjectStore(TYPE_STORE, { keyPath: 'id' })
        typeStore.createIndex('value', 'value', { unique: true })
      }

      if (!database.objectStoreNames.contains(COUNTER_STORE)) {
        database.createObjectStore(COUNTER_STORE, { keyPath: 'name' })
      }
    }
  })
}
