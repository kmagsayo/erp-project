const UNDO_KEY = 'erp-undo-latest-transaction-1'

const DOCUMENT_KEYS = [
  'erp-quotations',
  'erp-purchase-orders',
  'erp-receivings',
  'erp-outslips',
  'erp-delivery-receipts',
  'erp-gate-passes',
  'erp-billings',
  'erp-billings-v2',
  'erp-service-orders',
  'erp-accomplishments',
] as const

const DOCUMENT_EVENTS: Record<string, string> = {
  'erp-quotations': 'erp-quotations-updated',
  'erp-purchase-orders': 'erp-purchase-orders-updated',
  'erp-receivings': 'erp-receivings-updated',
  'erp-outslips': 'erp-outslips-updated',
  'erp-delivery-receipts': 'erp-delivery-receipts-updated',
  'erp-gate-passes': 'erp-gate-passes-updated',
  'erp-billings': 'erp-billings-updated',
  'erp-billings-v2': 'erp-billings-updated',
  'erp-accomplishments': 'erp-accomplishments-updated',
}

type Candidate = {
  key: (typeof DOCUMENT_KEYS)[number]
  index: number
  stamp: string
  id: string
}

function rowStamp(row: Record<string, unknown>): string {
  const candidates = [row.createdAt, row.updatedAt, row.date, row.dueDate, row.transactionDate]
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/** Removes the newest transaction document the user just created. */
export function undoLatestTransaction() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(UNDO_KEY) === '1') return
  localStorage.setItem(UNDO_KEY, '1')

  try {
    let best: Candidate | null = null

    for (const key of DOCUMENT_KEYS) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const rows = JSON.parse(raw) as Array<Record<string, unknown>>
      if (!Array.isArray(rows) || rows.length === 0) continue

      rows.forEach((row, index) => {
        const stamp = rowStamp(row)
        const id = typeof row.id === 'string' ? row.id : String(index)
        if (!best || stamp > best.stamp || (stamp === best.stamp && id > best.id)) {
          best = { key, index, stamp, id }
        }
      })
    }

    if (!best) return

    const target: Candidate = best
    const raw = localStorage.getItem(target.key)
    if (!raw) return
    const rows = JSON.parse(raw) as unknown[]
    if (!Array.isArray(rows) || target.index < 0 || target.index >= rows.length) return

    const next = rows.filter((_, index) => index !== target.index)
    localStorage.setItem(target.key, JSON.stringify(next))

    const eventName = DOCUMENT_EVENTS[target.key]
    if (eventName) window.dispatchEvent(new Event(eventName))
  } catch {
    localStorage.removeItem(UNDO_KEY)
  }
}
