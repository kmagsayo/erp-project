import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  DeliveryReceipt,
  InventoryMovement,
  Outslip,
  OutslipStatus,
  PurchaseOrder,
} from './erpTypes'

interface ErpStore {
  purchaseOrders: PurchaseOrder[]
  outslips: Outslip[]
  movements: InventoryMovement[]
  deliveryReceipts: DeliveryReceipt[]
  createOutslipFromPO: (poId: string) => { outslip?: Outslip; error?: string }
  updateOutslipStatus: (
    outslipId: string,
    status: OutslipStatus,
    userName?: string,
  ) => { error?: string }
  createDeliveryReceiptFromOutslip: (
    outslipId: string,
  ) => { receipt?: DeliveryReceipt; error?: string }
}

const TODAY = 'August 18, 2026'

const sampleItems = [
  { itemCode: 'NSW-24', item: 'Network Switch', quantity: 10, unit: 'pc' },
  { itemCode: 'C6-305', item: 'CAT6 Cable', quantity: 50, unit: 'box' },
]

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO-000123',
    date: TODAY,
    quotationId: 'QTN-00001',
    supplier: 'TechSource Trading',
    customer: 'ABC Corporation',
    project: 'Project ABC',
    branch: 'Cebu Main',
    destination: 'Provincial Capitol Compound, Tagbilaran City',
    remarks: 'Approved for site issuance.',
    items: sampleItems,
    status: 'approved',
  },
  {
    id: 'PO-000124',
    date: TODAY,
    quotationId: 'QTN-00002',
    supplier: 'Cebu Cable Supply',
    customer: 'XYZ Industries',
    project: 'Office Access Control Upgrade',
    branch: 'Cebu Main',
    destination: 'Medalle Building, Fuente Osmeña, Cebu City',
    remarks: 'Awaiting approval.',
    items: [
      { itemCode: 'ACR-01', item: 'Access Control Reader', quantity: 4, unit: 'pc' },
    ],
    status: 'pending',
  },
]

const initialMovements: InventoryMovement[] = [
  {
    id: 'IM-000001',
    date: TODAY,
    item: 'Network Switch',
    itemCode: 'NSW-24',
    quantity: 25,
    unit: 'pc',
    movementType: 'STOCK IN',
    warehouse: 'Main Warehouse',
    destination: 'Main Warehouse',
    project: 'Opening Balance',
    customer: '—',
    poId: '—',
    outslipId: '—',
    processedBy: 'Admin',
  },
  {
    id: 'IM-000002',
    date: TODAY,
    item: 'CAT6 Cable',
    itemCode: 'C6-305',
    quantity: 200,
    unit: 'box',
    movementType: 'STOCK IN',
    warehouse: 'Main Warehouse',
    destination: 'Main Warehouse',
    project: 'Opening Balance',
    customer: '—',
    poId: '—',
    outslipId: '—',
    processedBy: 'Admin',
  },
]

const ErpContext = createContext<ErpStore | null>(null)

function nextId(prefix: string, ids: string[]): string {
  const numbers = ids.map((id) => Number(id.split('-')[1] ?? 0))
  const next = Math.max(0, ...numbers) + 1
  return `${prefix}-${String(next).padStart(6, '0')}`
}

export function ErpProvider({ children }: { children: ReactNode }) {
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders)
  const [outslips, setOutslips] = useState<Outslip[]>([])
  const [movements, setMovements] = useState(initialMovements)
  const [deliveryReceipts, setDeliveryReceipts] = useState<DeliveryReceipt[]>([])

  const value = useMemo<ErpStore>(() => {
    function createOutslipFromPO(poId: string) {
      const po = purchaseOrders.find((row) => row.id === poId)
      if (!po) return { error: 'Purchase Order not found.' }
      if (po.status !== 'approved') {
        return { error: 'Only an approved Purchase Order can create an Outslip.' }
      }
      if (po.outslipId) {
        return { error: `Outslip ${po.outslipId} already exists for this PO.` }
      }

      const outslip: Outslip = {
        id: nextId('OS', outslips.map((row) => row.id)),
        date: TODAY,
        poId: po.id,
        supplier: po.supplier,
        customer: po.customer,
        project: po.project,
        branch: po.branch,
        warehouse: 'Main Warehouse',
        destination: po.destination,
        items: po.items.map((item) => ({ ...item })),
        preparedBy: 'Admin',
        releasedBy: '',
        remarks: po.remarks,
        status: 'draft',
      }

      setOutslips((current) => [...current, outslip])
      setPurchaseOrders((current) =>
        current.map((row) =>
          row.id === po.id ? { ...row, outslipId: outslip.id } : row,
        ),
      )

      return { outslip }
    }

    function recordOutslipMovements(outslip: Outslip, processedBy: string) {
      const alreadyRecorded = movements.some(
        (row) => row.outslipId === outslip.id && row.movementType === 'STOCK OUT',
      )
      if (alreadyRecorded) return

      const lastNumber = movements.reduce((max, row) => {
        const value = Number(row.id.split('-')[1] ?? 0)
        return Math.max(max, value)
      }, 0)

      const newRows: InventoryMovement[] = outslip.items.map((item, index) => ({
        id: `IM-${String(lastNumber + index + 1).padStart(6, '0')}`,
        date: TODAY,
        item: item.item,
        itemCode: item.itemCode,
        quantity: item.quantity,
        unit: item.unit,
        movementType: 'STOCK OUT',
        warehouse: outslip.warehouse,
        destination: outslip.destination,
        project: outslip.project,
        customer: outslip.customer,
        poId: outslip.poId,
        outslipId: outslip.id,
        processedBy,
      }))

      setMovements((current) => [...current, ...newRows])
    }

    function updateOutslipStatus(
      outslipId: string,
      status: OutslipStatus,
      userName = 'Admin',
    ) {
      const outslip = outslips.find((row) => row.id === outslipId)
      if (!outslip) return { error: 'Outslip not found.' }

      const next: Outslip = {
        ...outslip,
        status,
        releasedBy: status === 'released' ? userName : outslip.releasedBy,
      }

      setOutslips((current) =>
        current.map((row) => (row.id === outslipId ? next : row)),
      )

      if (status === 'approved' || status === 'released') {
        recordOutslipMovements(next, userName)
      }

      return {}
    }

    function createDeliveryReceiptFromOutslip(outslipId: string) {
      const outslip = outslips.find((row) => row.id === outslipId)
      if (!outslip) return { error: 'Outslip not found.' }
      if (outslip.status !== 'released') {
        return { error: 'Release the Outslip first so inventory is recorded.' }
      }

      const existing = deliveryReceipts.find((row) => row.outslipId === outslipId)
      if (existing) {
        return { error: `Delivery Receipt ${existing.id} already exists.` }
      }

      const receipt: DeliveryReceipt = {
        id: nextId('DR', deliveryReceipts.map((row) => row.id)),
        date: TODAY,
        outslipId: outslip.id,
        poId: outslip.poId,
        customer: outslip.customer,
        project: outslip.project,
        branch: outslip.branch,
        destination: outslip.destination,
        items: outslip.items.map((item) => ({ ...item })),
        status: 'draft',
      }

      setDeliveryReceipts((current) => [...current, receipt])
      return { receipt }
    }

    return {
      purchaseOrders,
      outslips,
      movements,
      deliveryReceipts,
      createOutslipFromPO,
      updateOutslipStatus,
      createDeliveryReceiptFromOutslip,
    }
  }, [purchaseOrders, outslips, movements, deliveryReceipts])

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>
}

export function useErp() {
  const store = useContext(ErpContext)
  if (!store) {
    throw new Error('useErp must be used inside ErpProvider.')
  }
  return store
}

export function getStockLevels(movements: InventoryMovement[]) {
  const map = new Map<
    string,
    { item: string; itemCode: string; unit: string; quantity: number }
  >()

  movements.forEach((row) => {
    const current = map.get(row.itemCode) ?? {
      item: row.item,
      itemCode: row.itemCode,
      unit: row.unit,
      quantity: 0,
    }
    current.quantity +=
      row.movementType === 'STOCK IN' ? row.quantity : -row.quantity
    map.set(row.itemCode, current)
  })

  return Array.from(map.values())
}
