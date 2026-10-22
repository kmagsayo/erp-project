export type PurchaseOrderStatus = 'approved' | 'completed'

export interface PurchaseOrderLineItem {
  id: string
  itemCode: string
  itemName: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface PurchaseOrder {
  id: string
  poNo: string
  date: string
  quotationRef?: string
  supplierId: string
  supplier: string
  supplierAddress: string
  supplierPhone: string
  supplierTin: string
  customerId: string
  customer: string
  customerAddress: string
  customerPhone: string
  customerTin: string
  project: string
  branch: string
  destination: string
  deliveryTerm: string
  deliveryDate: string
  paymentTerm: string
  warrantyPeriod: string
  remarks: string
  items: PurchaseOrderLineItem[]
  amount: number
  status: PurchaseOrderStatus
  preparedBy: string
  preparedByPosition: string
  outslipId?: string
  receivingId?: string
}

export type PurchaseOrderSortField =
  | 'poNo'
  | 'supplier'
  | 'date'
  | 'amount'
  | 'status'

export type SortDirection = 'asc' | 'desc'

export interface PurchaseOrderFilters {
  status: PurchaseOrderStatus | 'all'
  search: string
  dateFrom: string
  dateTo: string
}
