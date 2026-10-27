import type { Billing, BillingLineItem } from '@/data/billingTypes'
import { request } from '@/lib/api'

interface BillingApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function listActiveBillings(): Promise<Billing[]> {
  const response = await request<BillingApiResponse<{ billings: Billing[] }>>('/billings')
  return response.data.billings ?? []
}

export async function listBillingRows(): Promise<Billing[]> {
  const response = await request<BillingApiResponse<{ billings: Billing[]; schedules?: Billing[] }>>(
    '/billings',
  )
  return [...(response.data.schedules ?? []), ...(response.data.billings ?? [])]
}

export async function deleteBillingRecord(id: string): Promise<void> {
  if (id.startsWith('schedule-')) {
    await request(`/billings/schedules/${id.slice('schedule-'.length)}`, { method: 'DELETE' })
    return
  }
  if (id.startsWith('db-')) {
    await request(`/billings/${id.slice('db-'.length)}`, { method: 'DELETE' })
  }
}

export async function scheduleBilling(payload: {
  customerId: string
  customerName: string
  projectId: string
  projectName: string
  invoiceNo: string
  transactionDate: string
  withholdingTax: number
  retentionAmount: number
  recoupmentAmount: number
  mobilizationAmount: number
  contractAmount: number
  startDate: string
  endDate: string
  runDay: number
  remarks: string
  items: BillingLineItem[]
}): Promise<string> {
  const response = await request<BillingApiResponse<unknown>>('/billings/schedules', {
    method: 'POST',
    body: JSON.stringify({
      customer_id: payload.customerId,
      customer_name: payload.customerName,
      project_id: payload.projectId,
      project_name: payload.projectName,
      invoice_no: payload.invoiceNo,
      transaction_date: payload.transactionDate,
      withholding_tax: payload.withholdingTax,
      retention_amount: payload.retentionAmount,
      recoupment_amount: payload.recoupmentAmount,
      mobilization_amount: payload.mobilizationAmount,
      contract_amount: payload.contractAmount,
      start_date: payload.startDate,
      end_date: payload.endDate,
      run_day: payload.runDay,
      remarks: payload.remarks,
      items: payload.items,
    }),
  })
  return response.message
}
