import type { Billing } from '@/data/billingTypes'
import type {
  DeliveryReceipt,
  GatePass,
  GatePassItem,
  Outslip,
  Receiving,
} from '@/data/erpTypes'
import type { PurchaseOrder } from '@/data/purchaseOrderTypes'
import type { Quotation } from '@/data/quotationTypes'
import { billingStatusLabel, initialBillings, loadBillings } from '@/lib/billings'
import { formatDrDisplayDate } from '@/lib/deliveryReceipts'
import { gatePassStatusLabel } from '@/lib/gatePasses'
import { outslipListStatusLabel } from '@/lib/outslips'
import { formatDisplayDate } from '@/lib/purchaseOrders'
import { initialQuotations, loadQuotations } from '@/lib/quotations'
import { receivingListStatusLabel } from '@/lib/receivings'

export const BARCODE_SCAN_EVENT = 'erp-barcode-scanned'

export interface CatalogPrice {
  code: string
  unitPrice: number
}

export interface TransactionRecords {
  purchaseOrders: PurchaseOrder[]
  receivings: Receiving[]
  outslips: Outslip[]
  gatePasses: GatePass[]
  deliveryReceipts: DeliveryReceipt[]
}

export interface ScannedTransactionLine {
  description: string
  detail: string
  amount: string
}

export interface ScannedTransaction {
  label: string
  number: string
  date: string
  partyLabel: string
  party: string
  status: string
  referenceLabel: string
  reference: string
  lines: ScannedTransactionLine[]
  totalLabel: string
  total: string
  path: string
}

export function requestBarcodeLookup(code: string) {
  const trimmed = code.trim()
  if (!trimmed) return
  window.dispatchEvent(new CustomEvent(BARCODE_SCAN_EVENT, { detail: trimmed }))
}

function sameCode(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}

function money(value: number) {
  return `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function firstPrice(...values: Array<number | undefined>): number {
  return values.find((value) => Number(value) > 0) ?? 0
}

function priceForCode(
  itemCode: string,
  rows: Array<{ itemCode: string; unitPrice: number }>,
  catalog: CatalogPrice[],
): number {
  const needle = itemCode.trim().toLowerCase()
  const stored = rows.find((row) => row.itemCode.trim().toLowerCase() === needle)?.unitPrice ?? 0
  const listed = catalog.find((row) => row.code.trim().toLowerCase() === needle)?.unitPrice ?? 0
  return firstPrice(stored, listed)
}

function titleStatus(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const deliveryStatusLabel: Record<DeliveryReceipt['status'], string> = {
  active: 'For Delivery',
  out_for_delivery: 'Out for Delivery',
  partially_delivered: 'Partially Delivered',
  delivered: 'Delivered',
  received: 'Received',
}

function fromQuotation(row: Quotation, catalog: CatalogPrice[]): ScannedTransaction {
  const lines = row.items.map((item) => {
    const unitPrice = firstPrice(item.unitPrice, priceForCode(item.itemCode, [], catalog))
    const amount = item.amount > 0 ? item.amount : item.quantity * unitPrice
    return {
      description: item.itemName || item.itemCode,
      detail: `${item.quantity} ${item.unit}`,
      amount: money(amount),
      value: amount,
    }
  })
  const computed = lines.reduce((sum, line) => sum + line.value, 0)
  return {
    label: 'Quotation',
    number: row.quotationNo,
    date: formatDisplayDate(row.date),
    partyLabel: 'Customer',
    party: row.customerName || '—',
    status: titleStatus(row.status),
    referenceLabel: 'Subject',
    reference: row.subject || '—',
    lines,
    totalLabel: 'Total',
    total: money(row.total > 0 ? row.total : computed),
    path: '/quotations',
  }
}

function fromPurchaseOrder(row: PurchaseOrder, catalog: CatalogPrice[]): ScannedTransaction {
  const lines = row.items.map((item) => {
    const unitPrice = firstPrice(item.unitPrice, priceForCode(item.itemCode, [], catalog))
    const amount = item.amount > 0 ? item.amount : item.quantity * unitPrice
    return {
      description: item.itemName || item.itemCode,
      detail: `${item.quantity} ${item.unit}`,
      amount: money(amount),
      value: amount,
    }
  })
  const computed = lines.reduce((sum, line) => sum + line.value, 0)
  return {
    label: 'Purchase Order',
    number: row.poNo,
    date: formatDisplayDate(row.date),
    partyLabel: 'Supplier',
    party: row.supplier || '—',
    status: titleStatus(row.status),
    referenceLabel: 'Customer',
    reference: row.customer || row.quotationRef || '—',
    lines,
    totalLabel: 'Amount',
    total: money(row.amount > 0 ? row.amount : computed),
    path: '/purchase-orders',
  }
}

function fromReceiving(
  row: Receiving,
  records: TransactionRecords,
  catalog: CatalogPrice[],
): ScannedTransaction {
  const order = records.purchaseOrders.find(
    (entry) => sameCode(entry.poNo, row.poId) || sameCode(entry.id, row.poRecordId),
  )
  const lines = row.items.map((item) => {
    const quantity = item.receivedQuantity > 0 ? item.receivedQuantity : item.orderedQuantity
    const unitPrice = firstPrice(
      item.unitPrice,
      priceForCode(item.itemCode, order?.items ?? [], catalog),
    )
    const amount = quantity * unitPrice
    return {
      description: item.description || item.itemCode,
      detail: `${item.receivedQuantity} / ${item.orderedQuantity} ${item.unit}`,
      amount: money(amount),
      value: amount,
    }
  })
  return {
    label: 'Receiving',
    number: row.id,
    date: formatDisplayDate(row.date),
    partyLabel: 'Supplier',
    party: row.supplier || '—',
    status: receivingListStatusLabel[row.status],
    referenceLabel: 'PO No.',
    reference: row.poId || '—',
    lines,
    totalLabel: 'Received value',
    total: money(lines.reduce((sum, line) => sum + line.value, 0)),
    path: `/inventory/receiving?id=${encodeURIComponent(row.id)}`,
  }
}

function fromOutslip(
  row: Outslip,
  records: TransactionRecords,
  catalog: CatalogPrice[],
): ScannedTransaction {
  const order = records.purchaseOrders.find(
    (entry) => sameCode(entry.poNo, row.poId) || sameCode(entry.id, row.poRecordId),
  )
  const lines = row.items.map((item) => {
    const unitPrice = firstPrice(
      item.unitPrice,
      priceForCode(item.itemCode, order?.items ?? [], catalog),
    )
    const amount = item.total > 0 ? item.total : item.releasedQuantity * unitPrice
    return {
      description: item.description || item.itemCode,
      detail: `${item.releasedQuantity} ${item.unit}`,
      amount: money(amount),
      value: amount,
    }
  })
  const computed = lines.reduce((sum, line) => sum + line.value, 0)
  return {
    label: 'Outslip',
    number: row.id,
    date: formatDisplayDate(row.date),
    partyLabel: 'Customer',
    party: row.customer || '—',
    status: outslipListStatusLabel[row.status],
    referenceLabel: 'PO No.',
    reference: row.poId || '—',
    lines,
    totalLabel: 'Total',
    total: money(row.totalAmount > 0 ? row.totalAmount : computed),
    path: `/outslips?id=${encodeURIComponent(row.id)}`,
  }
}

function matchByCode<T extends { itemCode: string; description?: string; itemName?: string }>(
  item: GatePassItem,
  rows: T[],
) {
  const code = item.itemCode.trim().toLowerCase()
  const description = item.description.trim().toLowerCase()
  return (
    rows.find((row) => {
      const rowCode = row.itemCode.trim().toLowerCase()
      const rowName = (row.description ?? row.itemName ?? '').trim().toLowerCase()
      return rowCode === code && rowName === description
    }) ?? rows.find((row) => row.itemCode.trim().toLowerCase() === code)
  )
}

function gatePassUnitPrice(
  item: GatePassItem,
  outslip: Outslip | undefined,
  order: PurchaseOrder | undefined,
  catalog: CatalogPrice[],
) {
  const outslipItem = outslip ? matchByCode(item, outslip.items) : undefined
  const poItem = order ? matchByCode(item, order.items) : undefined
  return firstPrice(
    outslipItem?.unitPrice,
    poItem?.unitPrice,
    priceForCode(item.itemCode, [], catalog),
  )
}

function fromGatePass(
  row: GatePass,
  records: TransactionRecords,
  catalog: CatalogPrice[],
): ScannedTransaction {
  const outslip = records.outslips.find((entry) => sameCode(entry.id, row.outslipId))
  const order = records.purchaseOrders.find(
    (entry) => sameCode(entry.poNo, row.poId) || sameCode(entry.id, outslip?.poRecordId ?? ''),
  )
  const lines = row.items.map((item) => {
    const unitPrice = gatePassUnitPrice(item, outslip, order, catalog)
    return {
      description: item.description || item.itemCode,
      detail: `${item.quantity} ${item.unit}`,
      amount: money(unitPrice * item.quantity),
    }
  })
  const total = row.items.reduce(
    (sum, item) => sum + gatePassUnitPrice(item, outslip, order, catalog) * item.quantity,
    0,
  )

  return {
    label: 'Gate Pass',
    number: row.id,
    date: formatDisplayDate(row.date),
    partyLabel: 'Customer',
    party: row.customer || '—',
    status: gatePassStatusLabel[row.status],
    referenceLabel: 'Outslip',
    reference: row.outslipId || '—',
    lines,
    totalLabel: 'Total',
    total: money(total),
    path: `/gate-passes?id=${encodeURIComponent(row.id)}`,
  }
}

function fromDeliveryReceipt(
  row: DeliveryReceipt,
  records: TransactionRecords,
  catalog: CatalogPrice[],
): ScannedTransaction {
  const outslip = records.outslips.find((entry) => sameCode(entry.id, row.outslipId))
  const order = records.purchaseOrders.find(
    (entry) =>
      sameCode(entry.poNo, row.poId) ||
      sameCode(entry.poNo, outslip?.poId ?? '') ||
      sameCode(entry.id, outslip?.poRecordId ?? ''),
  )
  const sourceItems = row.items.length > 0 ? row.items : []
  const lines =
    sourceItems.length > 0
      ? sourceItems.map((item) => {
          const quantity = item.allowedQuantity > 0 ? item.allowedQuantity : item.quantity
          const unitPrice = firstPrice(
            item.unitPrice,
            priceForCode(item.itemCode, outslip?.items ?? [], catalog),
            priceForCode(item.itemCode, order?.items ?? [], catalog),
          )
          const amount = quantity * unitPrice || item.total
          return {
            description: item.description || item.itemCode,
            detail: `${quantity} ${item.unit}`,
            amount: money(amount),
            value: amount,
          }
        })
      : (outslip?.items ?? [])
          .filter((item) => item.releasedQuantity > 0)
          .map((item) => {
            const unitPrice = firstPrice(
              item.unitPrice,
              priceForCode(item.itemCode, order?.items ?? [], catalog),
            )
            const amount = item.releasedQuantity * unitPrice || item.total
            return {
              description: item.description || item.itemCode,
              detail: `${item.releasedQuantity} ${item.unit}`,
              amount: money(amount),
              value: amount,
            }
          })
  const computed = lines.reduce((sum, line) => sum + line.value, 0)
  const total = firstPrice(computed, row.totalAmount, outslip?.totalAmount)

  return {
    label: 'Delivery Receipt',
    number: row.id,
    date: formatDrDisplayDate(row.date),
    partyLabel: 'Customer',
    party: row.customer || '—',
    status: deliveryStatusLabel[row.status],
    referenceLabel: 'Outslip',
    reference: row.outslipId || row.poId || '—',
    lines,
    totalLabel: 'Total',
    total: money(total),
    path: `/delivery-receipts?id=${encodeURIComponent(row.id)}`,
  }
}

function fromBilling(
  row: Billing,
  records: TransactionRecords,
  catalog: CatalogPrice[],
): ScannedTransaction {
  const receipt = records.deliveryReceipts.find(
    (entry) => sameCode(entry.id, row.deliveryReceiptId) || sameCode(entry.id, row.deliveryReceiptNo),
  )
  const pricedReceipt = receipt ? fromDeliveryReceipt(receipt, records, catalog) : null
  const lines =
    row.items.some((item) => item.amount > 0) || !pricedReceipt
      ? row.items.map((item) => ({
          description: item.description,
          detail: `${item.quantity} ${item.unit}`,
          amount: money(item.amount),
        }))
      : pricedReceipt.lines
  const total = firstPrice(
    row.total,
    pricedReceipt ? Number(pricedReceipt.total.replace(/[^\d.-]/g, '')) : 0,
  )

  return {
    label: 'Billing',
    number: row.billingNo,
    date: formatDisplayDate(row.date),
    partyLabel: 'Customer',
    party: row.customerName || '—',
    status: billingStatusLabel[row.status],
    referenceLabel: 'Delivery Receipt',
    reference: row.deliveryReceiptNo || '—',
    lines,
    totalLabel: 'Balance',
    total: money(row.balance > 0 ? row.balance : total),
    path: '/billing',
  }
}

export function findTransactionByCode(
  code: string,
  records: TransactionRecords,
  catalog: CatalogPrice[] = [],
): ScannedTransaction | null {
  const scanned = code.trim()
  if (!scanned) return null

  const quotation = loadQuotations(initialQuotations).find((row) =>
    sameCode(row.quotationNo, scanned),
  )
  if (quotation) return fromQuotation(quotation, catalog)

  const order = records.purchaseOrders.find(
    (row) => sameCode(row.poNo, scanned) || sameCode(row.id, scanned),
  )
  if (order) return fromPurchaseOrder(order, catalog)

  const receiving = records.receivings.find((row) => sameCode(row.id, scanned))
  if (receiving) return fromReceiving(receiving, records, catalog)

  const outslip = records.outslips.find((row) => sameCode(row.id, scanned))
  if (outslip) return fromOutslip(outslip, records, catalog)

  const gatePass = records.gatePasses.find((row) => sameCode(row.id, scanned))
  if (gatePass) return fromGatePass(gatePass, records, catalog)

  const receipt = records.deliveryReceipts.find((row) => sameCode(row.id, scanned))
  if (receipt) return fromDeliveryReceipt(receipt, records, catalog)

  const billing = loadBillings(initialBillings).find(
    (row) => sameCode(row.billingNo, scanned) || sameCode(row.id, scanned),
  )
  if (billing) return fromBilling(billing, records, catalog)

  return null
}
