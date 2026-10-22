import { DeleteQuotationDialog } from '@/components/quotations/DeleteQuotationDialog'
import { QuotationDetailModal } from '@/components/quotations/QuotationDetailModal'
import { QuotationDocument } from '@/components/quotations/QuotationDocument'
import { QuotationFiltersBar } from '@/components/quotations/QuotationFiltersBar'
import { QuotationFormModal } from '@/components/quotations/QuotationFormModal'
import { QuotationTable } from '@/components/quotations/QuotationTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { AddButton } from '@/components/ui/add-button'
import { Pagination } from '@/components/ui/pagination'
import { Toast } from '@/components/ui/toast'
import type {
  Quotation,
  QuotationFilters,
  QuotationSortField,
  QuotationStatus,
  SortDirection,
} from '@/data/quotationTypes'
import {
  calculateTotals,
  createEmptyQuotation,
  filterQuotations,
  generateQuotationNo,
  handleQuotationPrint,
  initialQuotations,
  loadQuotations,
  paginateItems,
  saveQuotations,
  sortQuotations,
} from '@/lib/quotations'
import {
  createPurchaseOrderFromQuotation,
  generatePoNo,
  initialPurchaseOrders,
  loadPurchaseOrders,
  savePurchaseOrders,
} from '@/lib/purchaseOrders'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const PAGE_SIZE = 10
const QUOTATIONS_LIST_PATH = '/quotations'
const QUOTATIONS_CREATE_PATH = '/quotations/create'

const defaultFilters: QuotationFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
}

function isCreatePath(pathname: string) {
  return pathname.replace(/\/$/, '') === QUOTATIONS_CREATE_PATH
}

export function QuotationsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const creating = isCreatePath(location.pathname)
  const wasCreatingRef = useRef(creating)

  const [quotations, setQuotations] = useState<Quotation[]>(() =>
    loadQuotations(initialQuotations),
  )
  const [filters, setFilters] = useState<QuotationFilters>(defaultFilters)
  const [sortField, setSortField] = useState<QuotationSortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Quotation | null>(null)
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null)
  const [printQuotation, setPrintQuotation] = useState<Quotation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    saveQuotations(quotations)
  }, [quotations])

  useEffect(() => {
    function refreshQuotations() {
      setQuotations((current) => {
        const next = loadQuotations(initialQuotations)
        return JSON.stringify(current) === JSON.stringify(next) ? current : next
      })
    }
    window.addEventListener('erp-quotations-updated', refreshQuotations)
    return () => window.removeEventListener('erp-quotations-updated', refreshQuotations)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (creating) {
      if (!wasCreatingRef.current) {
        setSelectedId(null)
        setDetailId(null)
        setEditorMode('create')
        setDraft((current) => current ?? createEmptyQuotation(generateQuotationNo(quotations)))
      }
      wasCreatingRef.current = true
      return
    }

    if (wasCreatingRef.current) {
      wasCreatingRef.current = false
      if (editorMode === 'create') {
        setDraft(null)
        setEditorMode(null)
      }
    }
  }, [creating, quotations, editorMode])

  const statusCounts = useMemo(() => {
    const counts: Record<QuotationStatus | 'all', number> = {
      all: quotations.length,
      draft: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    }
    quotations.forEach((quotation) => {
      counts[quotation.status] += 1
    })
    return counts
  }, [quotations])

  const filteredQuotations = useMemo(() => {
    const filtered = filterQuotations(quotations, filters)
    return sortQuotations(filtered, sortField, sortDirection)
  }, [quotations, filters, sortField, sortDirection])

  const pagination = useMemo(
    () => paginateItems(filteredQuotations, page, PAGE_SIZE),
    [filteredQuotations, page],
  )

  const detailQuotation = useMemo(
    () => (detailId ? quotations.find((row) => row.id === detailId) ?? null : null),
    [detailId, quotations],
  )

  useEffect(() => {
    setPage(1)
  }, [filters, sortField, sortDirection])

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [page, pagination.totalPages])

  function handleSort(field: QuotationSortField) {
    if (sortField === field) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortField(field)
    setSortDirection('asc')
  }

  function openCreate() {
    setSelectedId(null)
    setDetailId(null)
    setEditorMode('create')
    setDraft(createEmptyQuotation(generateQuotationNo(quotations)))
    navigate(QUOTATIONS_CREATE_PATH)
  }

  function closeEditor() {
    setDraft(null)
    setEditorMode(null)
    if (creating) {
      navigate(QUOTATIONS_LIST_PATH, { replace: true })
    }
  }

  function openEdit(quotation: Quotation) {
    setDetailId(null)
    setEditorMode('edit')
    setDraft(structuredClone(quotation))
    setSelectedId(quotation.id)
    if (creating) {
      navigate(QUOTATIONS_LIST_PATH, { replace: true })
    }
  }

  function openDetail(quotation: Quotation) {
    setSelectedId(quotation.id)
    setDetailId(quotation.id)
  }

  function closeDetail() {
    setDetailId(null)
  }

  function handleSave() {
    if (!draft) return
    if (!draft.customerId) {
      window.alert('Please select a customer before saving.')
      return
    }
    if (draft.items.length === 0) {
      window.alert('Please add at least one item before saving.')
      return
    }

    const totals = calculateTotals(draft.items, draft.discount, draft.tax)
    const exists = quotations.some((row) => row.id === draft.id)
    const next: Quotation = {
      ...draft,
      ...totals,
      status: exists ? draft.status : draft.status === 'draft' ? 'pending' : draft.status,
    }

    setQuotations((current) => {
      const alreadyExists = current.some((row) => row.id === next.id)
      if (alreadyExists) {
        return current.map((row) => (row.id === next.id ? next : row))
      }
      return [...current, next]
    })

    setSelectedId(next.id)
    setDraft(null)
    setEditorMode(null)
    setToast(
      exists ? `Quotation ${next.quotationNo} updated.` : `Quotation ${next.quotationNo} created.`,
    )
    navigate(QUOTATIONS_LIST_PATH, { replace: creating })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const deletedNo = deleteTarget.quotationNo
    setQuotations((current) => current.filter((row) => row.id !== deleteTarget.id))
    if (selectedId === deleteTarget.id) {
      setSelectedId(null)
      setDraft(null)
      setEditorMode(null)
    }
    if (detailId === deleteTarget.id) {
      setDetailId(null)
    }
    setDeleteTarget(null)
    setToast(`Quotation ${deletedNo} deleted.`)
  }

  function handlePrint(quotation: Quotation) {
    setPrintQuotation(quotation)
    requestAnimationFrame(() => handleQuotationPrint())
  }

  function handleConvertToPo(
    quotation: Quotation,
    supplier: { id: string; name: string; address?: string; phone?: string },
  ) {
    setDetailId(null)
    const existing = loadPurchaseOrders(initialPurchaseOrders)
    const purchaseOrder = createPurchaseOrderFromQuotation(
      generatePoNo(existing),
      quotation,
      supplier,
    )
    savePurchaseOrders([...existing, purchaseOrder])
    setToast(`Purchase order ${purchaseOrder.poNo} created from ${quotation.quotationNo}.`)
    navigate('/purchase-orders', {
      state: { highlightId: purchaseOrder.id },
    })
  }

  function applyStatusFields(
    row: Quotation,
    status: QuotationStatus,
  ): Quotation {
    return {
      ...row,
      status,
      approvedBy:
        status === 'approved'
          ? row.approvedBy || 'WEB ADMINISTRATOR'
          : status === 'rejected'
            ? ''
            : row.approvedBy,
      approvedByUserId: status === 'rejected' ? '' : row.approvedByUserId,
    }
  }

  function handleStatusChange(quotation: Quotation, status: QuotationStatus) {
    setQuotations((current) =>
      current.map((row) =>
        row.id === quotation.id ? applyStatusFields(row, status) : row,
      ),
    )
    setSelectedId(quotation.id)
    setDraft((current) =>
      current && current.id === quotation.id
        ? applyStatusFields(current, status)
        : current,
    )
    const label =
      status === 'approved'
        ? 'approved'
        : status === 'rejected'
          ? 'rejected'
          : status === 'pending'
            ? 'set to pending'
            : status
    setToast(`Quotation ${quotation.quotationNo} ${label}.`)
  }

  return (
    <div>
      <div className="no-print">
        {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
        <PageHeader
          title="Quotations"
          action={<AddButton label="Add Quotation" onClick={openCreate} />}
        />

        <QuotationFiltersBar
          filters={filters}
          counts={statusCounts}
          onChange={setFilters}
        />

        <QuotationTable
          quotations={pagination.items}
          selectedId={selectedId}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onSelect={openDetail}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onPrint={handlePrint}
          onApprove={(quotation) => handleStatusChange(quotation, 'approved')}
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

        <DeleteQuotationDialog
          quotation={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />

        {detailQuotation ? (
          <QuotationDetailModal
            quotation={detailQuotation}
            onClose={closeDetail}
            onStatusChange={handleStatusChange}
            onConvertToPo={handleConvertToPo}
          />
        ) : null}

        {draft && editorMode ? (
          <QuotationFormModal
            open
            title={editorMode === 'create' ? 'New Quotation' : 'Edit Quotation'}
            quotation={draft}
            onChange={setDraft}
            onSave={handleSave}
            onClose={closeEditor}
          />
        ) : null}
      </div>

      <div className="quotation-print-root">
        {printQuotation ? <QuotationDocument quotation={printQuotation} /> : null}
      </div>
    </div>
  )
}
