import { GatePassDetailModal } from '@/components/gate-passes/GatePassDetailModal'
import { GatePassDocument } from '@/components/gate-passes/GatePassDocument'
import { GatePassFiltersBar } from '@/components/gate-passes/GatePassFiltersBar'
import { GatePassTable } from '@/components/gate-passes/GatePassTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/ui/pagination'
import { Toast } from '@/components/ui/toast'
import { useErp } from '@/data/erpStore'
import type { GatePass } from '@/data/erpTypes'
import { loadCatalogItems } from '@/hooks/useCatalogItems'
import {
  countGatePassStatuses,
  filterGatePasses,
  handleGatePassPrint,
  paginateItems,
  sortGatePassesByDateDesc,
  type GatePassFilters,
} from '@/lib/gatePasses'
import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const PAGE_SIZE = 10

const defaultFilters: GatePassFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
}

export function GatePassesPage() {
  const { gatePasses, deliveryReceipts, createGatePassFromOutslip, updateGatePass, createDeliveryReceiptFromOutslip } = useErp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const createdFrom = useRef<string | null>(null)

  const [filters, setFilters] = useState<GatePassFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(params.get('id'))
  const [toast, setToast] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [printTarget, setPrintTarget] = useState<GatePass | null>(null)

  const statusCounts = useMemo(() => countGatePassStatuses(gatePasses), [gatePasses])

  const filteredGatePasses = useMemo(
    () => sortGatePassesByDateDesc(filterGatePasses(gatePasses, filters)),
    [gatePasses, filters],
  )

  const pagination = useMemo(
    () => paginateItems(filteredGatePasses, page, PAGE_SIZE),
    [filteredGatePasses, page],
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
    const state = location.state as { toast?: string; highlightId?: string } | null
    if (!state?.toast && !state?.highlightId) return
    if (state.toast) setToast(state.toast)
    if (state.highlightId) setSelectedId(state.highlightId)
    navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  useEffect(() => {
    const fromOutslip = params.get('from')
    const byId = params.get('id')
    if (byId) {
      setSelectedId(byId)
      navigate('/gate-passes', { replace: true })
      return
    }
    if (!fromOutslip) return

    const existing = gatePasses.find(
      (row) => row.outslipId === fromOutslip && row.status === 'approved',
    )
    if (existing) {
      setSelectedId(existing.id)
      navigate('/gate-passes', { replace: true })
      return
    }
    if (createdFrom.current === fromOutslip) return
    createdFrom.current = fromOutslip

    const result = createGatePassFromOutslip(fromOutslip)
    if (result.error) {
      setMessage(result.error)
      createdFrom.current = null
      return
    }
    if (result.gatePass) {
      setSelectedId(result.gatePass.id)
      setToast(`Gate Pass ${result.gatePass.id} created.`)
      navigate('/gate-passes', { replace: true })
    }
  }, [params, gatePasses, createGatePassFromOutslip, navigate])

  const selected = gatePasses.find((row) => row.id === selectedId) ?? null

  async function handlePrint(gatePass: GatePass) {
    try {
      await loadCatalogItems()
    } catch {
      // The sheet still prints. Brand and model stay blank when the catalog cannot be loaded.
    }
    flushSync(() => setPrintTarget(gatePass))
    handleGatePassPrint()
  }

  function updateSelectedField<K extends keyof GatePass>(key: K, value: GatePass[K]) {
    if (!selected) return
    if (selected.status === 'cancelled') return
    updateGatePass({ ...selected, [key]: value })
  }

  const existingDeliveryReceiptId = selected
    ? (deliveryReceipts.find((row) => row.outslipId === selected.outslipId)?.id ?? null)
    : null

  function handleCreateDeliveryReceipt() {
    if (!selected) return
    if (existingDeliveryReceiptId) {
      navigate(`/delivery-receipts?id=${existingDeliveryReceiptId}`)
      return
    }
    const result = createDeliveryReceiptFromOutslip(selected.outslipId)
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

  return (
    <div>
      <div className="no-print">
        {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}

        <PageHeader
          breadcrumb="Transaction / Gate Pass"
          title="Gate Pass"
          description="Authorize items to leave the premises from a released Outslip, then create the Delivery Receipt."
        />

        <GatePassFiltersBar filters={filters} counts={statusCounts} onChange={setFilters} />

        <GatePassTable
          gatePasses={pagination.items}
          selectedId={selectedId}
          onSelect={(gatePass) => {
            setSelectedId(gatePass.id)
            setMessage(null)
          }}
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

        {message ? <p className="mt-3 text-sm text-text-secondary">{message}</p> : null}

        {selected ? (
          <GatePassDetailModal
            gatePass={selected}
            message={message}
            existingDeliveryReceiptId={existingDeliveryReceiptId}
            onClose={() => setSelectedId(null)}
            onCreateDeliveryReceipt={handleCreateDeliveryReceipt}
            onViewDeliveryReceipt={(receiptId) => navigate(`/delivery-receipts?id=${receiptId}`)}
            onUpdateField={updateSelectedField}
          />
        ) : null}
      </div>

      <div className="gatepass-print-root">
        {printTarget ? <GatePassDocument gatePass={printTarget} /> : null}
      </div>
    </div>
  )
}
