const RESET_FLAG = 'erp-examples-removed-v7'

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
  'erp-notification-read',
  'erp-inventory-movements',
]

const DOCUMENT_EVENTS = [
  'erp-quotations-updated',
  'erp-purchase-orders-updated',
  'erp-receivings-updated',
  'erp-outslips-updated',
  'erp-delivery-receipts-updated',
  'erp-gate-passes-updated',
  'erp-billings-updated',
  'erp-accomplishments-updated',
]

/** Clears seeded example documents. Setups and user auth are left intact. */
export function resetExampleDocuments() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(RESET_FLAG) === '1') return

  DOCUMENT_KEYS.forEach((key) => localStorage.removeItem(key))
  sessionStorage.removeItem('erp-receiving-flash')
  localStorage.setItem(RESET_FLAG, '1')

  DOCUMENT_EVENTS.forEach((eventName) => {
    window.dispatchEvent(new Event(eventName))
  })
}

resetExampleDocuments()
