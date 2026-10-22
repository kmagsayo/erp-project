export type SoaStatus = 'open' | 'partial' | 'settled'

export interface SoaLine {
  id: string
  billingId: string
  date: string
  transactionDate: string
  reference: string
  description: string
  kind: 'billing' | 'payment'
  debit: number
  credit: number
  balance: number
}

export interface StatementOfAccount {
  id: string
  soaNo: string
  customerId: string
  customerName: string
  dateFrom: string
  dateTo: string
  status: SoaStatus
  lines: SoaLine[]
  totalDebit: number
  totalCredit: number
  endingBalance: number
}

export type SoaFilterStatus = SoaStatus | 'all'

export interface SoaFilters {
  status: SoaFilterStatus
  search: string
  dateFrom: string
  dateTo: string
}
