import type { GatePass, GatePassItem, GatePassStatus, Outslip } from '@/data/erpTypes'
import { formatDisplayDate, paginateItems, todayIsoDate } from '@/lib/purchaseOrders'

export type GatePassListFilterStatus = 'all' | GatePassStatus

export interface GatePassFilters {
  status: GatePassListFilterStatus
  search: string
  dateFrom: string
  dateTo: string
}

export const gatePassStatusLabel: Record<GatePassStatus, string> = {
  approved: 'Approved',
  cancelled: 'Cancelled',
}

export function normalizeGatePassStatus(status: string): GatePassStatus {
  return status === 'cancelled' ? 'cancelled' : 'approved'
}

export { formatDisplayDate, paginateItems }

const STORAGE_KEY = 'erp-gate-passes'

function parseNumberFromId(id: string): number {
  const numeric = Number(id.split('-').at(-1) ?? 0)
  return Number.isNaN(numeric) ? 0 : numeric
}

export function generateGatePassId(gatePasses: GatePass[]): string {
  const maxSeries = gatePasses.reduce((max, row) => {
    if (!/^GP-\d+$/.test(row.id)) return max
    return Math.max(max, parseNumberFromId(row.id))
  }, 0)
  return `GP-${String(maxSeries + 1).padStart(5, '0')}`
}

export function currentTimeHm(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function buildGatePassItemsFromOutslip(outslip: Outslip): GatePassItem[] {
  return outslip.items
    .filter((item) => item.releasedQuantity > 0)
    .map((item) => ({
      id: crypto.randomUUID(),
      itemCode: item.itemCode,
      description: item.description,
      brand: item.brand,
      modelSerialNo: item.modelSerialNo,
      quantity: item.releasedQuantity,
      unit: item.unit,
    }))
}

export function buildGatePassFromOutslip(
  outslip: Outslip,
  gatePasses: GatePass[],
  preparedBy = 'WEB ADMINISTRATOR',
): GatePass {
  return {
    id: generateGatePassId(gatePasses),
    date: todayIsoDate(),
    timeOut: currentTimeHm(),
    outslipId: outslip.id,
    poId: outslip.poId,
    customer: outslip.customer,
    destination: outslip.destination || outslip.location,
    purpose: 'Delivery of items per Outslip',
    driverName: '',
    plateNo: '',
    vehicle: '',
    items: buildGatePassItemsFromOutslip(outslip),
    remarks: outslip.remarks,
    preparedBy,
    authorizedBy: outslip.approvedBy || outslip.releasedBy || '',
    guardOnDuty: '',
    status: 'approved',
  }
}

export function loadGatePasses(fallback: GatePass[] = []): GatePass[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Array<GatePass & { status: string }>
    if (!Array.isArray(parsed)) return fallback
    return parsed.map((row) => ({
      ...row,
      status: normalizeGatePassStatus(row.status),
    }))
  } catch {
    return fallback
  }
}

export function saveGatePasses(
  gatePasses: GatePass[],
  options: { emitEvent?: boolean } = {},
) {
  const serialized = JSON.stringify(gatePasses)
  if (localStorage.getItem(STORAGE_KEY) === serialized) return
  localStorage.setItem(STORAGE_KEY, serialized)
  if (options.emitEvent === false) return
  window.dispatchEvent(new Event('erp-gate-passes-updated'))
}

function matchesGatePassSearch(gatePass: GatePass, search: string): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true
  const haystack = [
    gatePass.id,
    gatePass.outslipId,
    gatePass.poId,
    gatePass.customer,
    gatePass.destination,
    gatePass.driverName,
    gatePass.plateNo,
    gatePass.status,
    gatePassStatusLabel[gatePass.status],
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

function matchesGatePassDateRange(gatePass: GatePass, dateFrom: string, dateTo: string): boolean {
  if (dateFrom && gatePass.date < dateFrom) return false
  if (dateTo && gatePass.date > dateTo) return false
  return true
}

export function filterGatePasses(gatePasses: GatePass[], filters: GatePassFilters): GatePass[] {
  return gatePasses.filter((gatePass) => {
    if (filters.status !== 'all' && gatePass.status !== filters.status) return false
    if (!matchesGatePassSearch(gatePass, filters.search)) return false
    if (!matchesGatePassDateRange(gatePass, filters.dateFrom, filters.dateTo)) return false
    return true
  })
}

export function sortGatePassesByDateDesc(gatePasses: GatePass[]): GatePass[] {
  return [...gatePasses].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
}

export function countGatePassStatuses(gatePasses: GatePass[]) {
  const counts: Record<GatePassListFilterStatus, number> = {
    all: gatePasses.length,
    approved: 0,
    cancelled: 0,
  }
  gatePasses.forEach((row) => {
    counts[row.status] += 1
  })
  return counts
}

export function handleGatePassPrint() {
  window.print()
}
