const STORAGE_KEY = 'erp-service-orders'

export type ServiceSaleType = 'cash' | 'charge'

export interface ServiceOrder {
  id: string
  invoiceNo: string
  customerId: string
  customerName: string
  customerTin: string
  customerAddress: string
  projectId: string
  projectName: string
  description: string
  date: string
  saleType: ServiceSaleType
  quantity: number
  unitPrice: number
  amount: number
}

function money(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function normalize(row: Partial<ServiceOrder>): ServiceOrder {
  const quantity = money(row.quantity)
  const unitPrice = money(row.unitPrice)
  return {
    id: row.id ?? crypto.randomUUID(),
    invoiceNo: row.invoiceNo ?? '',
    customerId: row.customerId ?? '',
    customerName: row.customerName ?? '',
    customerTin: row.customerTin ?? '',
    customerAddress: row.customerAddress ?? '',
    projectId: row.projectId ?? '',
    projectName: row.projectName ?? '',
    description: row.description ?? '',
    date: row.date ?? '',
    saleType: row.saleType === 'cash' ? 'cash' : 'charge',
    quantity,
    unitPrice,
    amount: money(row.amount) || quantity * unitPrice,
  }
}

export function loadServiceOrders(): ServiceOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Partial<ServiceOrder>>
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalize)
  } catch {
    return []
  }
}

export function saveServiceOrders(orders: ServiceOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

export function nextServiceInvoiceNo(orders: ServiceOrder[]): string {
  const highest = orders.reduce((max, order) => {
    const value = Number(order.invoiceNo)
    return Number.isFinite(value) ? Math.max(max, value) : max
  }, 0)
  return String(highest + 1).padStart(4, '0')
}

export function formatServiceMoney(value: number): string {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatServiceInvoiceDate(isoDate: string): string {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${month}/${day}/${year}`
}
