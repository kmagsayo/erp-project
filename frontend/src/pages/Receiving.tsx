import { ReceivingDetailModal } from '@/components/receiving/ReceivingDetailModal'
import { ReceivingDocument } from '@/components/receiving/ReceivingDocument'
import { ReceivingFiltersBar } from '@/components/receiving/ReceivingFiltersBar'
import { ReceivingTable } from '@/components/receiving/ReceivingTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/pagination'
import { Toast } from '@/components/ui/toast'
import { useErp } from '@/data/erpStore'
import type { Receiving } from '@/data/erpTypes'
import {
  clearReceivingFlash,
  filterReceivings,
  handleReceivingPrint,
  paginateItems,
  readReceivingFlash,
  sortReceivingsByDateDesc,
  type ReceivingFilters,
} from '@/lib/receivings'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 10

const defaultFilters: ReceivingFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
}

export function ReceivingPage() {
  const {
    receivings,
    confirmReceiving,
  } = useErp()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const idQuery = params.get('id')
  const initialFlash = readReceivingFlash()
  const initialReceivingId = idQuery ?? initialFlash?.highlightId ?? null

  const [detailId, setDetailId] = useState<string | null>(initialReceivingId)
  const [highlightedId, setHighlightedId] = useState<string | null>(
    () => initialReceivingId,
  )
  const [toast, setToast] = useState<string | null>(() => initialFlash?.toast ?? null)
  const [detailMessage, setDetailMessage] = useState<string | null>(null)
  const [filters, setFilters] = useState<ReceivingFilters>(() =>
    initialFlash?.highlightId ? { ...defaultFilters, status: 'pending' } : defaultFilters,
  )
  const [page, setPage] = useState(1)
  const [printReceiving, setPrintReceiving] = useState<Receiving | null>(null)

  const filteredReceivings = useMemo(
    () => sortReceivingsByDateDesc(filterReceivings(receivings, filters)),
    [receivings, filters],
  )

  const pagination = useMemo(
    () => paginateItems(filteredReceivings, page, PAGE_SIZE),
    [filteredReceivings, page],
  )

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [page, pagination.totalPages])

  useEffect(() => {
    clearReceivingFlash()
  }, [])

  useEffect(() => {
    if (!idQuery) return
    setDetailId(idQuery)
    setHighlightedId(idQuery)
  }, [idQuery])

  const selected = receivings.find((row) => row.id === detailId) ?? null

  function openReceiving(receiving: Receiving) {
    setDetailId(receiving.id)
    setDetailMessage(null)
    setHighlightedId(receiving.id)
  }

  function closeDetail() {
    setDetailId(null)
    setDetailMessage(null)
    if (idQuery) {
      navigate('/inventory/receiving', { replace: true })
    }
  }

  function handleConfirm() {
    if (!selected) return
    const result = confirmReceiving(selected.id)
    if (result.error) {
      setDetailMessage(result.error)
      return
    }
    setDetailMessage(null)
  }

  function openCreateOutslip() {
    if (!selected) return
    navigate(`/outslips?receiving=${encodeURIComponent(selected.id)}`)
  }

  function handlePrint(receiving: Receiving) {
    setPrintReceiving(receiving)
    requestAnimationFrame(() => handleReceivingPrint())
  }

  return (
    <div>
      <div className="no-print">
        {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}

        <PageHeader
          breadcrumb="Transaction / Receiving"
          title="Receiving"
          description="Incoming goods from supplier POs. Posts to inventory (in)."
        />

        <ReceivingFiltersBar filters={filters} onChange={setFilters} />

        <ReceivingTable
          receivings={pagination.items}
          highlightedId={highlightedId}
          onSelect={openReceiving}
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

        {selected ? (
          <ReceivingDetailModal
            receiving={selected}
            message={detailMessage}
            onClose={closeDetail}
            onConfirm={handleConfirm}
            onCreateOutslip={openCreateOutslip}
          />
        ) : null}
      </div>

      <div className="receiving-print-root">
        {printReceiving ? <ReceivingDocument receiving={printReceiving} /> : null}
      </div>
    </div>
  )
}
