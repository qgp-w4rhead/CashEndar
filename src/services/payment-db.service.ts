// PaymentDB service for IndexedDB operations
import { Payment, PaymentType } from '../types/payment.types'

export class PaymentDB {
  private dbName = 'PaymentCalendarDB'
  private dbVersion = 3 // Updated version for sequential IDs
  private storeName = 'payments'
  private typeStoreName = 'paymentTypes'
  private counterStoreName = 'counters'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create payments store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('day', 'day', { unique: false })
          store.createIndex('type', 'type', { unique: false })
        }

        // Create payment types store
        if (!db.objectStoreNames.contains(this.typeStoreName)) {
          const typeStore = db.createObjectStore(this.typeStoreName, { keyPath: 'id' })
          typeStore.createIndex('value', 'value', { unique: true })
        }

        // Create counters store for sequential IDs
        if (!db.objectStoreNames.contains(this.counterStoreName)) {
          const counterStore = db.createObjectStore(this.counterStoreName, { keyPath: 'name' })
        }
      }
    })
  }

  async getAllPayments(): Promise<Payment[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addPayment(payment: Payment): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(payment)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updatePayment(payment: Payment): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(payment)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deletePayment(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPaymentsByDay(day: number): Promise<Payment[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('day')
      const request = index.getAll(day)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  // Payment type management methods
  async getAllPaymentTypes(): Promise<PaymentType[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.typeStoreName], 'readonly')
      const store = transaction.objectStore(this.typeStoreName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async addPaymentType(paymentType: PaymentType): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.typeStoreName], 'readwrite')
      const store = transaction.objectStore(this.typeStoreName)
      const request = store.add(paymentType)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async updatePaymentType(paymentType: PaymentType): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.typeStoreName], 'readwrite')
      const store = transaction.objectStore(this.typeStoreName)
      const request = store.put(paymentType)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deletePaymentType(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.typeStoreName], 'readwrite')
      const store = transaction.objectStore(this.typeStoreName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async initializeDefaultPaymentTypes(): Promise<void> {
    const defaultTypes: PaymentType[] = [
      { id: 'rent', label: 'Rent', value: 'rent', color: '#ef4444', isCustom: false, isEarning: false },
      { id: 'utility', label: 'Utility', value: 'utility', color: '#f59e0b', isCustom: false, isEarning: false },
      { id: 'credit', label: 'Credit', value: 'credit', color: '#06b6d4', isCustom: false, isEarning: false },
      { id: 'subscription', label: 'Subscription', value: 'subscription', color: '#10b981', isCustom: false, isEarning: false },
      { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
    ]

    try {
      const existingTypes = await this.getAllPaymentTypes()
      console.log('Existing payment types:', existingTypes.length, existingTypes.map(t => t.value))

      if (existingTypes.length === 0) {
        console.log('No existing types found, initializing defaults...')
        for (const type of defaultTypes) {
          await this.addPaymentType(type)
          console.log('Added default type:', type.value)
        }
      } else {
        // Check if earnings type exists, if not, add it
        const earningsType = existingTypes.find(t => t.value === 'earnings')
        if (!earningsType) {
          console.log('Earnings type missing, adding it...')
          const earningsTypeToAdd: PaymentType = { id: 'earnings', label: 'Earnings', value: 'earnings', color: '#10b981', isCustom: false, isEarning: true }
          await this.addPaymentType(earningsTypeToAdd)
          console.log('Added missing earnings type')
        }
      }
    } catch (error) {
      console.error('Error initializing default payment types:', error)
    }
  }

  // Counter management methods for sequential IDs
  async getNextPaymentId(): Promise<number> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.counterStoreName], 'readwrite')
      const store = transaction.objectStore(this.counterStoreName)

      // Try to get the current counter
      const getRequest = store.get('paymentCounter')

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const counter = getRequest.result

        if (counter) {
          // Increment existing counter
          const nextId = counter.value + 1
          counter.value = nextId

          const updateRequest = store.put(counter)
          updateRequest.onerror = () => reject(updateRequest.error)
          updateRequest.onsuccess = () => resolve(nextId)
        } else {
          // Initialize counter at 1
          const newCounter = { name: 'paymentCounter', value: 1 }
          const addRequest = store.add(newCounter)
          addRequest.onerror = () => reject(addRequest.error)
          addRequest.onsuccess = () => resolve(1)
        }
      }
    })
  }
}

// Export singleton instance
export const paymentDB = new PaymentDB()
