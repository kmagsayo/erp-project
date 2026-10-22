import { DeliveryItemQrPopup } from '@/components/delivery-receipts/DeliveryItemQrPopup'
import { DeliveryReceiptDetailModal } from '@/components/delivery-receipts/DeliveryReceiptDetailModal'
import { DeliveryReceiptDocument } from '@/components/delivery-receipts/DeliveryReceiptDocument'
import { DeliveryReceiptFiltersBar } from '@/components/delivery-receipts/DeliveryReceiptFiltersBar'
import { DeliveryReceiptTable } from '@/components/delivery-receipts/DeliveryReceiptTable'
import { MarkDeliveredConfirmDialog } from '@/components/delivery-receipts/MarkDeliveredConfirmDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast } from '@/components/ui/toast'
import { useErp } from '@/data/erpStore'
import type { DeliveryReceipt, DeliveryReceiptStatus } from '@/data/erpTypes'
import { createBillingFromDeliveryReceipt } from '@/lib/billings'
import { registerDeliveryReceiptToken } from '@/lib/deliveryReceiptConfirmation'
import {
  countDeliveryReceiptStatuses,
  deliveryProgress,
  filterDeliveryReceipts,
  formatDrDisplayDate,
  formatDrMoney,
  mergeReceiptWithOutslip,
  markDeliveryItemReceived,
  parseDeliveryItemQr,
  withOutslipAmounts,
  type DeliveryReceiptFilters,
} from '@/lib/deliveryReceipts'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import { useSetupItems } from '@/hooks/useSetupItems'
import { request } from '@/lib/api'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const defaultFilters: DeliveryReceiptFilters = {
  status: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
}

const viewStatusBadge: Record<
  DeliveryReceipt['status'],
  'active' | 'out_for_delivery' | 'partially_delivered' | 'completed'
> = {
  active: 'active',
  out_for_delivery: 'out_for_delivery',
  partially_delivered: 'partially_delivered',
  delivered: 'completed',
  received: 'completed',
}

const viewStatusLabel: Record<DeliveryReceipt['status'], string> = {
  active: 'For Delivery',
  out_for_delivery: 'Out for Delivery',
  partially_delivered: 'Partially Delivered',
  delivered: 'Delivered',
  received: 'Received',
}

export function DeliveryReceiptsPage() {
  const {
    deliveryReceipts,
    outslips,
    purchaseOrders,
    createDeliveryReceiptFromOutslip,
    updateDeliveryReceipt,
    updateDeliveryReceiptStatus,
  } = useErp()
  const catalogItems = useSetupItems()
  const customers = useSetupCustomers()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [filters, setFilters] = useState<DeliveryReceiptFilters>(defaultFilters)
  const [selectedId, setSelectedId] = useState<string | null>(params.get('id'))
  const [detailId, setDetailId] = useState<string | null>(null)
  const [confirmDelivered, setConfirmDelivered] = useState(false)
  const [viewReceipt, setViewReceipt] = useState<DeliveryReceipt | null>(null)
  const [itemQrId, setItemQrId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [printTarget, setPrintTarget] = useState<DeliveryReceipt | null>(null)
  const createdFrom = useRef<string | null>(null)
  const registeredTokens = useRef(new Set<string>())
  const deliveryReceiptsRef = useRef(deliveryReceipts)
  deliveryReceiptsRef.current = deliveryReceipts

  const statusCounts = useMemo(
    () => countDeliveryReceiptStatuses(deliveryReceipts),
    [deliveryReceipts],
  )

  const filteredReceipts = useMemo(
    () => filterDeliveryReceipts(deliveryReceipts, filters),
    [deliveryReceipts, filters],
  )

  useEffect(() => {
    const state = location.state as { toast?: string; highlightId?: string } | null
    if (!state?.toast && !state?.highlightId) return
    if (state.toast) setToast(state.toast)
    if (state.highlightId) setSelectedId(state.highlightId)
    navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  useEffect(() => {
    for (const receipt of deliveryReceipts) {
      if (!receipt.qrToken || registeredTokens.current.has(receipt.qrToken)) continue
      registeredTokens.current.add(receipt.qrToken)
      void registerDeliveryReceiptToken(receipt.qrToken, receipt.id).catch(() => {
        registeredTokens.current.delete(receipt.qrToken)
      })
    }
  }, [deliveryReceipts])

  useEffect(() => {
    if (!viewReceipt) return
    const receiptId = viewReceipt.id
    let stopped = false

    async function poll() {
      try {
        const response = await request<{ data: { codes: string[] } }>('/receiving-scans')
        const codes = (response.data?.codes ?? []).filter((code) => {
          const parsed = parseDeliveryItemQr(code)
          return parsed?.receiptId === receiptId
        })
        if (stopped || codes.length === 0) return
        let latest = deliveryReceiptsRef.current.find((row) => row.id === receiptId)
        if (!latest) return
        const claimed: string[] = []
        let changed = false
        for (const code of codes) {
          const parsed = parseDeliveryItemQr(code)
          if (!parsed) continue
          const marked = markDeliveryItemReceived(latest, parsed.itemId)
          if ('error' in marked) continue
          if (!marked.already) {
            latest = marked.receipt
            changed = true
          }
          claimed.push(code)
        }
        if (changed) {
          updateDeliveryReceipt(latest)
          setViewReceipt(latest)
        }
        if (claimed.length > 0) {
          await request('/receiving-scans/claim', {
            method: 'POST',
            body: JSON.stringify({ codes: claimed }),
          })
        }
      } catch {
        // The next poll retries a scan that has not been claimed.
      }
    }

    void poll()
    const timer = window.setInterval(() => void poll(), 1500)
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [viewReceipt?.id])

  useEffect(() => {
    const fromOutslip = params.get('from')
    const byId = params.get('id')
    if (byId) {
      setSelectedId(byId)
      setDetailId(byId)
      navigate('/delivery-receipts', { replace: true })
      return
    }
    if (!fromOutslip) return

    const existing = deliveryReceipts.find((row) => row.outslipId === fromOutslip)
    if (existing) {
      setSelectedId(existing.id)
      navigate('/delivery-receipts', { replace: true })
      return
    }
    if (createdFrom.current === fromOutslip) return
    createdFrom.current = fromOutslip

    const result = createDeliveryReceiptFromOutslip(fromOutslip)
    if (result.error) {
      setMessage(result.error)
      createdFrom.current = null
      return
    }
    if (result.receipt) {
      setSelectedId(result.receipt.id)
      setMessage(`Delivery Receipt ${result.receipt.id} ready to print.`)
      navigate('/delivery-receipts', { replace: true })
    }
  }, [params, deliveryReceipts, createDeliveryReceiptFromOutslip, navigate])

  function handlePrint(receipt: DeliveryReceipt) {
    setPrintTarget(receipt)
    const clearPrint = () => {
      setPrintTarget(null)
      window.removeEventListener('afterprint', clearPrint)
    }
    window.addEventListener('afterprint', clearPrint)
    requestAnimationFrame(() => {
      window.print()
      // Fallback if afterprint is not fired in some browsers.
      window.setTimeout(clearPrint, 1000)
    })
  }

  function handleStatusChange(receipt: DeliveryReceipt, status: DeliveryReceiptStatus) {
    const result = updateDeliveryReceiptStatus(receipt.id, status)
    if (result.error) {
      setMessage(result.error)
      return
    }
    setSelectedId(receipt.id)
    if (viewReceipt?.id === receipt.id) {
      setViewReceipt({ ...viewReceipt, status })
    }
  }

  function pricedReceipt(receipt: DeliveryReceipt): DeliveryReceipt {
    const outslip = outslips.find((row) => row.id === receipt.outslipId)
    if (!outslip) return receipt
    const purchaseOrder = purchaseOrders.find(
      (row) => row.poNo === outslip.poId || row.id === outslip.poRecordId,
    )
    return withOutslipAmounts(receipt, outslip, purchaseOrder, catalogItems)
  }

  function openDetails(receipt: DeliveryReceipt) {
    const next = pricedReceipt(receipt)
    if (next.totalAmount !== receipt.totalAmount || next.items.length !== receipt.items.length) {
      updateDeliveryReceipt(next)
    }
    setSelectedId(receipt.id)
    setDetailId(receipt.id)
    setConfirmDelivered(false)
    setMessage(null)
  }

  function closeDetails() {
    setDetailId(null)
    setConfirmDelivered(false)
  }

  const detailReceiptRaw = deliveryReceipts.find((row) => row.id === detailId) ?? null
  const detailReceipt = detailReceiptRaw ? pricedReceipt(detailReceiptRaw) : null

  function handleMarkOutForDelivery() {
    if (!detailReceipt) return
    handleStatusChange(detailReceipt, 'out_for_delivery')
  }

  function handleConfirmDelivered() {
    if (!detailReceipt) return
    handleStatusChange(detailReceipt, 'delivered')
    setConfirmDelivered(false)
  }

  function handleCreateBilling() {
    if (!detailReceipt) return
    const matchedCustomer = customers.find(
      (row) => row.name.trim().toLowerCase() === detailReceipt.customer.trim().toLowerCase(),
    )
    const priced = pricedReceipt(detailReceipt)
    if (priced.totalAmount !== detailReceipt.totalAmount) {
      updateDeliveryReceipt(priced)
    }
    const billing = createBillingFromDeliveryReceipt(priced, matchedCustomer?.id ?? '')
    closeDetails()
    navigate('/billing', {
      state: {
        toast: `Billing ${billing.billingNo} created successfully.`,
        highlightId: billing.id,
      },
    })
  }

  function openView(receipt: DeliveryReceipt) {
    const latest = deliveryReceipts.find((row) => row.id === receipt.id) ?? receipt
    const outslip = outslips.find((row) => row.id === latest.outslipId)
    const purchaseOrder = outslip
      ? purchaseOrders.find((row) => row.poNo === outslip.poId || row.id === outslip.poRecordId)
      : undefined
    const merged = outslip
      ? mergeReceiptWithOutslip(latest, outslip, purchaseOrder, catalogItems)
      : latest
    if (
      merged.status !== latest.status ||
      JSON.stringify(merged.items) !== JSON.stringify(latest.items)
    ) {
      updateDeliveryReceipt(merged)
    }
    setSelectedId(merged.id)
    setViewReceipt(structuredClone(merged))
    setItemQrId(null)
    setMessage(null)
  }

  if (viewReceipt) {
    const progress = deliveryProgress(viewReceipt.items)
    const itemQr = viewReceipt.items.find((item) => item.id === itemQrId) ?? null
    return (
      <div>
        <div className="no-print">
          <PageHeader
            breadcrumb="Transaction / Delivery Receipt"
            title="Delivery Receipt"
            description={`Details for ${viewReceipt.id}`}
          />
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>View {viewReceipt.id}</CardTitle>
              </div>
              <Badge variant={viewStatusBadge[viewReceipt.status]}>
                {viewStatusLabel[viewReceipt.status]}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-surface px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Delivery Progress
                  </p>
                  <p className="mt-2 text-sm font-medium text-text-primary">
                    {progress.scanned} / {progress.released} Delivered
                  </p>
                  <p className="text-sm text-text-secondary">{progress.percent}%</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-maroon"
                      style={{ width: `${Math.min(100, progress.percent)}%` }}
                    />
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-text-secondary">Delivery Date:</span>{' '}
                  {formatDrDisplayDate(viewReceipt.date)}
                </p>
                <p>
                  <span className="text-text-secondary">Reference Outslip:</span>{' '}
                  <button
                    type="button"
                    className="font-medium text-maroon hover:underline"
                    onClick={() => navigate(`/outslips?id=${viewReceipt.outslipId}`)}
                  >
                    {viewReceipt.outslipId}
                  </button>
                </p>
                <p>
                  <span className="text-text-secondary">Customer:</span> {viewReceipt.customer}
                </p>
                <p>
                  <span className="text-text-secondary">PO Number:</span> {viewReceipt.poId}
                </p>
                <p>
                  <span className="text-text-secondary">Project:</span> {viewReceipt.project}
                </p>
                <p>
                  <span className="text-text-secondary">Branch:</span> {viewReceipt.branch}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-text-secondary">Delivered To:</span>{' '}
                  {viewReceipt.customerAddress || viewReceipt.destination}
                </p>
                {viewReceipt.remarks ? (
                  <p className="sm:col-span-2">
                    <span className="text-text-secondary">Remarks:</span> {viewReceipt.remarks}
                  </p>
                ) : null}
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-table-header text-left text-xs uppercase tracking-wide text-text-secondary">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Item Code</th>
                      <th className="px-3 py-2 text-center">Ordered</th>
                      <th className="px-3 py-2 text-center">Received</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewReceipt.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-text-secondary">
                          No items on the referenced Outslip.
                        </td>
                      </tr>
                    ) : (
                      viewReceipt.items.map((item) => (
                        <tr
                          key={item.id}
                          className="cursor-pointer border-t border-border hover:bg-maroon-light/40"
                          onClick={() => setItemQrId(item.id)}
                        >
                          <td className="px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2">{item.itemCode}</td>
                          <td className="px-3 py-2 text-center">{item.allowedQuantity}</td>
                          <td className="px-3 py-2 text-center">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatDrMoney(item.unitPrice)}</td>
                          <td className="px-3 py-2 text-right">{formatDrMoney(item.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="text-right text-sm font-semibold">
                Total Amount: {formatDrMoney(viewReceipt.totalAmount)}
              </p>

              {message ? <p className="text-sm text-text-secondary">{message}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setViewReceipt(null)
                    setItemQrId(null)
                    setMessage(null)
                  }}
                >
                  Back to List
                </Button>
                <Button type="button" onClick={() => handlePrint(viewReceipt)}>
                  Print Delivery Receipt
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/accomplishments?dr=${viewReceipt.id}`)}
                >
                  View Accomplishment Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="dr-print-root">
          <DeliveryReceiptDocument receipt={viewReceipt} />
        </div>
        {itemQr ? (
          <DeliveryItemQrPopup
            receiptId={viewReceipt.id}
            item={itemQr}
            onClose={() => setItemQrId(null)}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div>
      <div className="no-print">
        {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
        <PageHeader breadcrumb="Transaction / Delivery Receipt" title="Delivery Receipt" />

        <DeliveryReceiptFiltersBar
          filters={filters}
          counts={statusCounts}
          onChange={setFilters}
        />

        {deliveryReceipts.length === 0 && filters.status === 'all' && !filters.search ? (
          <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
            <p className="text-sm font-medium text-text-primary">No delivery receipts yet.</p>
            <p className="mt-1 text-sm text-text-secondary">
              Create a Gate Pass from a released Outslip, then generate the Delivery Receipt.
            </p>
          </div>
        ) : (
          <DeliveryReceiptTable
            receipts={filteredReceipts}
            selectedId={selectedId}
            onSelect={openDetails}
            onView={openView}
          />
        )}

        {message ? <p className="mt-3 text-sm text-text-secondary">{message}</p> : null}

        {detailReceipt ? (
          <DeliveryReceiptDetailModal
            receipt={detailReceipt}
            escapeDisabled={confirmDelivered}
            onClose={closeDetails}
            onMarkOutForDelivery={handleMarkOutForDelivery}
            onRequestMarkDelivered={() => setConfirmDelivered(true)}
            onCreateBilling={handleCreateBilling}
          />
        ) : null}

        <MarkDeliveredConfirmDialog
          open={confirmDelivered}
          onCancel={() => setConfirmDelivered(false)}
          onConfirm={handleConfirmDelivered}
        />
      </div>

      <div className="dr-print-root">
        {printTarget ? <DeliveryReceiptDocument receipt={printTarget} /> : null}
      </div>
    </div>
  )
}
