import type {
  Quotation,
  QuotationFilters,
  QuotationLineItem,
  QuotationSortField,
  SortDirection,
} from '@/data/quotationTypes'

const STORAGE_KEY = 'erp-quotations'
const DEFAULT_PREPARED_BY = 'LARKE G. GELBOLINGO'
const DEFAULT_PREPARED_BY_POSITION = 'CEO/PRESIDENT'

function normalizePreparedBy(value?: string): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return DEFAULT_PREPARED_BY
  const upper = trimmed.toUpperCase()
  if (upper === 'JUAN DELA CRUZ' || upper === 'LARKE GELBOLINGO') {
    return DEFAULT_PREPARED_BY
  }
  return trimmed
}

export function formatCurrency(value: number): string {
  return `₱${value.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`
}

export function formatDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function todayIsoDate(): string {
  // ERP is Philippines-based; use Manila calendar date for "today".
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

export function generateQuotationNo(quotations: Quotation[]): string {
  const numbers = quotations.map((row) => Number(row.quotationNo.split('-')[1] ?? 0))
  const next = Math.max(0, ...numbers) + 1
  return `QTN-${String(next).padStart(5, '0')}`
}

export function calculateLineAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice
}

export function calculateTotals(
  items: QuotationLineItem[],
  discount: number,
  tax: number,
) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const total = Math.max(0, subtotal - discount + tax)
  return { subtotal, total }
}

export function recalculateQuotation(
  quotation: Omit<Quotation, 'subtotal' | 'total'>,
): Pick<Quotation, 'subtotal' | 'total'> {
  const items = quotation.items.map((item) => ({
    ...item,
    amount: calculateLineAmount(item.quantity, item.unitPrice),
  }))
  return calculateTotals(items, quotation.discount, quotation.tax)
}

function matchesSearch(quotation: Quotation, search: string): boolean {
  if (!search.trim()) return true
  const term = search.trim().toLowerCase()
  return (
    quotation.quotationNo.toLowerCase().includes(term) ||
    quotation.customerName.toLowerCase().includes(term) ||
    quotation.remarks.toLowerCase().includes(term) ||
    quotation.items.some(
      (item) =>
        item.itemName.toLowerCase().includes(term) ||
        item.itemCode.toLowerCase().includes(term),
    )
  )
}

function matchesDateRange(quotation: Quotation, dateFrom: string, dateTo: string): boolean {
  if (dateFrom && quotation.date < dateFrom) return false
  if (dateTo && quotation.date > dateTo) return false
  return true
}

export function filterQuotations(
  quotations: Quotation[],
  filters: QuotationFilters,
): Quotation[] {
  return quotations.filter((quotation) => {
    if (filters.status !== 'all' && quotation.status !== filters.status) return false
    if (!matchesSearch(quotation, filters.search)) return false
    if (!matchesDateRange(quotation, filters.dateFrom, filters.dateTo)) return false
    return true
  })
}

export function sortQuotations(
  quotations: Quotation[],
  field: QuotationSortField,
  direction: SortDirection,
): Quotation[] {
  const sorted = [...quotations].sort((a, b) => {
    let compare = 0
    switch (field) {
      case 'quotationNo':
        compare = a.quotationNo.localeCompare(b.quotationNo)
        break
      case 'customerName':
        compare = a.customerName.localeCompare(b.customerName)
        break
      case 'date':
        compare = a.date.localeCompare(b.date)
        break
      case 'total':
        compare = a.total - b.total
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

export function formatPrintMoney(value: number): string {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function normalizeQuotation(row: Partial<Quotation>): Quotation {
  return {
    id: row.id ?? crypto.randomUUID(),
    quotationNo: row.quotationNo ?? '',
    customerId: row.customerId ?? '',
    customerName: row.customerName ?? '',
    customerAddress: row.customerAddress ?? '',
    customerPhone: row.customerPhone ?? '',
    customerTin: row.customerTin ?? '',
    subject: row.subject ?? '',
    date: row.date ?? todayIsoDate(),
    status: row.status ?? 'draft',
    items: row.items ?? [],
    subtotal: row.subtotal ?? 0,
    discount: row.discount ?? 0,
    tax: row.tax ?? 0,
    total: row.total ?? 0,
    remarks: row.remarks ?? '',
    terms: row.terms ?? '',
    preparedByUserId: row.preparedByUserId ?? '',
    preparedBy: normalizePreparedBy(row.preparedBy),
    preparedByPosition: row.preparedByPosition?.trim() || DEFAULT_PREPARED_BY_POSITION,
    approvedByUserId: row.approvedByUserId ?? '',
    approvedBy: row.approvedBy ?? '',
  }
}

export function loadQuotations(fallback: Quotation[]): Quotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Quotation>[]
    if (!Array.isArray(parsed)) return fallback
    return parsed.map((row) => normalizeQuotation(row))
  } catch {
    return fallback
  }
}

export function saveQuotations(quotations: Quotation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations))
  window.dispatchEvent(new Event('erp-quotations-updated'))
}

export function createEmptyQuotation(quotationNo: string): Quotation {
  return {
    id: crypto.randomUUID(),
    quotationNo,
    customerId: '',
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    customerTin: '',
    subject: '',
    date: todayIsoDate(),
    status: 'pending',
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    remarks: '',
    terms: '30 DAYS',
    preparedByUserId: '',
    preparedBy: DEFAULT_PREPARED_BY,
    preparedByPosition: DEFAULT_PREPARED_BY_POSITION,
    approvedByUserId: '',
    approvedBy: '',
  }
}

export const initialQuotations: Quotation[] = []

export function handleQuotationPrint() {
  window.print()
}
