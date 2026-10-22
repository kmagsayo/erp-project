export type BillingStatus = 'unpaid' | 'partial' | 'paid'

export interface BillingLineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  amount: number
}

export interface Billing {
  id: string
  billingNo: string
  customerId: string
  customerName: string
  projectId: string
  projectName: string
  invoiceNo: string
  deliveryReceiptId: string
  deliveryReceiptNo: string
  date: string
  dueDate: string
  status: BillingStatus
  items: BillingLineItem[]
  subtotal: number
  tax: number
  withholdingTax: number
  retentionAmount: number
  managementAmount: number
  mobilizationAmount: number
  total: number
  amountPaid: number
  balance: number
  remarks: string
}

export type BillingFilterStatus = BillingStatus | 'all'

export interface BillingFilters {
  status: BillingFilterStatus
  search: string
  dateFrom: string
  dateTo: string
}
