import type {
  DeliveryReceipt,
  DeliveryReceiptItem,
  DeliveryReceiptStatus,
  Outslip,
  OutslipItem,
} from '@/data/erpTypes'
import type { PurchaseOrder } from '@/data/purchaseOrderTypes'
import type { ItemSetup } from '@/data/setupTypes'

const STORAGE_KEY = 'erp-delivery-receipts'
const UNDO_DR_ITEM_SCAN_KEY = 'erp-undo-dr-item-scan-2'

export function undoDeliveryItemScanTest() {
  if (localStorage.getItem(UNDO_DR_ITEM_SCAN_KEY)) return
  localStorage.setItem(UNDO_DR_ITEM_SCAN_KEY, '1')

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const rows = JSON.parse(raw) as Array<Partial<DeliveryReceipt>>
    if (!Array.isArray(rows)) return

    let changed = false
    const next = rows.map((row) => {
      if (row.id !== 'DR-000001' || !Array.isArray(row.items)) return row
      const scanned = row.items.some((item) => (item.quantity ?? 0) > 0)
      if (!scanned && row.status !== 'partially_delivered' && row.status !== 'delivered') return row
      changed = true
      return {
        ...row,
        status: row.status === 'received' || row.status === 'out_for_delivery' ? row.status : 'active',
        totalAmount: 0,
        items: row.items.map((item) => ({
          ...item,
          quantity: 0,
          serialNumbers: [],
          total: 0,
        })),
      }
    })
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    localStorage.removeItem(UNDO_DR_ITEM_SCAN_KEY)
  }
}

export interface DeliveryReceiptFilters {
  status: DeliveryReceiptStatus | 'all'
  search: string
  dateFrom: string
  dateTo: string
}

export function formatDrMoney(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDrDisplayDate(value: string): string {
  if (!value) return '—'
  const iso = Date.parse(`${value}T00:00:00`)
  const date = Number.isNaN(iso) ? new Date(value) : new Date(iso)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function toIsoDate(value: string): string {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeStatus(status: unknown): DeliveryReceiptStatus {
  if (
    status === 'out_for_delivery' ||
    status === 'delivered' ||
    status === 'received' ||
    status === 'active' ||
    status === 'partially_delivered'
  ) {
    return status
  }
  if (status === 'approved') return 'delivered'
  if (status === 'pending') return 'out_for_delivery'
  if (status === 'partial') return 'partially_delivered'
  return 'active'
}

export function normalizeDeliveryReceipt(
  row: Partial<DeliveryReceipt> & { status?: unknown },
): DeliveryReceipt {
  const items = (row.items ?? []).map(normalizeDeliveryReceiptItem)
  return {
    id: row.id ?? crypto.randomUUID(),
    date: row.date ?? '',
    outslipId: row.outslipId ?? '',
    poId: row.poId ?? '',
    customer: row.customer ?? '',
    customerAddress: row.customerAddress ?? '',
    project: row.project ?? '',
    branch: row.branch ?? '',
    destination: row.destination ?? '',
    reference: row.reference ?? '',
    items,
    totalAmount: items.reduce((sum, item) => sum + item.total, 0) || row.totalAmount || 0,
    deliveredBy: row.deliveredBy ?? '',
    deliveredByPosition: row.deliveredByPosition ?? '',
    receivedBy: row.receivedBy ?? '',
    receivedAt: typeof row.receivedAt === 'string' ? row.receivedAt : '',
    receivedRemarks: typeof row.receivedRemarks === 'string' ? row.receivedRemarks : '',
    qrToken: isDeliveryReceiptQrToken(row.qrToken) ? row.qrToken : newDeliveryReceiptQrToken(),
    remarks: row.remarks ?? '',
    status: normalizeStatus(row.status),
  }
}

export function normalizeDeliveryReceiptItem(
  row: Partial<DeliveryReceiptItem>,
): DeliveryReceiptItem {
  const quantity = row.quantity ?? 0
  return {
    id: row.id ?? crypto.randomUUID(),
    itemCode: row.itemCode ?? '',
    description: row.description ?? '',
    brandSerialNo: row.brandSerialNo ?? '',
    barcode: row.barcode ?? '',
    allowedQuantity: row.allowedQuantity ?? quantity,
    quantity,
    serialNumbers: Array.isArray(row.serialNumbers) ? row.serialNumbers : [],
    unit: row.unit ?? '',
    unitPrice: row.unitPrice ?? 0,
    total: row.total ?? quantity * (row.unitPrice ?? 0),
  }
}

export function deliveryReceiptBrandAndSerials(item: DeliveryReceiptItem): {
  brand: string
  serials: string
} {
  const parts = item.brandSerialNo
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
  const brand = (parts[0] ?? '').toUpperCase()
  const scanned = (item.serialNumbers ?? []).map((value) => value.trim()).filter(Boolean)
  const serials =
    scanned.length > 0
      ? scanned.join(',')
      : parts
          .slice(1)
          .join(',')
          .replace(/\s*,\s*/g, ',')
          .replace(/\s+/g, '')
  return { brand, serials }
}

export function deliveryReceiptItemsFromOutslip(
  outslip: Outslip,
  purchaseOrder?: PurchaseOrder | null,
  catalogItems: Array<{ code: string; unitPrice: number }> = [],
): DeliveryReceiptItem[] {
  const poPriceByCode = new Map(
    (purchaseOrder?.items ?? []).map((item) => [item.itemCode, item.unitPrice]),
  )
  const catalogPriceByCode = new Map(
    catalogItems.map((item) => [item.code, item.unitPrice]),
  )

  return outslip.items
    .filter((item) => item.releasedQuantity > 0)
    .map((item) => {
      const releasedQuantity = item.releasedQuantity
      const unitPrice =
        item.unitPrice > 0
          ? item.unitPrice
          : poPriceByCode.get(item.itemCode) || catalogPriceByCode.get(item.itemCode) || 0
      return {
        id: crypto.randomUUID(),
        itemCode: item.itemCode,
        description: item.description,
        brandSerialNo: [item.brand, item.modelSerialNo].filter(Boolean).join(' / '),
        barcode: '',
        allowedQuantity: releasedQuantity,
        quantity: 0,
        serialNumbers: [],
        unit: item.unit,
        unitPrice,
        total: 0,
      }
    })
}

export function totalFromDeliveryReceiptItems(items: DeliveryReceiptItem[]): number {
  return items.reduce((sum, item) => sum + (item.total || item.quantity * item.unitPrice), 0)
}

function priceForReceiptItem(
  itemCode: string,
  currentPrice: number,
  outslip: Outslip,
  purchaseOrder?: PurchaseOrder | null,
  catalogItems: Array<{ code: string; unitPrice: number }> = [],
): number {
  if (currentPrice > 0) return currentPrice
  const fromOutslip = outslip.items.find((row) => row.itemCode === itemCode)?.unitPrice ?? 0
  if (fromOutslip > 0) return fromOutslip
  const fromPo = purchaseOrder?.items.find((row) => row.itemCode === itemCode)?.unitPrice ?? 0
  if (fromPo > 0) return fromPo
  return catalogItems.find((row) => row.code === itemCode)?.unitPrice ?? 0
}

export function withOutslipAmounts(
  receipt: DeliveryReceipt,
  outslip: Outslip,
  purchaseOrder?: PurchaseOrder | null,
  catalogItems: Array<{ code: string; unitPrice: number }> = [],
): DeliveryReceipt {
  const items =
    receipt.items.length > 0
      ? receipt.items.map((item) => {
          const unitPrice = priceForReceiptItem(
            item.itemCode,
            item.unitPrice,
            outslip,
            purchaseOrder,
            catalogItems,
          )
          const quantity = item.quantity
          return {
            ...item,
            serialNumbers: item.serialNumbers ?? [],
            unitPrice,
            total: quantity * unitPrice || item.total,
          }
        })
      : deliveryReceiptItemsFromOutslip(outslip, purchaseOrder, catalogItems)

  const itemsTotal = totalFromDeliveryReceiptItems(items)
  const totalAmount =
    itemsTotal > 0 ? itemsTotal : receipt.totalAmount > 0 ? receipt.totalAmount : outslip.totalAmount

  return {
    ...receipt,
    items,
    totalAmount,
  }
}

export function remainingDeliveryQty(item: DeliveryReceiptItem): number {
  return Math.max(0, item.allowedQuantity - item.quantity)
}

export function loadDeliveryReceipts(fallback: DeliveryReceipt[] = []): DeliveryReceipt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback.map(normalizeDeliveryReceipt)
    const parsed = JSON.parse(raw) as Array<Partial<DeliveryReceipt>>
    if (!Array.isArray(parsed)) return fallback.map(normalizeDeliveryReceipt)
    return parsed.map((row) => normalizeDeliveryReceipt(row))
  } catch {
    return fallback.map(normalizeDeliveryReceipt)
  }
}

export function saveDeliveryReceipts(
  receipts: DeliveryReceipt[],
  options: { emitEvent?: boolean } = {},
) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts))
  if (options.emitEvent !== false) {
    window.dispatchEvent(new Event('erp-delivery-receipts-updated'))
  }
}

function matchesSearch(receipt: DeliveryReceipt, search: string): boolean {
  if (!search.trim()) return true
  const term = search.trim().toLowerCase()
  return (
    receipt.id.toLowerCase().includes(term) ||
    receipt.outslipId.toLowerCase().includes(term) ||
    receipt.customer.toLowerCase().includes(term) ||
    receipt.poId.toLowerCase().includes(term) ||
    receipt.project.toLowerCase().includes(term)
  )
}

function matchesDateRange(receipt: DeliveryReceipt, dateFrom: string, dateTo: string): boolean {
  const date = toIsoDate(receipt.date)
  if (dateFrom && date < dateFrom) return false
  if (dateTo && date > dateTo) return false
  return true
}

export function filterDeliveryReceipts(
  receipts: DeliveryReceipt[],
  filters: DeliveryReceiptFilters,
): DeliveryReceipt[] {
  return receipts.filter((receipt) => {
    if (filters.status !== 'all' && receipt.status !== filters.status) return false
    if (!matchesSearch(receipt, filters.search)) return false
    if (!matchesDateRange(receipt, filters.dateFrom, filters.dateTo)) return false
    return true
  })
}

export function countDeliveryReceiptStatuses(receipts: DeliveryReceipt[]) {
  const counts: Record<DeliveryReceiptStatus | 'all', number> = {
    all: receipts.length,
    active: 0,
    out_for_delivery: 0,
    partially_delivered: 0,
    delivered: 0,
    received: 0,
  }
  receipts.forEach((receipt) => {
    counts[receipt.status] += 1
  })
  return counts
}

const UNKNOWN_BARCODE = 'Scan the item barcode first, then the serial number.'
const NOT_ON_OUTSLIP = 'Item is not included in this Outslip.'
const DUPLICATE_SERIAL = 'Serial number already scanned.'

export function quantityExceededMessage(allowed: number): string {
  return `Delivery quantity exceeded. Only ${allowed} units are allowed.`
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function matchCatalogItemByBarcode(
  items: ItemSetup[],
  barcode: string,
): ItemSetup | undefined {
  const scanned = barcode.trim()
  if (!scanned) return undefined
  const needle = scanned.toLowerCase()
  return items.find(
    (item) =>
      (item.barcode ?? '').trim().toLowerCase() === needle ||
      item.item_code.trim().toLowerCase() === needle,
  )
}

export function findOutslipItemForCatalog(
  outslip: Outslip,
  catalog: ItemSetup,
): OutslipItem | undefined {
  const allowed = outslip.items.filter((item) => item.releasedQuantity > 0)
  const catalogCode = catalog.item_code.trim().toLowerCase()
  const byCode = allowed.find(
    (item) => item.itemCode.trim().toLowerCase() === catalogCode,
  )
  if (byCode) return byCode

  const names = [catalog.item_name, catalog.display_name ?? '']
    .map(normalizeName)
    .filter(Boolean)

  return allowed.find((item) => {
    const description = normalizeName(item.description)
    return names.some(
      (name) => description === name || description.includes(name) || name.includes(description),
    )
  })
}

export interface BarcodeScanResult {
  ok: boolean
  message: string
  receipt: DeliveryReceipt
  scannedItem?: DeliveryReceiptItem
  needsSerial?: boolean
}

export function deliveryProgress(items: DeliveryReceiptItem[]): {
  scanned: number
  released: number
  percent: number
} {
  const released = items.reduce((sum, item) => sum + item.allowedQuantity, 0)
  const scanned = items.reduce((sum, item) => sum + item.quantity, 0)
  return {
    scanned,
    released,
    percent: released > 0 ? Math.round((scanned / released) * 100) : 0,
  }
}

export function statusFromScannedQuantities(
  items: DeliveryReceiptItem[],
  current: DeliveryReceiptStatus,
): DeliveryReceiptStatus {
  const { scanned, released } = deliveryProgress(items)
  if (current === 'received') return 'received'
  if (released <= 0) return current
  if (scanned <= 0) return current === 'delivered' ? 'delivered' : current === 'out_for_delivery' ? 'out_for_delivery' : 'active'
  if (scanned >= released && items.every((item) => remainingDeliveryQty(item) === 0)) {
    return 'delivered'
  }
  return 'partially_delivered'
}

export function mergeReceiptWithOutslip(
  receipt: DeliveryReceipt,
  outslip: Outslip,
  purchaseOrder?: PurchaseOrder | null,
  catalogItems: Array<{ code: string; unitPrice: number; barcode?: string }> = [],
): DeliveryReceipt {
  const templates = deliveryReceiptItemsFromOutslip(outslip, purchaseOrder, catalogItems)
  const looksUnscanned =
    receipt.status !== 'delivered' &&
    receipt.status !== 'received' &&
    receipt.items.length > 0 &&
    receipt.items.every(
      (item) =>
        item.allowedQuantity > 0 &&
        item.quantity === item.allowedQuantity &&
        (item.serialNumbers?.length ?? 0) === 0,
    )
  const merged = templates.map((template) => {
    const existing = receipt.items.find(
      (item) => item.itemCode.trim().toLowerCase() === template.itemCode.trim().toLowerCase(),
    )
    if (!existing) {
      const catalogBarcode = catalogItems.find((row) => row.code === template.itemCode)?.barcode ?? ''
      return { ...template, barcode: catalogBarcode }
    }
    const unitPrice = priceForReceiptItem(
      existing.itemCode,
      existing.unitPrice,
      outslip,
      purchaseOrder,
      catalogItems,
    )
    const catalogBarcode = catalogItems.find((row) => row.code === existing.itemCode)?.barcode ?? ''
    const quantity = looksUnscanned ? 0 : existing.quantity
    return {
      ...existing,
      allowedQuantity: template.allowedQuantity,
      barcode: existing.barcode || catalogBarcode,
      serialNumbers: existing.serialNumbers ?? [],
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    }
  })

  const status = statusFromScannedQuantities(merged, receipt.status)
  return {
    ...receipt,
    items: merged,
    totalAmount: totalFromDeliveryReceiptItems(merged),
    status: receipt.status === 'delivered' ? 'delivered' : status,
  }
}

function collectedSerials(receipt: DeliveryReceipt): string[] {
  return receipt.items.flatMap((item) => item.serialNumbers ?? [])
}

export function applyBarcodeScan(
  receipt: DeliveryReceipt,
  outslip: Outslip,
  catalog: ItemSetup | undefined,
  scannedBarcode: string,
  options: { serialNumber?: string } = {},
): BarcodeScanResult {
  if (!catalog) {
    return { ok: false, message: UNKNOWN_BARCODE, receipt }
  }

  const outslipItem = findOutslipItemForCatalog(outslip, catalog)
  if (!outslipItem) {
    return { ok: false, message: NOT_ON_OUTSLIP, receipt }
  }

  const serialNumber = options.serialNumber?.trim() ?? ''
  if (!serialNumber) {
    return {
      ok: false,
      needsSerial: true,
      message: `Scan the serial number for ${catalog.item_name}.`,
      receipt,
    }
  }

  if (serialNumber) {
    const alreadyUsed = collectedSerials(receipt).some(
      (value) => value.toLowerCase() === serialNumber.toLowerCase(),
    )
    if (alreadyUsed) {
      return { ok: false, message: DUPLICATE_SERIAL, receipt }
    }
  }

  const allowedQuantity = outslipItem.releasedQuantity
  const existing = receipt.items.find(
    (item) => item.itemCode.trim().toLowerCase() === outslipItem.itemCode.trim().toLowerCase(),
  )
  const delivered = existing?.quantity ?? 0

  if (delivered >= allowedQuantity) {
    return { ok: false, message: quantityExceededMessage(allowedQuantity), receipt }
  }

  const nextQty = delivered + 1
  const barcode = catalog.barcode || existing?.barcode || scannedBarcode.trim()
  const brandSerialNo = [outslipItem.brand, outslipItem.modelSerialNo].filter(Boolean).join(' / ')
  const catalogPrice = Number(catalog.unit_price) || 0
  const unitPrice =
    (existing?.unitPrice && existing.unitPrice > 0 ? existing.unitPrice : 0) ||
    (outslipItem.unitPrice > 0 ? outslipItem.unitPrice : 0) ||
    catalogPrice
  const serialNumbers = [
    ...(existing?.serialNumbers ?? []),
    ...(serialNumber ? [serialNumber] : []),
  ]

  const nextItem: DeliveryReceiptItem = existing
    ? {
        ...existing,
        barcode: existing.barcode || barcode,
        allowedQuantity,
        quantity: nextQty,
        serialNumbers,
        unitPrice,
        total: nextQty * unitPrice,
      }
    : {
        id: crypto.randomUUID(),
        itemCode: outslipItem.itemCode,
        description: outslipItem.description,
        brandSerialNo,
        barcode,
        allowedQuantity,
        quantity: nextQty,
        serialNumbers,
        unit: outslipItem.unit,
        unitPrice,
        total: nextQty * unitPrice,
      }

  const items = existing
    ? receipt.items.map((item) => (item.id === existing.id ? nextItem : item))
    : [...receipt.items, nextItem]

  const nextReceipt: DeliveryReceipt = {
    ...receipt,
    items,
    totalAmount: items.reduce((sum, item) => sum + item.total, 0),
    status: statusFromScannedQuantities(items, receipt.status),
  }

  return {
    ok: true,
    message: `Serial ${serialNumber} recorded.`,
    receipt: nextReceipt,
    scannedItem: nextItem,
  }
}

const QR_TOKEN_PATTERN = /^[a-f0-9]{32}$/

export function isDeliveryReceiptQrToken(value: unknown): value is string {
  return typeof value === 'string' && QR_TOKEN_PATTERN.test(value)
}

export function newDeliveryReceiptQrToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const deliveryReceiptStatusLabel: Record<DeliveryReceiptStatus, string> = {
  active: 'For Delivery',
  out_for_delivery: 'Out for Delivery',
  partially_delivered: 'Partially Delivered',
  delivered: 'Delivered',
  received: 'Received',
}

export function deliveryReceiptQrValue(token: string): string {
  return `DRCV:${token}`
}

export function parseDeliveryReceiptQr(raw: string): string | null {
  const compact = raw.trim().replace(/\s+/g, '').toUpperCase()
  if (!compact) return null
  const embedded = compact.match(/(?:^|[?&]C=)(DRCV:[A-F0-9]{32})/)
  const code = embedded?.[1] ?? compact
  const matched = code.match(/^DRCV:([A-F0-9]{32})$/)
  return matched ? matched[1].toLowerCase() : null
}

export function formatReceivedAt(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const DELIVERY_ITEM_QR_PREFIX = 'DRITEM:'

export function deliveryItemQrValue(receiptId: string, itemId: string, origin: string) {
  const code = `${DELIVERY_ITEM_QR_PREFIX}${receiptId}:${itemId}`
  return `${origin.replace(/\/$/, '')}/api/r?c=${encodeURIComponent(code)}`
}

export function parseDeliveryItemQr(code: string): { receiptId: string; itemId: string } | null {
  const compact = code.replace(/\s+/g, '')
  const fromUrl = compact.match(/[?&]c=([^&]+)/i)
  const decoded = fromUrl ? decodeURIComponent(fromUrl[1]) : compact
  if (!decoded.toUpperCase().startsWith(DELIVERY_ITEM_QR_PREFIX)) return null
  const body = decoded.slice(DELIVERY_ITEM_QR_PREFIX.length)
  const splitAt = body.indexOf(':')
  if (splitAt <= 0 || splitAt >= body.length - 1) return null
  return {
    receiptId: body.slice(0, splitAt),
    itemId: body.slice(splitAt + 1),
  }
}

export function markDeliveryItemReceived(receipt: DeliveryReceipt, itemId: string) {
  const item = receipt.items.find((row) => row.id === itemId)
  if (!item) return { error: 'That QR does not match an item on this delivery receipt.' }
  if (item.allowedQuantity > 0 && item.quantity >= item.allowedQuantity) {
    return {
      already: true as const,
      receipt,
      message: `${item.description} is already received.`,
    }
  }

  const items = receipt.items.map((row) => {
    if (row.id !== item.id) return row
    const quantity = row.allowedQuantity > 0 ? row.allowedQuantity : row.quantity
    return { ...row, quantity, total: quantity * row.unitPrice }
  })
  const next: DeliveryReceipt = {
    ...receipt,
    items,
    totalAmount: items.reduce((sum, row) => sum + row.total, 0),
    status: statusFromScannedQuantities(items, receipt.status),
  }
  return {
    already: false as const,
    receipt: next,
    message: `${item.description} received.`,
  }
}

