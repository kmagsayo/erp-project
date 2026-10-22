import { DeletePurchaseOrderDialog } from '@/components/purchase-orders/DeletePurchaseOrderDialog'
import { PurchaseOrderDetailModal } from '@/components/purchase-orders/PurchaseOrderDetailModal'
import { PurchaseOrderDocument } from '@/components/purchase-orders/PurchaseOrderDocument'
import { PurchaseOrderFiltersBar } from '@/components/purchase-orders/PurchaseOrderFiltersBar'
import { PurchaseOrderForm } from '@/components/purchase-orders/PurchaseOrderForm'
import { PurchaseOrderTable } from '@/components/purchase-orders/PurchaseOrderTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { Toast } from '@/components/ui/toast'
import { useErp } from '@/data/erpStore'
import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderSortField,
  PurchaseOrderStatus,
  SortDirection,
} from '@/data/purchaseOrderTypes'
import type { Quotation } from '@/data/quotationTypes'
import {
  calculateOrderTotal,
  createEmptyPurchaseOrder,
  createPurchaseOrderFromQuotation,
  filterPurchaseOrders,
  generatePoNo,
  handlePurchaseOrderPrint,
  initialPurchaseOrders,
  loadPurchaseOrders,
  paginateItems,
  savePurchaseOrders,
  sortPurchaseOrders,
} from '@/lib/purchaseOrders'
import { receivingCreatedToast, setReceivingFlash } from '@/lib/receivings'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type PoLocationState = {
  highlightId?: string
  fromQuotation?: Quotation
  supplier?: {
    id: string
    name: string
    address?: string
    phone?: string
  }
}

type Screen = 'list' | 'form' | 'preview'

const PAGE_SIZE = 10
const PO_LIST_PATH = '/purchase-orders'
const PO_CREATE_PATH = '/purchase-orders/create'

const defaultFilters: PurchaseOrderFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
}

function isCreatePath(pathname: string) {
  return pathname.replace(/\/$/, '') === PO_CREATE_PATH
}

export function PurchaseOrdersPage() {
  const { createOutslipFromPO, createReceivingFromPO } = useErp()
  const navigate = useNavigate()
  const location = useLocation()
  const creating = isCreatePath(location.pathname)
  const wasCreatingRef = useRef(creating)
  const locationState = (location.state as PoLocationState | null) ?? null
  const fromQuotation = locationState?.fromQuotation
  const fromSupplier = locationState?.supplier
  const highlightId = locationState?.highlightId

  const [orders, setOrders] = useState<PurchaseOrder[]>(() =>
    loadPurchaseOrders(initialPurchaseOrders),
  )
  const [screen, setScreen] = useState<Screen>(() => (creating ? 'form' : 'list'))
  const [filters, setFilters] = useState<PurchaseOrderFilters>(defaultFilters)
  const [sortField, setSortField] = useState<PurchaseOrderSortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(highlightId ?? null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [draft, setDraft] = useState<PurchaseOrder | null>(() => {
    if (!creating || fromQuotation) return null
    return createEmptyPurchaseOrder(generatePoNo(loadPurchaseOrders(initialPurchaseOrders)))
  })
  const [printOrder, setPrintOrder] = useState<PurchaseOrder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null)
  const [outslipMessage, setOutslipMessage] = useState<string | null>(null)
  const [detailMessage, setDetailMessage] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const legacyConvertHandledRef = useRef(false)

  useEffect(() => {
    savePurchaseOrders(orders, { emitEvent: false })
  }, [orders])


  useEffect(() => {
    function refreshOrders() {
      setOrders(loadPurchaseOrders(initialPurchaseOrders))
    }
    window.addEventListener('erp-purchase-orders-updated', refreshOrders)
    return () => window.removeEventListener('erp-purchase-orders-updated', refreshOrders)
  }, [])

  useEffect(() => {
    if (!highlightId) return
    setSelectedId(highlightId)
    setDetailId(highlightId)
    setScreen('list')
    setDraft(null)
    setOutslipMessage(null)
    setDetailMessage(null)
    navigate(PO_LIST_PATH, { replace: true, state: {} })
  }, [highlightId, navigate])

  // Legacy: quotation conversion previously opened /create — auto-save and return to list.
  useEffect(() => {
    if (!creating || !fromQuotation || legacyConvertHandledRef.current) return
    legacyConvertHandledRef.current = true
    const purchaseOrder = createPurchaseOrderFromQuotation(
      generatePoNo(orders),
      fromQuotation,
      fromSupplier,
    )
    setOrders((current) => [...current, purchaseOrder])
    setSelectedId(purchaseOrder.id)
    setDraft(null)
    setOutslipMessage(null)
    setScreen('list')
    navigate(PO_LIST_PATH, { replace: true, state: {} })
  }, [creating, fromQuotation, fromSupplier, orders, navigate])

  useEffect(() => {
    if (creating) {
      if (fromQuotation) {
        wasCreatingRef.current = true
        return
      }
      const enteredCreate = !wasCreatingRef.current
      if (enteredCreate) {
        setSelectedId(null)
        setDetailId(null)
        setOutslipMessage(null)
        setDetailMessage(null)
        setScreen('form')
        setDraft((current) => current ?? createEmptyPurchaseOrder(generatePoNo(orders)))
      }
      wasCreatingRef.current = true
      return
    }

    if (wasCreatingRef.current) {
      wasCreatingRef.current = false
      setDraft(null)
      setOutslipMessage(null)
      setDetailMessage(null)
      setScreen('list')
    }
  }, [creating, orders, fromQuotation])

  const statusCounts = useMemo(() => {
    const counts = {
      all: orders.length,
      approved: 0,
      completed: 0,
    }
    orders.forEach((order) => {
      counts[order.status] += 1
    })
    return counts
  }, [orders])

  const filteredOrders = useMemo(() => {
    const filtered = filterPurchaseOrders(orders, filters)
    return sortPurchaseOrders(filtered, sortField, sortDirection)
  }, [orders, filters, sortField, sortDirection])

  const pagination = useMemo(
    () => paginateItems(filteredOrders, page, PAGE_SIZE),
    [filteredOrders, page],
  )

  const detailOrder = useMemo(
    () => (detailId ? orders.find((row) => row.id === detailId) ?? null : null),
    [detailId, orders],
  )

  useEffect(() => {
    setPage(1)
  }, [filters, sortField, sortDirection])

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [page, pagination.totalPages])

  function handleSort(field: PurchaseOrderSortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(field)
    setSortDirection('asc')
  }

  function openDetail(order: PurchaseOrder) {
    setSelectedId(order.id)
    setDetailMessage(null)
    setDetailId(order.id)
  }

  function closeDetail() {
    setDetailId(null)
    setDetailMessage(null)
  }

  function returnToList() {
    setDraft(null)
    setSelectedId(null)
    setDetailId(null)
    setOutslipMessage(null)
    setDetailMessage(null)
    setScreen('list')
    if (creating) {
      navigate(PO_LIST_PATH, { replace: true })
    }
  }

  function handleSave() {
    if (!draft) return
    if (!draft.supplier.trim()) {
      window.alert('Please select a supplier before saving.')
      return
    }
    if (!draft.customerId) {
      window.alert('Please select a customer before saving.')
      return
    }
    if (draft.items.length === 0) {
      window.alert('Please add at least one line item before saving.')
      return
    }

    const next: PurchaseOrder = {
      ...draft,
      amount: calculateOrderTotal(draft.items),
      quotationRef: draft.quotationRef?.trim() ? draft.quotationRef : undefined,
    }

    setOrders((current) => {
      const exists = current.some((row) => row.id === next.id)
      if (exists) {
        return current.map((row) => (row.id === next.id ? next : row))
      }
      return [...current, next]
    })

    setSelectedId(next.id)
    setDraft(null)
    setOutslipMessage(null)
    setScreen('list')
    navigate(PO_LIST_PATH, { replace: creating })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setOrders((current) => current.filter((row) => row.id !== deleteTarget.id))
    if (selectedId === deleteTarget.id) {
      setSelectedId(null)
      setDraft(null)
    }
    if (detailId === deleteTarget.id) {
      setDetailId(null)
      setDetailMessage(null)
    }
    setDeleteTarget(null)
    setScreen('list')
  }

  function handlePrint(order: PurchaseOrder) {
    setPrintOrder(order)
    requestAnimationFrame(() => handlePurchaseOrderPrint())
  }

  function handleStatusChange(order: PurchaseOrder, status: PurchaseOrderStatus) {
    setOrders((current) =>
      current.map((row) => (row.id === order.id ? { ...row, status } : row)),
    )
    setSelectedId(order.id)
    setDraft((current) =>
      current && current.id === order.id ? { ...current, status } : current,
    )
  }

  function handleCreateOutslip() {
    if (!draft) return
    const result = createOutslipFromPO(draft.id)
    if (result.error || !result.outslip) {
      setOutslipMessage(result.error ?? 'Could not create outslip.')
      return
    }

    setOrders((current) =>
      current.map((row) =>
        row.id === draft.id ? { ...row, outslipId: result.outslip!.id } : row,
      ),
    )
    setDraft((current) =>
      current ? { ...current, outslipId: result.outslip!.id } : current,
    )
    setOutslipMessage(`Outslip ${result.outslip.id} created successfully.`)
  }

  function openOrCreateReceiving(order: PurchaseOrder) {
    const result = createReceivingFromPO(order.id)
    if (result.error || !result.receiving) {
      setDetailId(order.id)
      setDetailMessage(result.error ?? 'Could not create receiving.')
      return
    }

    setOrders((current) =>
      current.map((row) =>
        row.id === order.id
          ? {
              ...row,
              receivingId: result.receiving!.id,
              status: result.receiving!.status === 'completed' ? 'completed' : row.status,
            }
          : row,
      ),
    )
    setDraft((current) =>
      current && current.id === order.id
        ? {
            ...current,
            receivingId: result.receiving!.id,
            status:
              result.receiving!.status === 'completed' ? 'completed' : current.status,
          }
        : current,
    )

    setDetailId(null)
    setDetailMessage(null)
    goToReceiving(result.receiving.id, {
      toast: order.receivingId ? undefined : receivingCreatedToast(result.receiving.id),
    })
  }

  function goToReceiving(receivingId: string, options?: { toast?: string }) {
    setReceivingFlash({
      toast: options?.toast,
      highlightId: receivingId,
    })
    navigate(`/inventory/receiving?id=${encodeURIComponent(receivingId)}`)
  }

  function cancelEditor() {
    returnToList()
  }

  if (screen === 'preview' && draft) {
    return (
      <div>
        <div className="no-print">
          <PageHeader
            title="Purchase Order Preview"
            description={`Preview ${draft.poNo} before printing.`}
            action={
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={returnToList}>
                  Back to List
                </Button>
                <Button type="button" onClick={() => handlePrint(draft)}>
                  Print
                </Button>
              </div>
            }
          />
          <div className="rounded-lg border border-border bg-surface p-4">
            <PurchaseOrderDocument order={draft} />
          </div>
        </div>
        <div className="po-print-root">
          <PurchaseOrderDocument order={draft} />
        </div>
      </div>
    )
  }

  if ((creating || screen === 'form') && draft) {
    return (
      <div>
        <div className="no-print">
          {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
          <PageHeader title="Purchase Orders" />
          <PurchaseOrderForm
            order={draft}
            onChange={setDraft}
            onSave={handleSave}
            onPrint={() => handlePrint(draft)}
            onCancel={cancelEditor}
            onDelete={
              !creating ? () => setDeleteTarget(draft) : undefined
            }
            onCreateOutslip={
              !creating && draft.status === 'approved' && !draft.outslipId
                ? handleCreateOutslip
                : undefined
            }
            outslipMessage={outslipMessage}
            onStatusChange={handleStatusChange}
          />
          {draft.receivingId && !creating ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => goToReceiving(draft.receivingId!)}
              >
                Receive Items
              </Button>
            </div>
          ) : null}
          {!creating && draft.status === 'approved' && !draft.receivingId ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={() => openOrCreateReceiving(draft)}>
                Receive Items
              </Button>
            </div>
          ) : null}
          {draft.outslipId && !creating ? (
            <div className="mt-4">
              <Button type="button" onClick={() => navigate(`/outslips?id=${draft.outslipId}`)}>
                Open Outslip
              </Button>
            </div>
          ) : null}
          <DeletePurchaseOrderDialog
            order={deleteTarget}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDelete}
          />
        </div>
        <div className="po-print-root">
          <PurchaseOrderDocument order={draft} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="no-print">
        {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
        <PageHeader title="Purchase Orders" />

        <PurchaseOrderFiltersBar
          filters={filters}
          counts={statusCounts}
          onChange={setFilters}
        />

        <PurchaseOrderTable
          orders={pagination.items}
          selectedId={selectedId}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onSelect={openDetail}
          onPrint={handlePrint}
        />

        {pagination.totalPages > 1 ? (
          <div className="mt-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        ) : null}

        <DeletePurchaseOrderDialog
          order={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />

        {detailOrder ? (
          <PurchaseOrderDetailModal
            order={detailOrder}
            message={detailMessage}
            onClose={closeDetail}
            onOpenReceiving={openOrCreateReceiving}
          />
        ) : null}
      </div>

      <div className="po-print-root">
        {printOrder ? <PurchaseOrderDocument order={printOrder} /> : null}
      </div>
    </div>
  )
}
