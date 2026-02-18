import { Payment } from '../types/payment.types'
import { getDB, PAYMENT_STORE } from './db'

export async function getAllPayments(): Promise<Payment[]> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PAYMENT_STORE], 'readonly')
    const store = transaction.objectStore(PAYMENT_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function addPayment(payment: Payment): Promise<void> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PAYMENT_STORE], 'readwrite')
    const store = transaction.objectStore(PAYMENT_STORE)
    const request = store.add(payment)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function updatePayment(payment: Payment): Promise<void> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PAYMENT_STORE], 'readwrite')
    const store = transaction.objectStore(PAYMENT_STORE)
    const request = store.put(payment)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function deletePayment(id: string): Promise<void> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PAYMENT_STORE], 'readwrite')
    const store = transaction.objectStore(PAYMENT_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getPaymentsByDay(day: number): Promise<Payment[]> {
  const db = await getDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PAYMENT_STORE], 'readonly')
    const store = transaction.objectStore(PAYMENT_STORE)
    const index = store.index('day')
    const request = index.getAll(day)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}
