import { AddBillingForm } from '@/components/billing/AddBillingForm'
import { BillingTable } from '@/components/billing/BillingTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { useErp } from '@/data/erpStore'
import type { Billing } from '@/data/billingTypes'
import {
  filterBillings,
  formatBillingDisplayDate,
  formatBillingMoney,
  initialBillings,
  loadBillings,
  saveBillings,
  syncBillingsWithDeliveryReceipts,
} from '@/lib/billings'
import { deleteBillingRecord, listBillingRows } from '@/lib/billingsApi'
import { withOutslipAmounts } from '@/lib/deliveryReceipts'
import { todayIsoDate } from '@/lib/quotations'
import { useSetupItems } from '@/hooks/useSetupItems'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function monthStartIso(isoDate: string) {
  return `${isoDate.slice(0, 8)}01`
}

export function BillingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { deliveryReceipts, outslips, purchaseOrders } = useErp()
  const catalogItems = useSetupItems()
  const [localBillings, setLocalBillings] = useState<Billing[]>(() => loadBillings(initialBillings))
  const [activeBillings, setActiveBillings] = useState<Billing[]>([])
  const [dateFrom, setDateFrom] = useState(() => monthStartIso(todayIsoDate()))
  const [dateTo, setDateTo] = useState(() => todayIsoDate())
  const [appliedFrom, setAppliedFrom] = useState(() => monthStartIso(todayIsoDate()))
  const [appliedTo, setAppliedTo] = useState(() => todayIsoDate())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [listVersion, setListVersion] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<Billing | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    saveBillings(localBillings)
  }, [localBillings])

  useEffect(() => {
    function refreshBillings() {
      setLocalBillings((current) => {
        const next = loadBillings(initialBillings)
        return JSON.stringify(current) === JSON.stringify(next) ? current : next
      })
    }
    window.addEventListener('erp-billings-updated', refreshBillings)
    return () => window.removeEventListener('erp-billings-updated', refreshBillings)
  }, [])

  useEffect(() => {
    let cancelled = false
    void listBillingRows()
      .then((rows) => {
        if (!cancelled) setActiveBillings(rows)
      })
      .catch(() => {
        if (!cancelled) setActiveBillings([])
      })
    return () => {
      cancelled = true
    }
  }, [formKey, listVersion])

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
    setLocalBillings((current) => syncBillingsWithDeliveryReceipts(current, pricedReceipts))
  }, [pricedReceipts])

  const billings = useMemo(() => {
    const localIds = new Set(localBillings.map((row) => row.id))
    return [...localBillings, ...activeBillings.filter((row) => !localIds.has(row.id))]
  }, [activeBillings, localBillings])
  const filtered = useMemo(
    () =>
      filterBillings(billings, {
        status: 'all',
        search: '',
        dateFrom: appliedFrom,
        dateTo: appliedTo,
      }),
    [appliedFrom, appliedTo, billings],
  )
  const selected = useMemo(
    () => billings.find((row) => row.id === selectedId) ?? null,
    [billings, selectedId],
  )

  return (
    <div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
      <PageHeader title="Create Billing" />

      <AddBillingForm
        key={formKey}
        onScheduled={(message) => {
          setFormKey((current) => current + 1)
          setToast(message)
        }}
      />

      <div className="mt-8 border-t border-border pt-6">
        <div className="ml-auto w-full max-w-xs space-y-3">
          <DateFilter label="Date From" value={dateFrom} onChange={setDateFrom} />
          <DateFilter label="Date To" value={dateTo} onChange={setDateTo} />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setAppliedFrom(dateFrom)
                setAppliedTo(dateTo)
              }}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <BillingTable
          billings={filtered}
          selectedId={selectedId}
          onDelete={setDeleteTarget}
        />
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-text-primary">Delete Billing?</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Are you sure you want to delete {deleteTarget.invoiceNo || deleteTarget.billingNo}?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const target = deleteTarget
                  setDeleteTarget(null)
                  if (target.id.startsWith('db-') || target.id.startsWith('schedule-')) {
                    void deleteBillingRecord(target.id)
                      .then(() => {
                        setListVersion((current) => current + 1)
                        setToast(`Billing ${target.invoiceNo || target.billingNo} deleted.`)
                      })
                      .catch(() => {
                        setToast('Unable to delete this billing.')
                      })
                    return
                  }
                  setLocalBillings((current) => current.filter((row) => row.id !== target.id))
                  if (selectedId === target.id) setSelectedId(null)
                  setToast(`Billing ${target.invoiceNo || target.billingNo} deleted.`)
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface shadow-lg"
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
              {selected.projectName ? (
                <p>
                  <span className="text-text-secondary">Project:</span> {selected.projectName}
                </p>
              ) : null}
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
                <span className="text-text-secondary">Recoupment Amount:</span>{' '}
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
              <p>
                <span className="text-text-secondary">Contract Amount:</span>{' '}
                {formatBillingMoney(selected.contractAmount)}
              </p>
              <p>
                <span className="text-text-secondary">Monthly Recurring:</span>{' '}
                {formatBillingMoney(selected.monthlyRecurring)}
              </p>
              <p>
                <span className="text-text-secondary">Start date:</span>{' '}
                {formatBillingDisplayDate(selected.startDate)}
              </p>
              <p>
                <span className="text-text-secondary">End date:</span>{' '}
                {formatBillingDisplayDate(selected.endDate)}
              </p>
              {selected.runScriptDate ? (
                <p>
                  <span className="text-text-secondary">Run Script date:</span>{' '}
                  {selected.runScriptDate}
                </p>
              ) : null}
              {selected.items.some((item) => item.accountNumber) ? (
                <div className="overflow-x-auto pt-2">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-text-secondary">ITEMS</p>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-text-secondary">
                        <th className="py-1 pr-2 font-medium">Account Name - Location</th>
                        <th className="py-1 pr-2 font-medium">Account Number</th>
                        <th className="py-1 text-right font-medium">Monthly Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items
                        .filter((item) => item.accountNumber)
                        .map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="py-1 pr-2">{item.description}</td>
                            <td className="py-1 pr-2">{item.accountNumber}</td>
                            <td className="py-1 text-right">{formatBillingMoney(item.amount)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
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

function DateFilter({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3">
      <label className="text-right text-sm text-text-secondary">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-border-input bg-surface px-3 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
      />
    </div>
  )
}
