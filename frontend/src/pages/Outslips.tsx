import { CreateOutslipFromPoDialog } from '@/components/outslips/CreateOutslipFromPoDialog'
import { CreateOutslipFromReceivingDialog } from '@/components/outslips/CreateOutslipFromReceivingDialog'
import { DispatchConfirmDialog } from '@/components/outslips/DispatchConfirmDialog'
import { OutslipDetailModal } from '@/components/outslips/OutslipDetailModal'
import { OutslipDocument } from '@/components/outslips/OutslipDocument'
import { OutslipFiltersBar } from '@/components/outslips/OutslipFiltersBar'
import { OutslipTable } from '@/components/outslips/OutslipTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/pagination'
import { Toast } from '@/components/ui/toast'
import { useErp } from '@/data/erpStore'
import type { Outslip, OutslipItem, OutslipStatus } from '@/data/erpTypes'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import {
  buildOutslipFromPo,
  calculateReleasedForPoItem,
  filterOutslips,
  handleOutslipPrint,
  paginateItems,
  recalculateOutslipTotals,
  sortOutslipsByDateDesc,
  type OutslipFilters,
  type OutslipListFilterStatus,
  validateOutslipQuantities,
} from '@/lib/outslips'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 10

const defaultFilters: OutslipFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
}

export function OutslipsPage() {
  const {
    outslips,
    purchaseOrders,
    receivings,
    deliveryReceipts,
    gatePasses,
    saveOutslipDraft,
    updateOutslipStatus,
    createDeliveryReceiptFromOutslip,
    createOutslipFromPO,
  } = useErp()
  const customers = useSetupCustomers()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const receivingQuery = params.get('receiving')
  const [selectedId, setSelectedId] = useState<string | null>(params.get('id'))
  const [draft, setDraft] = useState<Outslip | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createPoId, setCreatePoId] = useState('')
  const [createFromReceivingOpen, setCreateFromReceivingOpen] = useState(
    Boolean(receivingQuery),
  )
  const [outslipReceivingId, setOutslipReceivingId] = useState(receivingQuery ?? '')
  const [outslipCustomerId, setOutslipCustomerId] = useState('')
  const [outslipCreateMessage, setOutslipCreateMessage] = useState<string | null>(null)
  const [dispatchConfirmOpen, setDispatchConfirmOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState<OutslipFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [printOutslip, setPrintOutslip] = useState<Outslip | null>(null)
  const selected = outslips.find((row) => row.id === selectedId)

  useEffect(() => {
    const fromUrl = params.get('id')
    if (fromUrl) {
      setSelectedId(fromUrl)
      setDraft(null)
    }
  }, [params])

  useEffect(() => {
    if (!receivingQuery) return
    setOutslipReceivingId(receivingQuery)
    setCreateFromReceivingOpen(true)
    setOutslipCreateMessage(null)
  }, [receivingQuery])

  const approvedPurchaseOrders = useMemo(
    () => purchaseOrders.filter((row) => row.status === 'approved'),
    [purchaseOrders],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<OutslipListFilterStatus, number> = {
      all: outslips.length,
      pending: 0,
      approved: 0,
      released: 0,
    }
    outslips.forEach((row) => {
      if (row.status === 'pending' || row.status === 'approved' || row.status === 'released') {
        counts[row.status] += 1
      }
    })
    return counts
  }, [outslips])

  const filteredOutslips = useMemo(
    () => sortOutslipsByDateDesc(filterOutslips(outslips, filters)),
    [outslips, filters],
  )

  const pagination = useMemo(
    () => paginateItems(filteredOutslips, page, PAGE_SIZE),
    [filteredOutslips, page],
  )

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [page, pagination.totalPages])

  function getAvailableForItem(outslip: Outslip, item: OutslipItem) {
    const previouslyReleased = calculateReleasedForPoItem(
      outslips,
      outslip.poRecordId,
      item.itemCode,
      { excludeOutslipId: outslip.id },
    )
    return Math.max(0, item.poQuantity - previouslyReleased)
  }

  const closeDetail = useCallback(() => {
    setSelectedId(null)
    setDraft(null)
    setMessage(null)
    if (params.get('id')) {
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  function openDetail(outslip: Outslip) {
    setSelectedId(outslip.id)
    setDraft(null)
    setMessage(null)
    setParams({ id: outslip.id }, { replace: true })
  }

  function closeCreate() {
    setCreateOpen(false)
    setMessage(null)
  }

  function handleStartCreateFromPo() {
    if (!createPoId) {
      setMessage('Select an approved PO first.')
      return
    }
    const po = approvedPurchaseOrders.find((row) => row.id === createPoId)
    if (!po) {
      setMessage('Selected Purchase Order is not available.')
      return
    }
    const next = buildOutslipFromPo(po, outslips)
    const validation = validateOutslipQuantities(next, outslips)
    if (!validation.valid) {
      setMessage('No available quantity left from this PO for a new outslip.')
      return
    }
    setCreateOpen(false)
    setSelectedId(null)
    setDraft(next)
    setMessage(null)
    if (params.get('id')) {
      setParams({}, { replace: true })
    }
  }

  function handleSaveDraft() {
    if (!draft) return
    const normalized = recalculateOutslipTotals(draft)
    const validation = validateOutslipQuantities(normalized, outslips)
    if (!validation.valid) {
      setMessage(validation.errors[0])
      return
    }
    const result = saveOutslipDraft(normalized)
    if (result.error) {
      setMessage(result.error)
      return
    }
    if (result.outslip) {
      setSelectedId(result.outslip.id)
      setDraft(null)
      setMessage(`Outslip ${result.outslip.id} saved.`)
      setParams({ id: result.outslip.id }, { replace: true })
    }
  }

  function closeCreateFromReceiving() {
    setCreateFromReceivingOpen(false)
    setOutslipCreateMessage(null)
    if (params.get('receiving')) {
      const next = new URLSearchParams(params)
      next.delete('receiving')
      setParams(next, { replace: true })
    }
  }

  function handleCreateFromReceiving() {
    const receiving = receivings.find((row) => row.id === outslipReceivingId) ?? null
    if (!receiving) {
      setOutslipCreateMessage('Select a completed receiving first.')
      return
    }
    if (receiving.status !== 'completed') {
      setOutslipCreateMessage('Only a completed Receiving can create an Outslip.')
      return
    }

    const customer = customers.find((row) => row.id === outslipCustomerId)
    if (!customer) {
      setOutslipCreateMessage('Select a customer first.')
      return
    }

    const po =
      purchaseOrders.find((row) => row.id === receiving.poRecordId) ??
      purchaseOrders.find((row) => row.poNo === receiving.poId)
    if (!po) {
      setOutslipCreateMessage('Linked Purchase Order was not found.')
      return
    }

    const customerAddress = customer.address?.trim() || undefined
    const result = createOutslipFromPO(po.id, {
      customer: customer.name,
      receivingId: receiving.id,
      location: customerAddress,
      destination: customerAddress,
    })
    if (result.error || !result.outslip) {
      setOutslipCreateMessage(result.error ?? 'Could not create outslip.')
      return
    }

    setCreateFromReceivingOpen(false)
    setOutslipCreateMessage(null)
    setSelectedId(result.outslip.id)
    setDraft(null)
    setToast(`Outslip ${result.outslip.id} created.`)
    setParams({ id: result.outslip.id }, { replace: true })
  }

  function updateStatus(status: OutslipStatus) {
    if (!selected) return
    const result = updateOutslipStatus(selected.id, status)
    if (result.error) {
      setMessage(result.error)
      return
    }
    setMessage(null)
    if (status === 'approved') {
      setToast('Outslip approved.')
    }
    if (status === 'released') {
      setToast('Outslip marked for dispatch. Create a Gate Pass next.')
      setDispatchConfirmOpen(false)
    }
  }

  function updateDraftField<K extends keyof Outslip>(key: K, value: Outslip[K]) {
    setDraft((current) =>
      current ? recalculateOutslipTotals({ ...current, [key]: value }) : current,
    )
  }

  function updateDraftItem(index: number, patch: Partial<OutslipItem>) {
    setDraft((current) => {
      if (!current) return current
      const item = current.items[index]
      if (!item) return current

      let releasedQuantity = patch.releasedQuantity ?? item.releasedQuantity
      releasedQuantity = Math.max(0, Number(releasedQuantity) || 0)
      const maxAvailable = getAvailableForItem(current, item)
      if (releasedQuantity > maxAvailable) {
        releasedQuantity = maxAvailable
        setMessage(
          `Released qty for ${item.itemCode} capped at available PO qty (${maxAvailable}).`,
        )
      }
      const remainingQuantity = Math.max(0, item.poQuantity - releasedQuantity)

      const items = current.items.map((row, itemIndex) =>
        itemIndex === index
          ? {
              ...row,
              ...patch,
              releasedQuantity,
              remainingQuantity,
            }
          : row,
      )

      return recalculateOutslipTotals({ ...current, items })
    })
  }

  function handlePrint(outslip: Outslip) {
    const previousTitle = document.title
    document.title = `${outslip.id}.pdf`
    setPrintOutslip(outslip)
    const restoreTitle = () => {
      document.title = previousTitle
      window.removeEventListener('afterprint', restoreTitle)
    }
    window.addEventListener('afterprint', restoreTitle)
    requestAnimationFrame(() => handleOutslipPrint())
  }

  const activeOutslip = draft ?? selected ?? null
  const createMessage = createOpen ? message : null
  const detailMessage = !createOpen ? message : null
  const existingDeliveryReceiptId = activeOutslip?.id
    ? (deliveryReceipts.find((row) => row.outslipId === activeOutslip.id)?.id ?? null)
    : null
  const existingGatePassId = activeOutslip?.id
    ? (gatePasses.find(
        (row) => row.outslipId === activeOutslip.id && row.status === 'approved',
      )?.id ?? null)
    : null

  function handleCreateDeliveryReceipt() {
    if (!activeOutslip?.id) return
    if (existingDeliveryReceiptId) {
      navigate(`/delivery-receipts?id=${existingDeliveryReceiptId}`)
      return
    }

    const result = createDeliveryReceiptFromOutslip(activeOutslip.id)
    if (result.error) {
      setMessage(result.error)
      return
    }
    if (result.receipt) {
      navigate('/delivery-receipts', {
        state: {
          toast: 'Delivery Receipt created successfully.',
          highlightId: result.receipt.id,
        },
      })
    }
  }

  function handleCreateGatePass() {
    if (!activeOutslip?.id) return
    if (existingGatePassId) {
      navigate(`/gate-passes?id=${existingGatePassId}`)
      return
    }
    navigate(`/gate-passes?from=${encodeURIComponent(activeOutslip.id)}`)
  }

  return (
    <div>
      <div className="no-print">
        {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
        <PageHeader
          breadcrumb="Transaction / Outslip"
          title="Outslip"
          description="Outgoing stock to customers. Posts inventory OUT on dispatch."
        />

        <OutslipFiltersBar filters={filters} counts={statusCounts} onChange={setFilters} />

        <OutslipTable
          outslips={pagination.items}
          selectedId={selectedId}
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

        <CreateOutslipFromPoDialog
          open={createOpen}
          purchaseOrders={approvedPurchaseOrders}
          selectedPoId={createPoId}
          message={createMessage}
          onSelectedPoIdChange={setCreatePoId}
          onConfirm={handleStartCreateFromPo}
          onClose={closeCreate}
        />

        <CreateOutslipFromReceivingDialog
          open={createFromReceivingOpen}
          receivings={receivings}
          selectedReceivingId={outslipReceivingId}
          selectedCustomerId={outslipCustomerId}
          message={outslipCreateMessage}
          onSelectedReceivingIdChange={(receivingId) => {
            setOutslipReceivingId(receivingId)
            setOutslipCreateMessage(null)
          }}
          onSelectedCustomerIdChange={(customerId) => {
            setOutslipCustomerId(customerId)
            setOutslipCreateMessage(null)
          }}
          onConfirm={handleCreateFromReceiving}
          onClose={closeCreateFromReceiving}
        />

        <DispatchConfirmDialog
          open={dispatchConfirmOpen}
          onCancel={() => setDispatchConfirmOpen(false)}
          onConfirm={() => updateStatus('released')}
        />

        {activeOutslip && !createFromReceivingOpen ? (
          <OutslipDetailModal
            outslip={activeOutslip}
            isEditing={Boolean(draft)}
            message={detailMessage}
            existingDeliveryReceiptId={existingDeliveryReceiptId}
            existingGatePassId={existingGatePassId}
            getAvailableForItem={getAvailableForItem}
            onClose={closeDetail}
            onCancelEdit={() => {
              setDraft(null)
              setMessage(null)
              if (!selectedId) {
                closeDetail()
              }
            }}
            onSaveDraft={handleSaveDraft}
            onSubmitForApproval={() => updateStatus('pending')}
            onApprove={() => updateStatus('approved')}
            onRelease={() => setDispatchConfirmOpen(true)}
            onCancelOutslip={() => updateStatus('cancelled')}
            onCreateDeliveryReceipt={handleCreateDeliveryReceipt}
            onViewDeliveryReceipt={(receiptId) =>
              navigate(`/delivery-receipts?id=${receiptId}`)
            }
            onCreateGatePass={handleCreateGatePass}
            onViewGatePass={(gatePassId) => navigate(`/gate-passes?id=${gatePassId}`)}
            onUpdateField={updateDraftField}
            onUpdateItem={updateDraftItem}
          />
        ) : null}
      </div>

      <div className="outslip-print-root">
        {printOutslip ? <OutslipDocument outslip={printOutslip} /> : null}
      </div>
    </div>
  )
}
