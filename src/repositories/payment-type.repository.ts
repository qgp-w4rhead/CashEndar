import { PaymentType } from '../types/payment.types'
import { getDB, TYPE_STORE } from './db'

export async function getAllPaymentTypes(): Promise<PaymentType[]> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TYPE_STORE], 'readonly')
    const store = transaction.objectStore(TYPE_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function addPaymentType(paymentType: PaymentType): Promise<void> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TYPE_STORE], 'readwrite')
    const store = transaction.objectStore(TYPE_STORE)
    const request = store.add(paymentType)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function updatePaymentType(paymentType: PaymentType): Promise<void> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TYPE_STORE], 'readwrite')
    const store = transaction.objectStore(TYPE_STORE)
    const request = store.put(paymentType)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function deletePaymentType(id: string): Promise<void> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([TYPE_STORE], 'readwrite')
    const store = transaction.objectStore(TYPE_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
