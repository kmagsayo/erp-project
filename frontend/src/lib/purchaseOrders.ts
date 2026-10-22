import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderLineItem,
  PurchaseOrderSortField,
  SortDirection,
} from '@/data/purchaseOrderTypes'
import type { Quotation } from '@/data/quotationTypes'

const STORAGE_KEY = 'erp-purchase-orders'
const REMOVE_PO_00002_KEY = 'erp-remove-po-00002-2'

function isPo00002(poNo: unknown) {
  return String(poNo ?? '').trim().toUpperCase() === 'PO-00002'
}

function stripPo00002<T extends { poNo?: string }>(rows: T[]): T[] {
  if (localStorage.getItem(REMOVE_PO_00002_KEY)) return rows
  return rows.filter((row) => !isPo00002(row.poNo))
}

function markPo00002Removed(rows: Array<{ poNo?: string }>) {
  if (localStorage.getItem(REMOVE_PO_00002_KEY)) return
  if (rows.length === 0 || rows.some((row) => isPo00002(row.poNo))) return
  localStorage.setItem(REMOVE_PO_00002_KEY, '1')
}

export function formatCurrency(value: number): string {
  return `₱${value.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`
}

export function formatPrintMoney(value: number): string {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function todayIsoDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')?.value ?? '2026'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

export function generatePoNo(orders: PurchaseOrder[]): string {
  const numbers = orders.map((row) => Number(row.poNo.split('-')[1] ?? 0))
  const next = Math.max(0, ...numbers) + 1
  return `PO-${String(next).padStart(5, '0')}`
}

export function calculateLineAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice
}

export function calculateOrderTotal(items: PurchaseOrderLineItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

const ONES = [
  '',
  'ONE',
  'TWO',
  'THREE',
  'FOUR',
  'FIVE',
  'SIX',
  'SEVEN',
  'EIGHT',
  'NINE',
  'TEN',
  'ELEVEN',
  'TWELVE',
  'THIRTEEN',
  'FOURTEEN',
  'FIFTEEN',
  'SIXTEEN',
  'SEVENTEEN',
  'EIGHTEEN',
  'NINETEEN',
]

const TENS = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']

function convertHundreds(value: number): string {
  if (value === 0) return ''
  if (value < 20) return ONES[value]
  if (value < 100) {
    const remainder = value % 10
    return `${TENS[Math.floor(value / 10)]}${remainder ? `-${ONES[remainder]}` : ''}`
  }
  const remainder = value % 100
  return `${ONES[Math.floor(value / 100)]} HUNDRED${remainder ? ` ${convertHundreds(remainder)}` : ''}`
}

export function amountToWords(amount: number): string {
  const safe = Math.max(0, Math.round(amount * 100) / 100)
  const pesos = Math.floor(safe)
  const centavos = Math.round((safe - pesos) * 100)

  if (pesos === 0 && centavos === 0) return 'ZERO PESOS ONLY'

  const parts: string[] = []
  const billions = Math.floor(pesos / 1_000_000_000)
  const millions = Math.floor((pesos % 1_000_000_000) / 1_000_000)
  const thousands = Math.floor((pesos % 1_000_000) / 1000)
  const remainder = pesos % 1000

  if (billions) parts.push(`${convertHundreds(billions)} BILLION`)
  if (millions) parts.push(`${convertHundreds(millions)} MILLION`)
  if (thousands) parts.push(`${convertHundreds(thousands)} THOUSAND`)
  if (remainder) parts.push(convertHundreds(remainder))

  let words = parts.join(' ').trim()
  if (!words) words = 'ZERO'
  words = `${words} PESO${pesos === 1 ? '' : 'S'}`

  if (centavos > 0) {
    words += ` AND ${convertHundreds(centavos)} CENTAVO${centavos === 1 ? '' : 'S'}`
  }

  return `${words} ONLY`
}

function matchesSearch(order: PurchaseOrder, search: string): boolean {
  if (!search.trim()) return true
  const term = search.trim().toLowerCase()
  return (
    order.poNo.toLowerCase().includes(term) ||
    order.supplier.toLowerCase().includes(term) ||
    (order.quotationRef?.toLowerCase().includes(term) ?? false) ||
    order.customer.toLowerCase().includes(term) ||
    order.project.toLowerCase().includes(term) ||
    order.remarks.toLowerCase().includes(term)
  )
}

function matchesDateRange(order: PurchaseOrder, dateFrom: string, dateTo: string): boolean {
  if (dateFrom && order.date < dateFrom) return false
  if (dateTo && order.date > dateTo) return false
  return true
}

export function filterPurchaseOrders(
  orders: PurchaseOrder[],
  filters: PurchaseOrderFilters,
): PurchaseOrder[] {
  return orders.filter((order) => {
    if (filters.status !== 'all' && order.status !== filters.status) return false
    if (!matchesSearch(order, filters.search)) return false
    if (!matchesDateRange(order, filters.dateFrom, filters.dateTo)) return false
    return true
  })
}

export function sortPurchaseOrders(
  orders: PurchaseOrder[],
  field: PurchaseOrderSortField,
  direction: SortDirection,
): PurchaseOrder[] {
  const sorted = [...orders].sort((a, b) => {
    let compare = 0
    switch (field) {
      case 'poNo':
        compare = a.poNo.localeCompare(b.poNo)
        break
      case 'supplier':
        compare = a.supplier.localeCompare(b.supplier)
        break
      case 'date':
        compare = a.date.localeCompare(b.date)
        break
      case 'amount':
        compare = a.amount - b.amount
        break
      case 'status':
        compare = a.status.localeCompare(b.status)
        break
    }
    return direction === 'asc' ? compare : -compare
  })
  return sorted
}

export function paginateItems<T>(items: T[], page: number, perPage: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const start = (currentPage - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    currentPage,
    totalPages,
    totalItems: items.length,
  }
}

function normalizePurchaseOrderStatus(
  status: Partial<PurchaseOrder>['status'] | string | undefined,
): PurchaseOrder['status'] {
  // Migrate legacy `pending` (and any unknown value) to `approved`.
  return status === 'completed' ? 'completed' : 'approved'
}

function normalizePurchaseOrder(row: Partial<PurchaseOrder> & { status?: string }): PurchaseOrder {
  return {
    id: row.id ?? crypto.randomUUID(),
    poNo: row.poNo ?? '',
    date: row.date ?? todayIsoDate(),
    quotationRef: row.quotationRef ?? '',
    supplierId: row.supplierId ?? '',
    supplier: row.supplier ?? '',
    supplierAddress: row.supplierAddress ?? '',
    supplierPhone: row.supplierPhone ?? '',
    supplierTin: row.supplierTin ?? '',
    customerId: row.customerId ?? '',
    customer: row.customer ?? '',
    customerAddress: row.customerAddress ?? '',
    customerPhone: row.customerPhone ?? '',
    customerTin: row.customerTin ?? '',
    project: row.project ?? '',
    branch: row.branch ?? 'RTS-MAIN',
    destination: row.destination ?? '',
    deliveryTerm: row.deliveryTerm ?? '',
    deliveryDate: row.deliveryDate ?? '',
    paymentTerm: row.paymentTerm ?? '',
    warrantyPeriod: row.warrantyPeriod ?? '',
    remarks: row.remarks ?? '',
    items: row.items ?? [],
    amount: row.amount ?? 0,
    status: normalizePurchaseOrderStatus(row.status),
    preparedBy: row.preparedBy ?? 'LARKE G. GELBOLINGO',
    preparedByPosition: row.preparedByPosition ?? 'CEO/PRESIDENT',
    outslipId: row.outslipId,
    receivingId: row.receivingId,
  }
}

export function loadPurchaseOrders(fallback: PurchaseOrder[]): PurchaseOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return stripPo00002(fallback.map(normalizePurchaseOrder))
    const parsed = JSON.parse(raw) as Array<Partial<PurchaseOrder> & { status?: string }>
    if (!Array.isArray(parsed)) {
      return stripPo00002(fallback.map(normalizePurchaseOrder))
    }
    if (parsed.length === 0) return []
    const stripped = stripPo00002(parsed)
    const normalized = stripped.map((row) => normalizePurchaseOrder(row))
    const migrated =
      stripped.length !== parsed.length ||
      stripped.some((row, index) => row.status !== normalized[index].status)
    if (migrated) {
      savePurchaseOrders(normalized)
    } else {
      markPo00002Removed(normalized)
    }
    return normalized
  } catch {
    return stripPo00002(fallback.map(normalizePurchaseOrder))
  }
}

export function savePurchaseOrders(
  orders: PurchaseOrder[],
  options: { emitEvent?: boolean } = {},
) {
  const next = stripPo00002(orders)
  const serialized = JSON.stringify(next)
  if (localStorage.getItem(STORAGE_KEY) === serialized) {
    markPo00002Removed(next)
    return
  }
  localStorage.setItem(STORAGE_KEY, serialized)
  markPo00002Removed(next)
  if (options.emitEvent === false) return
  window.dispatchEvent(new Event('erp-purchase-orders-updated'))
}

export function createEmptyPurchaseOrder(poNo: string): PurchaseOrder {
  return {
    id: crypto.randomUUID(),
    poNo,
    date: todayIsoDate(),
    quotationRef: '',
    supplierId: '',
    supplier: '',
    supplierAddress: '',
    supplierPhone: '',
    supplierTin: '',
    customerId: '',
    customer: '',
    customerAddress: '',
    customerPhone: '',
    customerTin: '',
    project: '',
    branch: 'RTS-MAIN',
    destination: '',
    deliveryTerm: '',
    deliveryDate: '',
    paymentTerm: '',
    warrantyPeriod: '',
    remarks: '',
    items: [],
    amount: 0,
    status: 'approved',
    preparedBy: 'LARKE G. GELBOLINGO',
    preparedByPosition: 'CEO/PRESIDENT',
  }
}

export type PurchaseOrderSupplierSeed = {
  id: string
  name: string
  address?: string
  phone?: string
}

/** Creates a PO from an approved quotation (QTN reference, supplier, customer, line items). Status defaults to approved. */
export function createPurchaseOrderFromQuotation(
  poNo: string,
  quotation: Quotation,
  supplier?: PurchaseOrderSupplierSeed | null,
): PurchaseOrder {
  const items: PurchaseOrderLineItem[] = quotation.items.map((item) => ({
    id: crypto.randomUUID(),
    itemCode: item.itemCode,
    itemName: item.itemName,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: calculateLineAmount(item.quantity, item.unitPrice),
  }))

  return {
    ...createEmptyPurchaseOrder(poNo),
    quotationRef: quotation.quotationNo,
    supplierId: supplier?.id ?? '',
    supplier: supplier?.name ?? '',
    supplierAddress: supplier?.address?.trim() || '',
    supplierPhone: supplier?.phone?.trim() || '',
    customerId: quotation.customerId,
    customer: quotation.customerName,
    customerAddress: quotation.customerAddress,
    customerPhone: quotation.customerPhone,
    customerTin: quotation.customerTin,
    project: quotation.subject,
    remarks: quotation.remarks,
    items,
    amount: calculateOrderTotal(items),
  }
}

export const initialPurchaseOrders: PurchaseOrder[] = []

export function handlePurchaseOrderPrint() {
  window.print()
}
