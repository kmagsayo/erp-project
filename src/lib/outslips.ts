import type { Outslip, OutslipItem, OutslipStatus } from '@/data/erpTypes'
import type { PurchaseOrder } from '@/data/purchaseOrderTypes'
import { formatDisplayDate, paginateItems, todayIsoDate } from '@/lib/purchaseOrders'

export type OutslipListFilterStatus = 'all' | 'pending' | 'approved' | 'released'

export interface OutslipFilters {
  status: OutslipListFilterStatus
  search: string
  dateFrom: string
  dateTo: string
}

export const outslipListStatusLabel: Record<OutslipStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  released: 'For Dispatch',
  cancelled: 'Cancelled',
}

export { formatDisplayDate, paginateItems }

const STORAGE_KEY = 'erp-outslips'
const UNDO_CREATED_OUTSLIP_KEY = 'erp-undo-created-outslip-2'

export function undoCreatedOutslip() {
  if (localStorage.getItem(UNDO_CREATED_OUTSLIP_KEY)) return
  localStorage.setItem(UNDO_CREATED_OUTSLIP_KEY, '1')

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const rows = raw ? (JSON.parse(raw) as Outslip[]) : []
    if (!Array.isArray(rows) || rows.length === 0) return

    const fromReceiving = rows.filter((row) => row.receivingId && row.status !== 'cancelled')
    const pool = fromReceiving.length > 0 ? fromReceiving : rows
    const latest = [...pool].sort((a, b) => parseNumberFromId(a.id) - parseNumberFromId(b.id)).at(-1)
    if (!latest) return

    const removed = new Set([latest.id])
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.filter((row) => !removed.has(row.id))))
    clearOutslipLink('erp-purchase-orders', removed)
    removeLinkedRows('erp-gate-passes', removed)
    removeLinkedRows('erp-delivery-receipts', removed)
  } catch {
    localStorage.removeItem(UNDO_CREATED_OUTSLIP_KEY)
  }
}

function clearOutslipLink(key: string, removed: Set<string>) {
  const raw = localStorage.getItem(key)
  if (!raw) return
  const rows = JSON.parse(raw) as Array<{ outslipId?: string }>
  if (!Array.isArray(rows)) return
  localStorage.setItem(
    key,
    JSON.stringify(
      rows.map((row) => (row.outslipId && removed.has(row.outslipId) ? { ...row, outslipId: '' } : row)),
    ),
  )
}

function removeLinkedRows(key: string, removed: Set<string>) {
  const raw = localStorage.getItem(key)
  if (!raw) return
  const rows = JSON.parse(raw) as Array<{ outslipId?: string }>
  if (!Array.isArray(rows)) return
  localStorage.setItem(
    key,
    JSON.stringify(rows.filter((row) => !row.outslipId || !removed.has(row.outslipId))),
  )
}

function parseNumberFromId(id: string): number {
  const numeric = Number(id.split('-').at(-1) ?? 0)
  return Number.isNaN(numeric) ? 0 : numeric
}

export function normalizeOutslipId(id: string): string {
  if (!id || id === '—') return id
  const match = id.match(/^OS-(?:\d{4}-)?(\d+)$/)
  if (!match) return id
  return `OS-${String(Number(match[1])).padStart(5, '0')}`
}

export function generateOutslipId(outslips: Outslip[], _dateIso?: string): string {
  const maxSeries = outslips.reduce((max, row) => {
    if (!/^OS-(?:\d{4}-)?\d+$/.test(row.id)) return max
    return Math.max(max, parseNumberFromId(row.id))
  }, 0)
  return `OS-${String(maxSeries + 1).padStart(5, '0')}`
}

export function formatMoney(value: number): string {
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatOutslipDate(value: string): string {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function calculateReleasedForPoItem(
  outslips: Outslip[],
  poRecordId: string,
  itemCode: string,
  options?: { excludeOutslipId?: string },
): number {
  return outslips
    .filter(
      (row) =>
        row.poRecordId === poRecordId &&
        row.status !== 'cancelled' &&
        row.id !== options?.excludeOutslipId,
    )
    .flatMap((row) => row.items)
    .filter((item) => item.itemCode === itemCode)
    .reduce((sum, item) => sum + item.releasedQuantity, 0)
}

export function buildOutslipItemsFromPo(
  po: PurchaseOrder,
  outslips: Outslip[],
  options?: { excludeOutslipId?: string },
): OutslipItem[] {
  return po.items.map((item) => {
    const previouslyReleased = calculateReleasedForPoItem(outslips, po.id, item.itemCode, options)
    const available = Math.max(0, item.quantity - previouslyReleased)
    const releasedQuantity = available
    const total = releasedQuantity * item.unitPrice
    return {
      id: crypto.randomUUID(),
      itemCode: item.itemCode,
      description: item.itemName,
      brand: '',
      modelSerialNo: '',
      poQuantity: item.quantity,
      releasedQuantity,
      remainingQuantity: Math.max(0, available - releasedQuantity),
      unit: item.unit,
      unitPrice: item.unitPrice,
      total,
    }
  })
}

export function recalculateOutslipTotals(outslip: Outslip): Outslip {
  const normalizedItems = outslip.items.map((item) => {
    const safeReleased = Math.max(0, item.releasedQuantity)
    const safeRemaining = Math.max(0, item.poQuantity - safeReleased)
    return {
      ...item,
      releasedQuantity: safeReleased,
      remainingQuantity: safeRemaining,
      total: safeReleased * item.unitPrice,
    }
  })
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.total, 0)
  const otherCharges = Math.max(0, outslip.otherCharges || 0)
  return {
    ...outslip,
    items: normalizedItems,
    subtotal,
    otherCharges,
    totalAmount: subtotal + otherCharges,
  }
}

export interface BuildOutslipFromPoOptions {
  customer?: string
  receivingId?: string
  location?: string
  destination?: string
  status?: OutslipStatus
}

export function buildOutslipFromPo(
  po: PurchaseOrder,
  outslips: Outslip[],
  preparedBy = 'WEB ADMINISTRATOR',
  options?: BuildOutslipFromPoOptions,
): Outslip {
  const date = todayIsoDate()
  const location = options?.location ?? po.destination
  const outslip: Outslip = {
    id: generateOutslipId(outslips, date),
    date,
    poId: po.poNo,
    poRecordId: po.id,
    receivingId: options?.receivingId,
    supplier: po.supplier,
    customer: options?.customer?.trim() || po.customer,
    project: po.project,
    branch: po.branch,
    warehouse: 'Main Warehouse',
    location,
    destination: options?.destination ?? location,
    items: buildOutslipItemsFromPo(po, outslips),
    subtotal: 0,
    otherCharges: 0,
    totalAmount: 0,
    preparedBy,
    approvedBy: '',
    releasedBy: '',
    receivedBy: '',
    receivedBySignature: '',
    remarks: po.remarks,
    status: options?.status ?? 'draft',
  }
  return recalculateOutslipTotals(outslip)
}

export function validateOutslipQuantities(
  outslip: Outslip,
  outslips: Outslip[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  outslip.items.forEach((item) => {
    if (item.releasedQuantity < 0) {
      errors.push(`${item.itemCode}: released quantity cannot be negative.`)
    }
    const previouslyReleased = calculateReleasedForPoItem(outslips, outslip.poRecordId, item.itemCode, {
      excludeOutslipId: outslip.id,
    })
    const available = Math.max(0, item.poQuantity - previouslyReleased)
    if (item.releasedQuantity > available) {
      errors.push(
        `${item.itemCode}: released quantity ${item.releasedQuantity} exceeds available ${available}.`,
      )
    }
  })
  return { valid: errors.length === 0, errors }
}

export function loadOutslips(fallback: Outslip[] = []): Outslip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Outslip[]
    if (!Array.isArray(parsed)) return fallback
    const normalized = parsed.map((row) => ({
      ...row,
      id: normalizeOutslipId(row.id),
    }))
    const changed = normalized.some((row, index) => row.id !== parsed[index]?.id)
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    }
    remapStoredOutslipIdReferences()
    return normalized
  } catch {
    return fallback
  }
}

function remapStoredOutslipIdReferences() {
  remapOutslipIdsInStorage('erp-purchase-orders', 'outslipId')
  remapOutslipIdsInStorage('erp-delivery-receipts', 'outslipId')
  remapOutslipIdsInStorage('erp-gate-passes', 'outslipId')
}

function remapOutslipIdsInStorage(key: string, field: string) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!Array.isArray(parsed)) return
    let changed = false
    const next = parsed.map((row) => {
      const current = row[field]
      if (typeof current !== 'string' || !current) return row
      const normalized = normalizeOutslipId(current)
      if (normalized === current) return row
      changed = true
      return { ...row, [field]: normalized }
    })
    if (changed) localStorage.setItem(key, JSON.stringify(next))
  } catch {
    // ignore malformed storage
  }
}

export function saveOutslips(
  outslips: Outslip[],
  options: { emitEvent?: boolean } = {},
) {
  const serialized = JSON.stringify(outslips)
  if (localStorage.getItem(STORAGE_KEY) === serialized) return
  localStorage.setItem(STORAGE_KEY, serialized)
  if (options.emitEvent === false) return
  window.dispatchEvent(new Event('erp-outslips-updated'))
}

function matchesOutslipSearch(outslip: Outslip, search: string): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true
  const haystack = [
    outslip.id,
    outslip.poId,
    outslip.customer,
    outslip.supplier,
    outslip.project,
    outslip.status,
    outslipListStatusLabel[outslip.status],
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

function matchesOutslipDateRange(outslip: Outslip, dateFrom: string, dateTo: string): boolean {
  if (dateFrom && outslip.date < dateFrom) return false
  if (dateTo && outslip.date > dateTo) return false
  return true
}

export function filterOutslips(outslips: Outslip[], filters: OutslipFilters): Outslip[] {
  return outslips.filter((outslip) => {
    if (filters.status !== 'all' && outslip.status !== filters.status) return false
    if (!matchesOutslipSearch(outslip, filters.search)) return false
    if (!matchesOutslipDateRange(outslip, filters.dateFrom, filters.dateTo)) return false
    return true
  })
}

export function sortOutslipsByDateDesc(outslips: Outslip[]): Outslip[] {
  return [...outslips].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

export function handleOutslipPrint() {
  window.print()
}
