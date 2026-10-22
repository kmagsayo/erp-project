export type QuotationStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface QuotationLineItem {
  id: string
  itemId: string
  itemCode: string
  itemName: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface Quotation {
  id: string
  quotationNo: string
  customerId: string
  customerName: string
  customerAddress: string
  customerPhone: string
  customerTin: string
  subject: string
  date: string
  status: QuotationStatus
  items: QuotationLineItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  remarks: string
  terms: string
  preparedByUserId: string
  preparedBy: string
  preparedByPosition: string
  approvedByUserId: string
  approvedBy: string
}

export interface CustomerOption {
  id: string
  name: string
  address?: string
  phone?: string
  tin?: string
}

export interface CatalogItem {
  id: string
  code: string
  name: string
  unit: string
  unitPrice: number
  barcode?: string
}

export type QuotationSortField =
  | 'quotationNo'
  | 'customerName'
  | 'date'
  | 'total'
  | 'status'

export type SortDirection = 'asc' | 'desc'

export interface QuotationFilters {
  status: QuotationStatus | 'all'
  search: string
  dateFrom: string
  dateTo: string
}
