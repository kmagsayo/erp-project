export interface LineItem {
  itemCode: string
  item: string
  quantity: number
  unit: string
}

export type DocumentStatus = 'draft' | 'pending' | 'approved'
export type OutslipStatus = 'draft' | 'pending' | 'approved' | 'released'
export type MovementType = 'STOCK IN' | 'STOCK OUT'

export interface PurchaseOrder {
  id: string
  date: string
  quotationId?: string
  supplier: string
  customer: string
  project: string
  branch: string
  destination: string
  remarks: string
  items: LineItem[]
  status: DocumentStatus
  outslipId?: string
}

export interface Outslip {
  id: string
  date: string
  poId: string
  supplier: string
  customer: string
  project: string
  branch: string
  warehouse: string
  destination: string
  items: LineItem[]
  preparedBy: string
  releasedBy: string
  remarks: string
  status: OutslipStatus
}

export interface InventoryMovement {
  id: string
  date: string
  item: string
  itemCode: string
  quantity: number
  unit: string
  movementType: MovementType
  warehouse: string
  destination: string
  project: string
  customer: string
  poId: string
  outslipId: string
  processedBy: string
}

export interface DeliveryReceipt {
  id: string
  date: string
  outslipId: string
  poId: string
  customer: string
  project: string
  branch: string
  destination: string
  items: LineItem[]
  status: DocumentStatus
}
