import { PaymentType } from '../types/payment.types'
import { apiFetch } from './db'

export async function getAllPaymentTypes(): Promise<PaymentType[]> {
  return apiFetch<PaymentType[]>('/payment-types')
}

export async function addPaymentType(paymentType: PaymentType): Promise<PaymentType> {
  return apiFetch<PaymentType>('/payment-types', {
    method: 'POST',
    body: JSON.stringify(paymentType),
  })
}

export async function updatePaymentType(paymentType: PaymentType): Promise<PaymentType> {
  return apiFetch<PaymentType>(`/payment-types/${paymentType.id}`, {
    method: 'PUT',
    body: JSON.stringify(paymentType),
  })
}

export async function deletePaymentType(id: string): Promise<void> {
  await apiFetch(`/payment-types/${id}`, {
    method: 'DELETE',
  })
}
