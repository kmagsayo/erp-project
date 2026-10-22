const FLAG = 'erp-setup-codes-renumbered-v1'

const DOCUMENT_KEYS = [
  'erp-quotations',
  'erp-purchase-orders',
  'erp-receivings',
  'erp-outslips',
  'erp-delivery-receipts',
  'erp-gate-passes',
  'erp-billings',
  'erp-billings-v2',
  'erp-accomplishments',
]

const CODE_MAP: Record<string, string> = {
  'ITM-0008': 'ITM-0001',
  'ITM-0009': 'ITM-0002',
  'ITM-0010': 'ITM-0003',
  'ITM-0011': 'ITM-0004',
  'ITM-0012': 'ITM-0005',
  'ITM-0013': 'ITM-0006',
  'ITM-0014': 'ITM-0007',
  'CUST-006': 'CUST-001',
  'CUST-007': 'CUST-002',
  'CUST-008': 'CUST-003',
  'CUST-009': 'CUST-004',
  'CUST-010': 'CUST-005',
  'SUP-008': 'SUP-001',
  'SUP-009': 'SUP-002',
  'SUP-010': 'SUP-003',
  'SUP-011': 'SUP-004',
  'SUP-012': 'SUP-005',
}

function remapValue(value: unknown): unknown {
  if (typeof value === 'string') return CODE_MAP[value] ?? value
  if (Array.isArray(value)) return value.map(remapValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, remapValue(nested)]),
    )
  }
  return value
}

/** Updates stored transaction codes after setup codes were renumbered to start at 1. */
export function remapRenumberedSetupCodes() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(FLAG) === '1') return

  DOCUMENT_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return
    try {
      localStorage.setItem(key, JSON.stringify(remapValue(JSON.parse(raw))))
    } catch {
      // Leave the original value if it is not JSON.
    }
  })

  localStorage.setItem(FLAG, '1')
}

remapRenumberedSetupCodes()
