import type { AccomplishmentReportData } from '@/data/accomplishmentReports'
import type { DeliveryReceipt } from '@/data/erpTypes'
import { todayIsoDate } from '@/lib/quotations'

const STORAGE_KEY = 'erp-accomplishments'

function formatReportDate(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function loadAccomplishmentReports(
  fallback: AccomplishmentReportData[] = [],
): AccomplishmentReportData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as AccomplishmentReportData[]
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function saveAccomplishmentReports(reports: AccomplishmentReportData[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
    window.dispatchEvent(new Event('erp-accomplishments-updated'))
  } catch (error) {
    console.warn('Could not save accomplishment reports.', error)
  }
}

export function generateAccomplishmentNo(existing: AccomplishmentReportData[]): string {
  const numbers = existing.map((row) => Number(row.id.replace(/\D/g, '') || 0))
  const next = Math.max(0, ...numbers) + 1
  return `AR-${String(next).padStart(5, '0')}`
}

export function findAccomplishmentForDeliveryReceipt(
  receiptId: string,
  reports: AccomplishmentReportData[] = loadAccomplishmentReports(),
): AccomplishmentReportData | undefined {
  return reports.find((row) => row.deliveryReceiptId === receiptId)
}

function buildAccomplishmentFromDeliveryReceipt(
  receipt: DeliveryReceipt,
  id: string,
): AccomplishmentReportData {
  return {
    id,
    projectName: receipt.project || receipt.customer,
    location: receipt.destination || receipt.customerAddress || receipt.branch,
    installationReportNo: id,
    date: formatReportDate(receipt.date || todayIsoDate()),
    remarks: '',
    preparedBy: 'LARKE. G GELBOLINGO',
    preparedByPosition: 'PERSONNEL',
    confirmedByLabel: 'SIGNATURE OF PRINTED NAME/POSITION',
    images: [],
    deliveryReceiptId: receipt.id,
  }
}

export function syncAccomplishmentReportsFromDeliveryReceipts(
  receipts: DeliveryReceipt[],
): AccomplishmentReportData[] {
  const reports = loadAccomplishmentReports()
  const knownReceiptIds = new Set(
    reports.map((row) => row.deliveryReceiptId).filter((id): id is string => Boolean(id)),
  )
  const additions: AccomplishmentReportData[] = []

  receipts.forEach((receipt) => {
    if (knownReceiptIds.has(receipt.id)) return
    const report = buildAccomplishmentFromDeliveryReceipt(
      receipt,
      generateAccomplishmentNo([...reports, ...additions]),
    )
    additions.push(report)
    knownReceiptIds.add(receipt.id)
  })

  if (additions.length === 0) return reports

  const next = [...reports, ...additions]
  saveAccomplishmentReports(next)
  return next
}

export function createAccomplishmentFromDeliveryReceipt(
  receipt: DeliveryReceipt,
): AccomplishmentReportData {
  const reports = syncAccomplishmentReportsFromDeliveryReceipts([receipt])
  return (
    findAccomplishmentForDeliveryReceipt(receipt.id, reports) ??
    reports[reports.length - 1]
  )
}

export function updateAccomplishmentReport(
  reportId: string,
  patch: Partial<AccomplishmentReportData>,
): AccomplishmentReportData[] {
  const reports = loadAccomplishmentReports().map((row) =>
    row.id === reportId ? { ...row, ...patch } : row,
  )
  saveAccomplishmentReports(reports)
  return reports
}
