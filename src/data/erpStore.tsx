import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  DeliveryReceipt,
  DeliveryReceiptStatus,
  GatePass,
  InventoryMovement,
  Outslip,
  OutslipStatus,
  Receiving,
} from './erpTypes'
import type { PurchaseOrder } from './purchaseOrderTypes'
import {
  initialPurchaseOrders,
  loadPurchaseOrders,
  savePurchaseOrders,
} from '@/lib/purchaseOrders'
import {
  buildOutslipFromPo,
  loadOutslips,
  recalculateOutslipTotals,
  saveOutslips,
  undoCreatedOutslip,
  validateOutslipQuantities,
} from '@/lib/outslips'
import {
  buildReceivingFromPo,
  loadReceivings,
  parseReceivingItemQr,
  saveReceivings,
  undoReceivingScanTest,
  type ReceivingItemScanDetail,
} from '@/lib/receivings'
import {
  loadDeliveryReceipts,
  newDeliveryReceiptQrToken,
  saveDeliveryReceipts,
  undoDeliveryItemScanTest,
  withOutslipAmounts,
} from '@/lib/deliveryReceipts'
import {
  buildGatePassFromOutslip,
  loadGatePasses,
  saveGatePasses,
} from '@/lib/gatePasses'
import { resetExampleDocuments } from '@/lib/resetExampleDocuments'
import { syncAccomplishmentReportsFromDeliveryReceipts } from '@/lib/accomplishmentReports'

resetExampleDocuments()

interface ErpStore {
  purchaseOrders: PurchaseOrder[]
  outslips: Outslip[]
  receivings: Receiving[]
  movements: InventoryMovement[]
  deliveryReceipts: DeliveryReceipt[]
  gatePasses: GatePass[]
  createOutslipFromPO: (
    poId: string,
    options?: {
      customer?: string
      receivingId?: string
      location?: string
      destination?: string
    },
  ) => { outslip?: Outslip; error?: string }
  createReceivingFromPO: (
    poId: string,
    options?: { confirm?: boolean },
  ) => { receiving?: Receiving; error?: string; alreadyCompleted?: boolean }
  confirmReceiving: (
    receivingId: string,
    userName?: string,
  ) => { receiving?: Receiving; error?: string }
  receiveScannedItem: (code: string) => ReceivingItemScanDetail | null
  saveOutslipDraft: (outslip: Outslip) => { outslip?: Outslip; error?: string }
  updateOutslipStatus: (
    outslipId: string,
    status: OutslipStatus,
    userName?: string,
  ) => { error?: string }
  createDeliveryReceiptFromOutslip: (
    outslipId: string,
  ) => { receipt?: DeliveryReceipt; error?: string }
  createGatePassAndDeliveryReceipt: (outslipId: string) => {
    gatePass?: GatePass
    receipt?: DeliveryReceipt
    createdGatePass?: boolean
    createdReceipt?: boolean
    error?: string
  }
  updateDeliveryReceipt: (
    receipt: DeliveryReceipt,
  ) => { receipt?: DeliveryReceipt; error?: string }
  updateDeliveryReceiptStatus: (
    receiptId: string,
    status: DeliveryReceiptStatus,
  ) => { error?: string }
  confirmDeliveryReceiptReceived: (
    receiptId: string,
    confirmation: { receivedBy: string; receivedAt: string; remarks: string },
  ) => { receipt?: DeliveryReceipt; error?: string; already?: boolean }
  createGatePassFromOutslip: (outslipId: string) => { gatePass?: GatePass; error?: string }
  updateGatePass: (gatePass: GatePass) => { gatePass?: GatePass; error?: string }
}

const initialMovements: InventoryMovement[] = []

const ErpContext = createContext<ErpStore | null>(null)

export function nextId(prefix: string, ids: string[]): string {
  const numbers = ids.map((id) => Number(id.split('-')[1] ?? 0))
  const next = Math.max(0, ...numbers) + 1
  return `${prefix}-${String(next).padStart(6, '0')}`
}

export function ErpProvider({ children }: { children: ReactNode }) {
  const [outslips, setOutslips] = useState<Outslip[]>(() => {
    undoCreatedOutslip()
    return loadOutslips([])
  })
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    undoReceivingScanTest()
    return loadPurchaseOrders(initialPurchaseOrders)
  })
  const [receivings, setReceivings] = useState<Receiving[]>(() => loadReceivings([]))
  const [movements, setMovements] = useState(initialMovements)
  const [deliveryReceipts, setDeliveryReceipts] = useState<DeliveryReceipt[]>(() => {
    undoDeliveryItemScanTest()
    return loadDeliveryReceipts([])
  })
  const [gatePasses, setGatePasses] = useState<GatePass[]>(() => loadGatePasses([]))

  useEffect(() => {
    function refreshPurchaseOrders() {
      setPurchaseOrders(loadPurchaseOrders(initialPurchaseOrders))
    }
    function refreshOutslips() {
      setOutslips(loadOutslips([]))
    }
    function refreshReceivings() {
      setReceivings(loadReceivings([]))
    }
    function refreshDeliveryReceipts() {
      setDeliveryReceipts(loadDeliveryReceipts([]))
    }
    function refreshGatePasses() {
      setGatePasses(loadGatePasses([]))
    }

    window.addEventListener('erp-purchase-orders-updated', refreshPurchaseOrders)
    window.addEventListener('erp-outslips-updated', refreshOutslips)
    window.addEventListener('erp-receivings-updated', refreshReceivings)
    window.addEventListener('erp-delivery-receipts-updated', refreshDeliveryReceipts)
    window.addEventListener('erp-gate-passes-updated', refreshGatePasses)
    return () => {
      window.removeEventListener('erp-purchase-orders-updated', refreshPurchaseOrders)
      window.removeEventListener('erp-outslips-updated', refreshOutslips)
      window.removeEventListener('erp-receivings-updated', refreshReceivings)
      window.removeEventListener('erp-delivery-receipts-updated', refreshDeliveryReceipts)
      window.removeEventListener('erp-gate-passes-updated', refreshGatePasses)
    }
  }, [])

  useEffect(() => {
    saveDeliveryReceipts(deliveryReceipts, { emitEvent: false })
  }, [deliveryReceipts])

  useEffect(() => {
    saveGatePasses(gatePasses, { emitEvent: false })
  }, [gatePasses])

  useEffect(() => {
    setDeliveryReceipts((current) => {
      let changed = false
      const next = current.map((receipt) => {
        if (receipt.totalAmount > 0 && receipt.items.length > 0) return receipt
        const outslip = outslips.find((row) => row.id === receipt.outslipId)
        if (!outslip) return receipt
        const purchaseOrder = purchaseOrders.find(
          (row) => row.poNo === outslip.poId || row.id === outslip.poRecordId,
        )
        const repaired = withOutslipAmounts(receipt, outslip, purchaseOrder)
        if (
          repaired.totalAmount === receipt.totalAmount &&
          repaired.items.length === receipt.items.length
        ) {
          return receipt
        }
        changed = true
        return repaired
      })
      return changed ? next : current
    })
  }, [outslips, purchaseOrders])

  const value = useMemo<ErpStore>(() => {
    function createOutslipFromPO(
      poId: string,
      options?: {
        customer?: string
        receivingId?: string
        location?: string
        destination?: string
      },
    ) {
      const orders = loadPurchaseOrders(initialPurchaseOrders)
      const po = orders.find((row) => row.id === poId)
      if (!po) return { error: 'Purchase Order not found.' }
      if (po.status !== 'approved' && po.status !== 'completed') {
        return { error: 'Only an approved or completed Purchase Order can create an Outslip.' }
      }

      if (options?.receivingId) {
        const receiving = receivings.find((row) => row.id === options.receivingId)
        if (!receiving) return { error: 'Receiving not found.' }
        if (receiving.status !== 'completed') {
          return { error: 'Only a completed Receiving can create an Outslip.' }
        }
        if (receiving.poRecordId !== po.id && receiving.poId !== po.poNo) {
          return { error: 'Selected Receiving is not linked to this Purchase Order.' }
        }

        const existingForReceiving = outslips.find(
          (row) => row.receivingId === options.receivingId && row.status !== 'cancelled',
        )
        if (existingForReceiving) return { outslip: existingForReceiving }
      } else {
        if (po.outslipId) {
          const existing = outslips.find((row) => row.id === po.outslipId)
          if (existing) return { outslip: existing }
        }

        const existingForPo = outslips.find(
          (row) => row.poRecordId === po.id && row.status !== 'cancelled',
        )
        if (existingForPo) {
          savePurchaseOrders(
            orders.map((row) =>
              row.id === po.id ? { ...row, outslipId: existingForPo.id } : row,
            ),
          )
          setPurchaseOrders(loadPurchaseOrders(initialPurchaseOrders))
          return { outslip: existingForPo }
        }
      }

      const outslip = buildOutslipFromPo(po, outslips, 'WEB ADMINISTRATOR', {
        ...options,
        status: options?.receivingId ? 'pending' : 'draft',
      })
      const quantityCheck = validateOutslipQuantities(outslip, outslips)
      if (!quantityCheck.valid) {
        return {
          error:
            'No available PO quantity left for this outslip. Previous outslips already consumed the quantity.',
        }
      }

      const nextOutslips = [...outslips, outslip]
      setOutslips(nextOutslips)
      saveOutslips(nextOutslips)

      savePurchaseOrders(
        orders.map((row) =>
          row.id === po.id ? { ...row, outslipId: outslip.id } : row,
        ),
      )
      setPurchaseOrders(loadPurchaseOrders(initialPurchaseOrders))

      return { outslip }
    }

    function createReceivingFromPO(poId: string, options?: { confirm?: boolean }) {
      const orders = loadPurchaseOrders(initialPurchaseOrders)
      const po = orders.find((row) => row.id === poId)
      if (!po) return { error: 'Purchase Order not found.' }

      const existing =
        (po.receivingId ? receivings.find((row) => row.id === po.receivingId) : undefined) ??
        receivings.find((row) => row.poRecordId === po.id)

      if (existing) {
        if (options?.confirm && existing.status !== 'completed') {
          return confirmReceiving(existing.id)
        }

        savePurchaseOrders(
          orders.map((row) =>
            row.id === po.id
              ? {
                  ...row,
                  receivingId: existing.id,
                  status: existing.status === 'completed' ? 'completed' : row.status,
                }
              : row,
          ),
        )
        setPurchaseOrders(loadPurchaseOrders(initialPurchaseOrders))
        return {
          receiving: existing,
          alreadyCompleted: existing.status === 'completed',
        }
      }

      if (po.status !== 'approved' && po.status !== 'completed') {
        return { error: 'Only an approved Purchase Order can create a Receiving.' }
      }

      const receiving = buildReceivingFromPo(po, receivings)
      const nextReceiving = options?.confirm
        ? {
            ...receiving,
            status: 'completed' as const,
            confirmedBy: 'Admin',
            items: receiving.items.map((item) => ({
              ...item,
              receivedQuantity: item.orderedQuantity,
            })),
          }
        : receiving
      const nextReceivings = [...receivings, nextReceiving]
      setReceivings(nextReceivings)
      saveReceivings(nextReceivings)

      if (options?.confirm) {
        recordReceivingMovements(nextReceiving, 'Admin')
      }

      savePurchaseOrders(
        orders.map((row) =>
          row.id === po.id
            ? {
                ...row,
                receivingId: nextReceiving.id,
                status: nextReceiving.status === 'completed' ? 'completed' : row.status,
              }
            : row,
        ),
      )
      setPurchaseOrders(loadPurchaseOrders(initialPurchaseOrders))

      return { receiving: nextReceiving }
    }

    function recordReceivingMovements(receiving: Receiving, processedBy: string) {
      const alreadyRecorded = movements.some(
        (row) =>
          row.receivingId === receiving.id && row.movementType === 'STOCK IN',
      )
      if (alreadyRecorded) return

      const lastNumber = movements.reduce((max, row) => {
        const value = Number(row.id.split('-')[1] ?? 0)
        return Math.max(max, value)
      }, 0)

      const newRows: InventoryMovement[] = receiving.items
        .map((item, index) => ({
          id: `IM-${String(lastNumber + index + 1).padStart(6, '0')}`,
          date: receiving.date,
          item: item.description,
          itemCode: item.itemCode,
          quantity: item.receivedQuantity,
          unit: item.unit,
          movementType: 'STOCK IN' as const,
          warehouse: receiving.warehouse,
          destination: receiving.warehouse,
          project: '—',
          customer: '—',
          poId: receiving.poId,
          outslipId: '—',
          receivingId: receiving.id,
          processedBy,
        }))
        .filter((row) => row.quantity > 0)

      setMovements((current) => [...current, ...newRows])
    }

    function persistCompletedReceiving(next: Receiving, userName: string) {
      const nextReceivings = receivings.map((row) => (row.id === next.id ? next : row))
      setReceivings(nextReceivings)
      saveReceivings(nextReceivings)
      recordReceivingMovements(next, userName)

      const orders = loadPurchaseOrders(initialPurchaseOrders)
      savePurchaseOrders(
        orders.map((row) =>
          row.id === next.poRecordId
            ? { ...row, receivingId: next.id, status: 'completed' }
            : row,
        ),
      )
      setPurchaseOrders(loadPurchaseOrders(initialPurchaseOrders))
    }

    function confirmReceiving(receivingId: string, userName = 'Admin') {
      const receiving = receivings.find((row) => row.id === receivingId)
      if (!receiving) return { error: 'Receiving not found.' }
      if (receiving.status === 'completed') {
        return { error: 'This receiving is already completed.' }
      }

      const next: Receiving = {
        ...receiving,
        status: 'completed',
        confirmedBy: userName,
        items: receiving.items.map((item) => ({
          ...item,
          receivedQuantity: item.orderedQuantity,
        })),
      }
      persistCompletedReceiving(next, userName)
      return { receiving: next }
    }

    function receiveScannedItem(code: string): ReceivingItemScanDetail | null {
      const parsed = parseReceivingItemQr(code)
      if (!parsed) return null

      const receiving = receivings.find((row) => row.id === parsed.receivingId)
      if (!receiving) {
        return {
          receivingId: parsed.receivingId,
          description: '',
          message: 'Receiving not found.',
          completed: false,
        }
      }

      const item = receiving.items.find((row) => row.id === parsed.itemId)
      if (!item) {
        return {
          receivingId: receiving.id,
          description: '',
          message: 'That QR does not match an item on this receiving.',
          completed: false,
        }
      }

      if (receiving.status === 'completed' || item.receivedQuantity >= item.orderedQuantity) {
        return {
          receivingId: receiving.id,
          description: item.description,
          message: `${item.description} is already received.`,
          completed: receiving.status === 'completed',
        }
      }

      const items = receiving.items.map((row) =>
        row.id === item.id ? { ...row, receivedQuantity: row.orderedQuantity } : row,
      )
      const allReceived = items.every(
        (row) => row.orderedQuantity <= 0 || row.receivedQuantity >= row.orderedQuantity,
      )
      const next: Receiving = allReceived
        ? {
            ...receiving,
            items,
            status: 'completed',
            confirmedBy: receiving.confirmedBy || 'Admin',
          }
        : { ...receiving, items }

      if (allReceived) {
        persistCompletedReceiving(next, next.confirmedBy || 'Admin')
      } else {
        const nextReceivings = receivings.map((row) => (row.id === receiving.id ? next : row))
        setReceivings(nextReceivings)
        saveReceivings(nextReceivings)
      }

      return {
        receivingId: receiving.id,
        description: item.description,
        message: `${item.description} received.`,
        completed: allReceived,
      }
    }

    function saveOutslipDraft(outslip: Outslip) {
      const normalized = recalculateOutslipTotals(outslip)
      const validation = validateOutslipQuantities(normalized, outslips)
      if (!validation.valid) {
        return { error: validation.errors[0] }
      }

      const exists = outslips.some((row) => row.id === normalized.id)
      const next = exists
        ? outslips.map((row) => (row.id === normalized.id ? normalized : row))
        : [...outslips, normalized]
      setOutslips(next)
      saveOutslips(next)
      return { outslip: normalized }
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
        date: outslip.date,
        item: item.description,
        itemCode: item.itemCode,
        quantity: item.releasedQuantity,
        unit: item.unit,
        movementType: 'STOCK OUT' as const,
        warehouse: outslip.warehouse,
        destination: outslip.location,
        project: outslip.project,
        customer: outslip.customer,
        poId: outslip.poId,
        outslipId: outslip.id,
        processedBy,
      })).filter((row) => row.quantity > 0)

      setMovements((current) => [...current, ...newRows])
    }

    function updateOutslipStatus(
      outslipId: string,
      status: OutslipStatus,
      userName = 'Admin',
    ) {
      const outslip = outslips.find((row) => row.id === outslipId)
      if (!outslip) return { error: 'Outslip not found.' }
      if (outslip.status === 'cancelled') {
        return { error: 'Cancelled outslips can no longer change status.' }
      }

      if (status === 'released' && outslip.status !== 'approved') {
        return { error: 'Only approved outslips can be released.' }
      }

      if (status === 'approved' && outslip.status !== 'pending') {
        return { error: 'Only pending outslips can be approved.' }
      }

      if (status === 'pending' && outslip.status !== 'draft') {
        return { error: 'Only draft outslips can be submitted for approval.' }
      }
      if (status === 'cancelled' && outslip.status === 'released') {
        return { error: 'Released outslips cannot be cancelled.' }
      }

      const next: Outslip = {
        ...outslip,
        status,
        approvedBy: status === 'approved' ? userName : outslip.approvedBy,
        releasedBy: status === 'released' ? userName : outslip.releasedBy,
      }

      const validation = validateOutslipQuantities(next, outslips)
      if (!validation.valid) return { error: validation.errors[0] }

      const nextOutslips = outslips.map((row) => (row.id === outslipId ? next : row))
      setOutslips(nextOutslips)
      saveOutslips(nextOutslips)

      if (status === 'released') {
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

      const gatePass = gatePasses.find(
        (row) => row.outslipId === outslipId && row.status === 'approved',
      )
      if (!gatePass) {
        return { error: 'Create a Gate Pass from this Outslip first.' }
      }

      const purchaseOrder = purchaseOrders.find(
        (row) => row.poNo === outslip.poId || row.id === outslip.poRecordId,
      )
      const receipt = withOutslipAmounts(
        {
          id: nextId('DR', deliveryReceipts.map((row) => row.id)),
          date: outslip.date,
          outslipId: outslip.id,
          poId: outslip.poId,
          customer: outslip.customer,
          customerAddress: outslip.location,
          project: outslip.project,
          branch: outslip.branch,
          destination: outslip.location,
          reference: outslip.poId,
          items: [],
          totalAmount: 0,
          deliveredBy: outslip.releasedBy || outslip.preparedBy || 'WEB ADMINISTRATOR',
          deliveredByPosition: 'Project Manager',
          receivedBy: outslip.receivedBy || '',
          receivedAt: '',
          receivedRemarks: '',
          qrToken: newDeliveryReceiptQrToken(),
          remarks: outslip.remarks,
          status: 'active',
        },
        outslip,
        purchaseOrder,
      )

      setDeliveryReceipts((current) => [...current, receipt])
      syncAccomplishmentReportsFromDeliveryReceipts([...deliveryReceipts, receipt])
      return { receipt }
    }

    function createGatePassAndDeliveryReceipt(outslipId: string) {
      const outslip = outslips.find((row) => row.id === outslipId)
      if (!outslip) return { error: 'Outslip not found.' }
      if (outslip.status !== 'released') {
        return {
          error: 'Mark the Outslip for dispatch before creating a Gate Pass and Delivery Receipt.',
        }
      }

      let gatePass = gatePasses.find(
        (row) => row.outslipId === outslipId && row.status === 'approved',
      )
      let createdGatePass = false
      if (!gatePass) {
        gatePass = buildGatePassFromOutslip(outslip, gatePasses)
        if (gatePass.items.length === 0) {
          return { error: 'This Outslip has no released items to include on a Gate Pass.' }
        }
        createdGatePass = true
        setGatePasses((current) => [...current, gatePass!])
      }

      let receipt = deliveryReceipts.find((row) => row.outslipId === outslipId)
      let createdReceipt = false
      if (!receipt) {
        const purchaseOrder = purchaseOrders.find(
          (row) => row.poNo === outslip.poId || row.id === outslip.poRecordId,
        )
        receipt = withOutslipAmounts(
          {
            id: nextId('DR', deliveryReceipts.map((row) => row.id)),
            date: outslip.date,
            outslipId: outslip.id,
            poId: outslip.poId,
            customer: outslip.customer,
            customerAddress: outslip.location,
            project: outslip.project,
            branch: outslip.branch,
            destination: outslip.location,
            reference: outslip.poId,
            items: [],
            totalAmount: 0,
            deliveredBy: outslip.releasedBy || outslip.preparedBy || 'WEB ADMINISTRATOR',
            deliveredByPosition: 'Project Manager',
            receivedBy: outslip.receivedBy || '',
            receivedAt: '',
            receivedRemarks: '',
            qrToken: newDeliveryReceiptQrToken(),
            remarks: outslip.remarks,
            status: 'active',
          },
          outslip,
          purchaseOrder,
        )
        createdReceipt = true
        const nextReceipt = receipt
        setDeliveryReceipts((current) => [...current, nextReceipt])
        syncAccomplishmentReportsFromDeliveryReceipts([...deliveryReceipts, nextReceipt])
      }

      return { gatePass, receipt, createdGatePass, createdReceipt }
    }

    function updateDeliveryReceipt(receipt: DeliveryReceipt) {
      const existing = deliveryReceipts.find((row) => row.id === receipt.id)
      if (!existing) return { error: 'Delivery Receipt not found.' }

      setDeliveryReceipts((current) =>
        current.map((row) => (row.id === receipt.id ? receipt : row)),
      )
      return { receipt }
    }

    function updateDeliveryReceiptStatus(receiptId: string, status: DeliveryReceiptStatus) {
      const existing = deliveryReceipts.find((row) => row.id === receiptId)
      if (!existing) return { error: 'Delivery Receipt not found.' }

      setDeliveryReceipts((current) =>
        current.map((row) => (row.id === receiptId ? { ...row, status } : row)),
      )
      if (status === 'delivered') {
        syncAccomplishmentReportsFromDeliveryReceipts(
          deliveryReceipts.map((row) => (row.id === receiptId ? { ...row, status } : row)),
        )
      }
      return {}
    }

    function confirmDeliveryReceiptReceived(
      receiptId: string,
      confirmation: { receivedBy: string; receivedAt: string; remarks: string },
    ) {
      const existing = deliveryReceipts.find((row) => row.id === receiptId)
      if (!existing) return { error: 'Delivery Receipt not found.' }
      if (existing.status === 'received') {
        return { already: true, receipt: existing, error: 'This delivery was already confirmed.' }
      }
      const outslip = outslips.find((row) => row.id === existing.outslipId)
      if (!outslip || outslip.status !== 'released') {
        return { error: 'This delivery cannot be confirmed until the outslip is released.' }
      }
      const next: DeliveryReceipt = {
        ...existing,
        status: 'received',
        receivedBy: confirmation.receivedBy,
        receivedAt: confirmation.receivedAt,
        receivedRemarks: confirmation.remarks,
      }
      setDeliveryReceipts((current) =>
        current.map((row) => (row.id === receiptId && row.status !== 'received' ? next : row)),
      )
      return { receipt: next }
    }

    function createGatePassFromOutslip(outslipId: string) {
      const outslip = outslips.find((row) => row.id === outslipId)
      if (!outslip) return { error: 'Outslip not found.' }
      if (outslip.status !== 'released') {
        return { error: 'Release the Outslip first before creating a Gate Pass.' }
      }

      const existing = gatePasses.find(
        (row) => row.outslipId === outslipId && row.status === 'approved',
      )
      if (existing) {
        return { error: `Gate Pass ${existing.id} already exists.` }
      }

      const gatePass = buildGatePassFromOutslip(outslip, gatePasses)
      if (gatePass.items.length === 0) {
        return { error: 'This Outslip has no released items to include on a Gate Pass.' }
      }

      setGatePasses((current) => [...current, gatePass])
      return { gatePass }
    }

    function updateGatePass(gatePass: GatePass) {
      const existing = gatePasses.find((row) => row.id === gatePass.id)
      if (!existing) return { error: 'Gate Pass not found.' }
      if (existing.status === 'cancelled') {
        return { error: 'Cancelled gate passes cannot be changed.' }
      }
      if (gatePass.status === 'cancelled') {
        const hasReceipt = deliveryReceipts.some(
          (row) => row.outslipId === existing.outslipId,
        )
        if (hasReceipt) {
          return {
            error: 'Cannot cancel a Gate Pass after a Delivery Receipt has been created.',
          }
        }
      }

      setGatePasses((current) =>
        current.map((row) => (row.id === gatePass.id ? gatePass : row)),
      )
      return { gatePass }
    }

    return {
      purchaseOrders,
      outslips,
      receivings,
      movements,
      deliveryReceipts,
      gatePasses,
      createOutslipFromPO,
      createReceivingFromPO,
      confirmReceiving,
      receiveScannedItem,
      saveOutslipDraft,
      updateOutslipStatus,
      createDeliveryReceiptFromOutslip,
      createGatePassAndDeliveryReceipt,
      updateDeliveryReceipt,
      updateDeliveryReceiptStatus,
      confirmDeliveryReceiptReceived,
      createGatePassFromOutslip,
      updateGatePass,
    }
  }, [purchaseOrders, outslips, receivings, movements, deliveryReceipts, gatePasses])

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
