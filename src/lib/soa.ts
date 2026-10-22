import type { Billing } from '@/data/billingTypes'
import type { SoaLine, SoaStatus } from '@/data/soaTypes'
import { formatBillingDisplayDate, formatBillingMoney } from '@/lib/billings'
import { todayIsoDate } from '@/lib/quotations'

export interface SoaViewModel {
  customerId: string
  customerName: string
  dateFrom: string
  dateTo: string
  lines: SoaLine[]
  totalCharges: number
  totalPayments: number
  outstandingBalance: number
}

export interface SoaPrintItem {
  id: string
  itemNo: number
  quantity: number
  unit: string
  description: string
  unitPrice: number
  total: number
}

export interface SoaPrintDocumentModel {
  customerName: string
  customerAddress: string
  thru: string
  statementDate: string
  statementNo: string
  reference: string
  items: SoaPrintItem[]
  totalAmount: number
}

export const formatSoaDisplayDate = formatBillingDisplayDate

export const soaStatusLabel: Record<SoaStatus, string> = {
  open: 'Open',
  partial: 'Partial',
  settled: 'Settled',
}

function namesMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function billingMatchesCustomer(
  billing: Billing,
  customerId: string,
  customerName: string,
): boolean {
  if (customerId && billing.customerId && billing.customerId === customerId) return true
  if (customerName && namesMatch(billing.customerName, customerName)) return true
  return false
}

function paymentDescription(billing: Billing): string {
  const base = billing.status === 'partial' ? 'Partial payment' : 'Payment'
  const remark = billing.remarks.trim()
  return remark ? `${base} — ${remark}` : base
}

export function emptySoa(
  customerId: string,
  customerName: string,
  dateFrom: string,
  dateTo: string,
): SoaViewModel {
  return {
    customerId,
    customerName: customerName || '—',
    dateFrom,
    dateTo,
    lines: [],
    totalCharges: 0,
    totalPayments: 0,
    outstandingBalance: 0,
  }
}

export function buildSoaFromBillings(
  billings: Billing[],
  customerId: string,
  dateFrom: string,
  dateTo: string,
  customerNameHint = '',
): SoaViewModel {
  const customerBillings = billings.filter((row) => {
    if (!billingMatchesCustomer(row, customerId, customerNameHint)) return false
    if (dateFrom && row.date < dateFrom) return false
    if (dateTo && row.date > dateTo) return false
    return true
  })

  const customerName =
    customerNameHint ||
    customerBillings[0]?.customerName ||
    billings.find((row) => row.customerId === customerId)?.customerName ||
    '—'

  if (!customerId && !customerNameHint) {
    return emptySoa('', '—', dateFrom, dateTo)
  }

  const lines: SoaLine[] = []
  let running = 0
  let totalCharges = 0
  let totalPayments = 0

  const sorted = [...customerBillings].sort((a, b) => a.date.localeCompare(b.date))

  sorted.forEach((billing) => {
    running += billing.total
    totalCharges += billing.total
    const reference = billing.invoiceNo || billing.billingNo
    lines.push({
      id: `${billing.id}-debit`,
      billingId: billing.id,
      date: billing.date,
      transactionDate: billing.date,
      reference,
      description: `Billing — ${reference}`,
      kind: 'billing',
      debit: billing.total,
      credit: 0,
      balance: running,
    })

    if (billing.amountPaid > 0) {
      running -= billing.amountPaid
      totalPayments += billing.amountPaid
      lines.push({
        id: `${billing.id}-credit`,
        billingId: billing.id,
        date: billing.date,
        transactionDate: billing.date,
        reference,
        description: paymentDescription(billing),
        kind: 'payment',
        debit: 0,
        credit: billing.amountPaid,
        balance: running,
      })
    }
  })

  return {
    customerId,
    customerName,
    dateFrom,
    dateTo,
    lines,
    totalCharges,
    totalPayments,
    outstandingBalance: Math.max(0, totalCharges - totalPayments),
  }
}

export function formatSoaPeriod(dateFrom: string, dateTo: string): string {
  if (!dateFrom && !dateTo) return 'All dates'
  if (dateFrom && dateTo) return `${dateFrom} to ${dateTo}`
  if (dateFrom) return `From ${dateFrom}`
  return `Until ${dateTo}`
}

export function formatSoaPrintDate(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatSoaPrintMoney(value: number): string {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function buildSoaStatementNo(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate.replaceAll('-', '')
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(3, '0')
  return `${year}${month}${day}`
}

export function buildSoaPrintDocument(
  billings: Billing[],
  customerId: string,
  dateFrom: string,
  dateTo: string,
  customer: { name?: string; address?: string; contactPerson?: string } = {},
): SoaPrintDocumentModel {
  const customerBillings = billings
    .filter((row) => {
      if (!billingMatchesCustomer(row, customerId, customer.name ?? '')) return false
      if (dateFrom && row.date < dateFrom) return false
      if (dateTo && row.date > dateTo) return false
      return true
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const items: SoaPrintItem[] = []
  customerBillings.forEach((billing) => {
    if (billing.items.length > 0) {
      billing.items.forEach((item) => {
        items.push({
          id: item.id,
          itemNo: items.length + 1,
          quantity: item.quantity,
          unit: item.unit || 'LOT',
          description: item.description,
          unitPrice: item.unitPrice,
          total: item.amount,
        })
      })
      return
    }
    items.push({
      id: billing.id,
      itemNo: items.length + 1,
      quantity: 1,
      unit: 'LOT',
      description: `Billing — ${billing.billingNo}${
        billing.deliveryReceiptNo ? ` / ${billing.deliveryReceiptNo}` : ''
      }`,
      unitPrice: billing.total,
      total: billing.total,
    })
  })

  const statementDate = dateTo || todayIsoDate()
  const references = [
    ...new Set(
      customerBillings
        .map((row) => row.deliveryReceiptNo || row.billingNo)
        .filter((value) => Boolean(value)),
    ),
  ]

  return {
    customerName: customer.name || customerBillings[0]?.customerName || '—',
    customerAddress: customer.address ?? '',
    thru: customer.contactPerson ?? '',
    statementDate,
    statementNo: buildSoaStatementNo(statementDate),
    reference: references.join(', '),
    items,
    totalAmount: items.reduce((sum, item) => sum + item.total, 0),
  }
}

export { formatBillingMoney as formatSoaMoney }
