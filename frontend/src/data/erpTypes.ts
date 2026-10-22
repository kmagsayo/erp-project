export interface LineItem {
  itemCode: string
  item: string
  quantity: number
  unit: string
}

export type DocumentStatus = 'draft' | 'pending' | 'approved'
export type DeliveryReceiptStatus =
  | 'active'
  | 'out_for_delivery'
  | 'partially_delivered'
  | 'delivered'
  | 'received'
export type OutslipStatus = 'draft' | 'pending' | 'approved' | 'released' | 'cancelled'
export type ReceivingStatus = 'pending' | 'completed'
export type GatePassStatus = 'approved' | 'cancelled'
export type MovementType = 'STOCK IN' | 'STOCK OUT'

export interface ReceivingItem {
  id: string
  itemCode: string
  description: string
  orderedQuantity: number
  receivedQuantity: number
  unit: string
  unitPrice: number
}

export interface Receiving {
  id: string
  date: string
  poId: string
  poRecordId: string
  supplier: string
  warehouse: string
  items: ReceivingItem[]
  remarks: string
  status: ReceivingStatus
  preparedBy: string
  confirmedBy: string
}

export interface OutslipItem {
  id: string
  itemCode: string
  description: string
  brand: string
  modelSerialNo: string
  poQuantity: number
  releasedQuantity: number
  remainingQuantity: number
  unit: string
  unitPrice: number
  total: number
}

export interface Outslip {
  id: string
  date: string
  poId: string
  poRecordId: string
  receivingId?: string
  supplier: string
  customer: string
  project: string
  branch: string
  warehouse: string
  location: string
  destination: string
  items: OutslipItem[]
  subtotal: number
  otherCharges: number
  totalAmount: number
  preparedBy: string
  approvedBy: string
  releasedBy: string
  receivedBy: string
  receivedBySignature: string
  remarks: string
  status: OutslipStatus
}

export interface GatePassItem {
  id: string
  itemCode: string
  description: string
  brand: string
  modelSerialNo: string
  quantity: number
  unit: string
}

export interface GatePass {
  id: string
  date: string
  timeOut: string
  outslipId: string
  poId: string
  customer: string
  destination: string
  purpose: string
  driverName: string
  plateNo: string
  vehicle: string
  items: GatePassItem[]
  remarks: string
  preparedBy: string
  authorizedBy: string
  guardOnDuty: string
  status: GatePassStatus
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
  receivingId?: string
  processedBy: string
}

export interface DeliveryReceiptItem {
  id: string
  itemCode: string
  description: string
  brandSerialNo: string
  barcode: string
  allowedQuantity: number
  quantity: number
  serialNumbers: string[]
  unit: string
  unitPrice: number
  total: number
}

export interface DeliveryReceipt {
  id: string
  date: string
  outslipId: string
  poId: string
  customer: string
  customerAddress: string
  project: string
  branch: string
  destination: string
  reference: string
  items: DeliveryReceiptItem[]
  totalAmount: number
  deliveredBy: string
  deliveredByPosition: string
  receivedBy: string
  receivedAt: string
  receivedRemarks: string
  qrToken: string
  remarks: string
  status: DeliveryReceiptStatus
}
