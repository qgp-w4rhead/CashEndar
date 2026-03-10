import { Payment } from '../types/payment.types'
import { apiFetch } from './db'

export async function getAllPayments(): Promise<Payment[]> {
  return apiFetch<Payment[]>('/payments')
}

export async function addPayment(payment: Payment): Promise<Payment> {
  return apiFetch<Payment>('/payments', {
    method: 'POST',
    body: JSON.stringify(payment),
  })
}

export async function updatePayment(payment: Payment): Promise<Payment> {
  return apiFetch<Payment>(`/payments/${payment.id}`, {
    method: 'PUT',
    body: JSON.stringify(payment),
  })
}

export async function deletePayment(id: string): Promise<void> {
  await apiFetch(`/payments/${id}`, {
    method: 'DELETE',
  })
}

export async function getPaymentsByDay(day: number): Promise<Payment[]> {
  return apiFetch<Payment[]>(`/payments/by-day/${day}`)
}
