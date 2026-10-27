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
  statementDate: string
  statementNo: string
  reference: string
  activityCaption: string
  items: SoaPrintItem[]
  subtotalAmount: number
  totalAmount: number
}

export const formatSoaDisplayDate = formatBillingDisplayDate

export const soaStatusLabel: Record<SoaStatus, string> = {
  open: 'Open',
  partial: 'Partial',
  settled: 'Settled',
}

const ORDINAL_WORDS = [
  'FIRST',
  'SECOND',
  'THIRD',
  'FOURTH',
  'FIFTH',
  'SIXTH',
  'SEVENTH',
  'EIGHTH',
  'NINTH',
  'TENTH',
  'ELEVENTH',
  'TWELFTH',
  'THIRTEENTH',
  'FOURTEENTH',
  'FIFTEENTH',
  'SIXTEENTH',
  'SEVENTEENTH',
  'EIGHTEENTH',
  'NINETEENTH',
  'TWENTIETH',
]

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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatSoaMonthYear(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate.toUpperCase()
  return date
    .toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    .toUpperCase()
}

export function formatSoaPrintMoney(value: number): string {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function billingOrdinalLabel(installmentNo: number): string {
  if (installmentNo < 1) return ''
  if (installmentNo <= ORDINAL_WORDS.length) {
    return `${ORDINAL_WORDS[installmentNo - 1]} BILLING`
  }
  const remainder = installmentNo % 100
  const suffix =
    remainder >= 11 && remainder <= 13
      ? 'TH'
      : remainder % 10 === 1
        ? 'ST'
        : remainder % 10 === 2
          ? 'ND'
          : remainder % 10 === 3
            ? 'RD'
            : 'TH'
  return `${installmentNo}${suffix} BILLING`
}

export function buildSoaActivityCaption(billing: Billing): string {
  const monthYear = formatSoaMonthYear(billing.date)
  const installmentNo = billing.installmentNo ?? 0
  const installmentCount = billing.installmentCount ?? 0

  if (monthYear && installmentNo > 0 && installmentCount > 0) {
    return `Account Activity - FOR THE MONTH OF ${monthYear} (${installmentNo} of ${installmentCount}) - ${billingOrdinalLabel(installmentNo)}`
  }
  if (monthYear && installmentNo > 0) {
    return `Account Activity - FOR THE MONTH OF ${monthYear} - ${billingOrdinalLabel(installmentNo)}`
  }
  if (monthYear) {
    return `Account Activity - FOR THE MONTH OF ${monthYear}`
  }
  return 'Account Activity'
}

function printItemsFromBilling(billing: Billing): SoaPrintItem[] {
  if (billing.items.length > 0) {
    return billing.items.map((item, index) => {
      const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1
      const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : item.amount
      const total = Number.isFinite(item.amount) ? item.amount : quantity * unitPrice
      return {
        id: item.id,
        itemNo: index + 1,
        quantity,
        unit: item.unit?.trim() || 'LOT',
        description: item.description,
        unitPrice,
        total,
      }
    })
  }

  return [
    {
      id: billing.id,
      itemNo: 1,
      quantity: 1,
      unit: 'LOT',
      description: billing.projectName || `Billing — ${billing.billingNo}`,
      unitPrice: billing.total,
      total: billing.total,
    },
  ]
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

  const primary = customerBillings[0]
  const items: SoaPrintItem[] = []
  customerBillings.forEach((billing) => {
    printItemsFromBilling(billing).forEach((item) => {
      items.push({
        ...item,
        itemNo: items.length + 1,
      })
    })
  })

  const statementDate = primary?.date || dateTo || todayIsoDate()
  const statementNo = primary?.invoiceNo || primary?.billingNo || statementDate.replaceAll('-', '')
  const reference = primary?.projectName || ''
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0)

  return {
    customerName: customer.name || primary?.customerName || '—',
    customerAddress: customer.address ?? '',
    statementDate,
    statementNo,
    reference,
    activityCaption: primary ? buildSoaActivityCaption(primary) : 'Account Activity',
    items,
    subtotalAmount: totalAmount,
    totalAmount,
  }
}

export { formatBillingMoney as formatSoaMoney }
