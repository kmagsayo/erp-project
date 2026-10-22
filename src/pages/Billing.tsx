import { AddBillingForm } from '@/components/billing/AddBillingForm'
import { BillingFiltersBar } from '@/components/billing/BillingFiltersBar'
import { BillingTable } from '@/components/billing/BillingTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { useErp } from '@/data/erpStore'
import type { Billing, BillingFilters } from '@/data/billingTypes'
import {
  filterBillings,
  formatBillingDisplayDate,
  formatBillingMoney,
  initialBillings,
  loadBillings,
  saveBillings,
  syncBillingsWithDeliveryReceipts,
} from '@/lib/billings'
import { withOutslipAmounts } from '@/lib/deliveryReceipts'
import { useSetupItems } from '@/hooks/useSetupItems'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const defaultFilters: BillingFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
}

export function BillingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { deliveryReceipts, outslips, purchaseOrders } = useErp()
  const catalogItems = useSetupItems()
  const [billings, setBillings] = useState<Billing[]>(() => loadBillings(initialBillings))
  const [filters, setFilters] = useState<BillingFilters>(defaultFilters)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    saveBillings(billings)
  }, [billings])

  useEffect(() => {
    function refreshBillings() {
      setBillings((current) => {
        const next = loadBillings(initialBillings)
        return JSON.stringify(current) === JSON.stringify(next) ? current : next
      })
    }
    window.addEventListener('erp-billings-updated', refreshBillings)
    return () => window.removeEventListener('erp-billings-updated', refreshBillings)
  }, [])

  useEffect(() => {
    const state = location.state as { toast?: string; highlightId?: string } | null
    if (!state?.toast && !state?.highlightId) return
    if (state.toast) setToast(state.toast)
    if (state.highlightId) setSelectedId(state.highlightId)
    navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const pricedReceipts = useMemo(
    () =>
      deliveryReceipts.map((receipt) => {
        const outslip = outslips.find((row) => row.id === receipt.outslipId)
        if (!outslip) return receipt
        const purchaseOrder = purchaseOrders.find(
          (row) => row.poNo === outslip.poId || row.id === outslip.poRecordId,
        )
        return withOutslipAmounts(receipt, outslip, purchaseOrder, catalogItems)
      }),
    [catalogItems, deliveryReceipts, outslips, purchaseOrders],
  )

  useEffect(() => {
    setBillings((current) => syncBillingsWithDeliveryReceipts(current, pricedReceipts))
  }, [pricedReceipts])

  const filtered = useMemo(() => filterBillings(billings, filters), [billings, filters])
  const selected = useMemo(
    () => billings.find((row) => row.id === selectedId) ?? null,
    [billings, selectedId],
  )

  return (
    <div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
      <PageHeader
        breadcrumb={adding ? 'Billing / Create Billing' : undefined}
        title={adding ? 'Create Billing' : 'Billing'}
        action={
          adding ? null : (
            <Button
              type="button"
              onClick={() => {
                setSelectedId(null)
                setAdding(true)
              }}
            >
              Create Billing
            </Button>
          )
        }
      />

      {adding ? (
        <AddBillingForm
          billings={billings}
          onCancel={() => setAdding(false)}
          onCreate={(billing) => {
            setBillings((current) => [...current, billing])
            setSelectedId(null)
            setAdding(false)
            setToast(`Billing ${billing.invoiceNo || billing.billingNo} saved.`)
          }}
        />
      ) : null}

      {adding ? null : <BillingFiltersBar filters={filters} onChange={setFilters} />}

      {adding ? null : (
        <BillingTable
          billings={filtered}
          selectedId={selectedId}
        />
      )}

      {selected ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedId(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-lg"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-text-primary">
                {selected.invoiceNo || selected.billingNo}
              </h2>
              <button
                type="button"
                className="rounded-md p-1.5 text-text-secondary hover:bg-table-header"
                onClick={() => setSelectedId(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm">
              <p>
                <span className="text-text-secondary">Client:</span> {selected.customerName}
              </p>
              <p>
                <span className="text-text-secondary">Transaction Date:</span>{' '}
                {formatBillingDisplayDate(selected.date)}
              </p>
              <p>
                <span className="text-text-secondary">Withholding Tax Amount:</span>{' '}
                {formatBillingMoney(selected.withholdingTax)}
              </p>
              <p>
                <span className="text-text-secondary">Retention Amount:</span>{' '}
                {formatBillingMoney(selected.retentionAmount)}
              </p>
              <p>
                <span className="text-text-secondary">Management Amount:</span>{' '}
                {formatBillingMoney(selected.managementAmount)}
              </p>
              <p>
                <span className="text-text-secondary">Mobilization Amount:</span>{' '}
                {formatBillingMoney(selected.mobilizationAmount)}
              </p>
              <p>
                <span className="text-text-secondary">Net Amount:</span>{' '}
                <span className="font-semibold">{formatBillingMoney(selected.total)}</span>
              </p>
              {selected.remarks ? (
                <p>
                  <span className="text-text-secondary">Remarks:</span> {selected.remarks}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end border-t border-border px-5 py-4">
              <Button type="button" variant="secondary" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
