import { ApiError, request } from '@/lib/api'

export interface DeliveryReceiptConfirmation {
  receiptId: string
  token: string
  receivedBy: string
  receivedAt: string
  remarks: string
  confirmed: boolean
}

export async function registerDeliveryReceiptToken(token: string, receiptId: string) {
  const response = await request<{ data: DeliveryReceiptConfirmation }>('/delivery-receipt-tokens', {
    method: 'POST',
    body: JSON.stringify({ token, receiptId }),
  })
  return response.data
}

export async function fetchDeliveryReceiptToken(token: string) {
  const response = await request<{ data: DeliveryReceiptConfirmation }>(
    `/delivery-receipt-tokens?token=${encodeURIComponent(token)}`,
  )
  return response.data
}

export async function confirmDeliveryReceiptToken(token: string, remarks: string) {
  try {
    const response = await request<{ data: DeliveryReceiptConfirmation }>(
      '/delivery-receipt-tokens/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ token, remarks }),
      },
    )
    return { confirmation: response.data, already: false }
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 409) throw error
    const existing = await fetchDeliveryReceiptToken(token)
    return { confirmation: existing, already: true }
  }
}
