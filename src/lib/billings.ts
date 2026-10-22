import type {
  Billing,
  BillingLineItem,
  BillingFilters,
  BillingStatus,
} from '@/data/billingTypes'
import type { DeliveryReceipt } from '@/data/erpTypes'
import { todayIsoDate } from '@/lib/quotations'

const STORAGE_KEY = 'erp-billings-v2'

export function formatBillingMoney(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatBillingDisplayDate(isoDate: string): string {
  if (!isoDate) return '—'
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function money(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function normalizeBilling(row: Partial<Billing>): Billing {
  const amountPaid = money(row.amountPaid)
  const total = money(row.total)
  const balance = Math.max(0, total - amountPaid)
  let status: BillingStatus = row.status ?? 'unpaid'
  if (balance <= 0 && total > 0) status = 'paid'
  else if (amountPaid > 0 && balance > 0) status = 'partial'
  else if (amountPaid <= 0) status = 'unpaid'
  return {
    id: row.id ?? crypto.randomUUID(),
    billingNo: row.billingNo ?? '',
    customerId: row.customerId ?? '',
    customerName: row.customerName ?? '',
    projectId: row.projectId ?? '',
    projectName: row.projectName ?? '',
    invoiceNo: row.invoiceNo || row.billingNo || '',
    deliveryReceiptId: row.deliveryReceiptId ?? '',
    deliveryReceiptNo: row.deliveryReceiptNo ?? '',
    date: row.date ?? '',
    dueDate: row.dueDate ?? '',
    status,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: money(row.subtotal) || total,
    tax: money(row.tax),
    withholdingTax: money(row.withholdingTax),
    retentionAmount: money(row.retentionAmount),
    managementAmount: money(row.managementAmount),
    mobilizationAmount: money(row.mobilizationAmount),
    total,
    amountPaid,
    balance,
    remarks: row.remarks ?? '',
  }
}

export function loadBillings(fallback: Billing[] = []): Billing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback.map(normalizeBilling)
    const parsed = JSON.parse(raw) as Array<Partial<Billing>>
    if (!Array.isArray(parsed)) return fallback.map(normalizeBilling)
    return parsed.map(normalizeBilling)
  } catch {
    return fallback.map(normalizeBilling)
  }
}

export function saveBillings(billings: Billing[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(billings.map(normalizeBilling)))
  window.dispatchEvent(new Event('erp-billings-updated'))
}

export function generateBillingNo(existing: Billing[]): string {
  const numbers = existing.map((row) => Number(row.billingNo.replace(/\D/g, '') || 0))
  const next = Math.max(0, ...numbers) + 1
  return `BS-${String(next).padStart(5, '0')}`
}

export function filterBillings(billings: Billing[], filters: BillingFilters): Billing[] {
  const search = filters.search.trim().toLowerCase()
  return billings.filter((row) => {
    if (filters.status !== 'all' && row.status !== filters.status) return false
    if (filters.dateFrom && row.date < filters.dateFrom) return false
    if (filters.dateTo && row.date > filters.dateTo) return false
    if (!search) return true
    return (
      row.billingNo.toLowerCase().includes(search) ||
      row.invoiceNo.toLowerCase().includes(search) ||
      row.customerName.toLowerCase().includes(search) ||
      row.projectName.toLowerCase().includes(search) ||
      row.deliveryReceiptNo.toLowerCase().includes(search)
    )
  })
}

export const billingStatusLabel: Record<BillingStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partially Paid',
  paid: 'Paid',
}

export function applyBillingPayment(billing: Billing, amount: number): Billing {
  const amountPaid = Math.min(billing.total, billing.amountPaid + amount)
  return normalizeBilling({ ...billing, amountPaid })
}

function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function findBillingForDeliveryReceipt(receiptId: string): Billing | undefined {
  return loadBillings([]).find(
    (row) => row.deliveryReceiptId === receiptId || row.deliveryReceiptNo === receiptId,
  )
}

function billedQuantity(item: DeliveryReceipt['items'][number]): number {
  if (item.quantity > 0) return item.quantity
  return item.allowedQuantity > 0 ? item.allowedQuantity : 0
}

function billedLineAmount(item: DeliveryReceipt['items'][number], quantity: number): number {
  const stored = Number(item.total) || 0
  if (stored > 0) return stored
  return quantity * (Number(item.unitPrice) || 0)
}

function billingItemsFromReceipt(receipt: DeliveryReceipt): BillingLineItem[] {
  const lines = receipt.items
    .map((item) => {
      const quantity = billedQuantity(item)
      const unitPrice = Number(item.unitPrice) || 0
      const amount = billedLineAmount(item, quantity)
      return {
        id: crypto.randomUUID(),
        description: item.description || item.itemCode,
        quantity,
        unit: item.unit,
        unitPrice,
        amount,
      }
    })
    .filter((line) => line.quantity > 0 || line.amount > 0)

  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0)
  if (subtotal > 0) return lines

  const fallbackAmount = Number(receipt.totalAmount) || 0
  if (fallbackAmount <= 0) return []

  return [
    {
      id: crypto.randomUUID(),
      description: `Delivery ${receipt.id}`,
      quantity: 1,
      unit: 'lot',
      unitPrice: fallbackAmount,
      amount: fallbackAmount,
    },
  ]
}

function applyReceiptAmounts(billing: Billing, receipt: DeliveryReceipt, customerId = ''): Billing {
  const items = billingItemsFromReceipt(receipt)
  const subtotal = items.reduce((sum, line) => sum + line.amount, 0)
  return normalizeBilling({
    ...billing,
    customerId: customerId || billing.customerId,
    customerName: receipt.customer || billing.customerName,
    deliveryReceiptId: receipt.id,
    deliveryReceiptNo: receipt.id,
    items: items.length > 0 ? items : billing.items,
    subtotal: subtotal > 0 ? subtotal : billing.subtotal,
    tax: billing.tax,
    total: subtotal > 0 ? subtotal : billing.total,
  })
}

function shouldRefreshBillingAmounts(billing: Billing, next: Billing): boolean {
  if (next.total <= 0) return false
  if (billing.total <= 0) return true
  return Math.abs(billing.total - next.total) > 0.0001 && billing.amountPaid <= 0
}

export function syncBillingsWithDeliveryReceipts(
  billings: Billing[],
  receipts: DeliveryReceipt[],
): Billing[] {
  let changed = false
  const next = billings.map((billing) => {
    const receipt = receipts.find(
      (row) => row.id === billing.deliveryReceiptId || row.id === billing.deliveryReceiptNo,
    )
    if (!receipt) return billing
    const refreshed = applyReceiptAmounts(billing, receipt)
    if (!shouldRefreshBillingAmounts(billing, refreshed)) return billing
    changed = true
    return refreshed
  })
  return changed ? next : billings
}

export function deliveryReceiptBillingTotal(receipt: DeliveryReceipt): number {
  return billingItemsFromReceipt(receipt).reduce((sum, line) => sum + line.amount, 0)
}

export function createBillingFromDeliveryReceipt(
  receipt: DeliveryReceipt,
  customerId = '',
  options: { date?: string; remarks?: string } = {},
): Billing {
  const billings = loadBillings([])
  const existing = billings.find(
    (row) => row.deliveryReceiptId === receipt.id || row.deliveryReceiptNo === receipt.id,
  )

  if (existing) {
    const refreshed = applyReceiptAmounts(existing, receipt, customerId)
    if (!shouldRefreshBillingAmounts(existing, refreshed)) return existing
    const next = billings.map((row) => (row.id === refreshed.id ? refreshed : row))
    saveBillings(next)
    return refreshed
  }

  const date = options.date || todayIsoDate()
  const billingNo = generateBillingNo(billings)
  const billing = applyReceiptAmounts(
    {
      id: crypto.randomUUID(),
      billingNo,
      customerId,
      customerName: receipt.customer,
      projectId: '',
      projectName: receipt.project,
      invoiceNo: billingNo,
      deliveryReceiptId: receipt.id,
      deliveryReceiptNo: receipt.id,
      date,
      dueDate: addDaysIso(date, 30),
      status: 'unpaid',
      items: [],
      subtotal: 0,
      tax: 0,
      withholdingTax: 0,
      retentionAmount: 0,
      managementAmount: 0,
      mobilizationAmount: 0,
      total: 0,
      amountPaid: 0,
      balance: 0,
      remarks: options.remarks?.trim() ?? '',
    },
    receipt,
    customerId,
  )

  saveBillings([...billings, billing])
  return billing
}

export interface ManualBillingInput {
  customerId: string
  customerName: string
  projectId: string
  projectName: string
  date: string
  invoiceNo: string
  withholdingTax: number
  retentionAmount: number
  managementAmount: number
  mobilizationAmount: number
  netAmount: number
  remarks: string
}

export function buildManualBilling(
  existing: Billing[],
  input: ManualBillingInput,
): { billing?: Billing; error?: string } {
  const invoiceNo = input.invoiceNo.trim()
  if (!input.customerId || !input.customerName.trim()) {
    return { error: 'Select a client.' }
  }
  if (!input.date) {
    return { error: 'Enter the transaction date.' }
  }
  if (!invoiceNo) {
    return { error: 'Enter the invoice number.' }
  }
  const amounts = [
    input.withholdingTax,
    input.retentionAmount,
    input.managementAmount,
    input.mobilizationAmount,
    input.netAmount,
  ]
  if (amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
    return { error: 'Amounts cannot be negative.' }
  }
  if (input.netAmount <= 0) {
    return { error: 'Enter the net amount.' }
  }
  const duplicate = existing.some(
    (row) =>
      row.billingNo.trim().toLowerCase() === invoiceNo.toLowerCase() ||
      row.invoiceNo.trim().toLowerCase() === invoiceNo.toLowerCase(),
  )
  if (duplicate) {
    return { error: 'That invoice number is already used.' }
  }

  const netAmount = input.netAmount
  return {
    billing: normalizeBilling({
      id: crypto.randomUUID(),
      billingNo: invoiceNo,
      customerId: input.customerId,
      customerName: input.customerName.trim(),
      projectId: input.projectId,
      projectName: input.projectName.trim(),
      invoiceNo,
      deliveryReceiptId: '',
      deliveryReceiptNo: '',
      date: input.date,
      dueDate: addDaysIso(input.date, 30),
      status: 'unpaid',
      items: [
        {
          id: crypto.randomUUID(),
          description: input.projectName.trim() || input.customerName.trim(),
          quantity: 1,
          unit: 'lot',
          unitPrice: netAmount,
          amount: netAmount,
        },
      ],
      subtotal: netAmount,
      tax: 0,
      withholdingTax: input.withholdingTax,
      retentionAmount: input.retentionAmount,
      managementAmount: input.managementAmount,
      mobilizationAmount: input.mobilizationAmount,
      total: netAmount,
      amountPaid: 0,
      balance: netAmount,
      remarks: input.remarks.trim(),
    }),
  }
}

export const initialBillings: Billing[] = []
