import { PageHeader } from '@/components/layout/PageHeader'
import { SoaDocument } from '@/components/soa/SoaDocument'
import { SoaLedger } from '@/components/soa/SoaLedger'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'
import type { Billing } from '@/data/billingTypes'
import type { SoaLine } from '@/data/soaTypes'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import { initialBillings, loadBillings } from '@/lib/billings'
import { listActiveBillings } from '@/lib/billingsApi'
import { buildSoaFromBillings, buildSoaPrintDocument, formatSoaPrintMoney } from '@/lib/soa'
import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

export function StatementOfAccountPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const customers = useSetupCustomers()
  const [localBillings, setLocalBillings] = useState<Billing[]>(() => loadBillings(initialBillings))
  const [activeBillings, setActiveBillings] = useState<Billing[]>([])
  const [customerId, setCustomerId] = useState('')
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')
  const [draftReference, setDraftReference] = useState('')
  const [draftType, setDraftType] = useState<'all' | 'billing' | 'payment'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reference, setReference] = useState('')
  const [transactionType, setTransactionType] = useState<'all' | 'billing' | 'payment'>('all')
  const [searched, setSearched] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [printBillingId, setPrintBillingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    function refresh() {
      setLocalBillings(loadBillings(initialBillings))
    }
    window.addEventListener('erp-billings-updated', refresh)
    return () => window.removeEventListener('erp-billings-updated', refresh)
  }, [])

  useEffect(() => {
    let cancelled = false
    void listActiveBillings()
      .then((rows) => {
        if (!cancelled) setActiveBillings(rows)
      })
      .catch(() => {
        if (!cancelled) setActiveBillings([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const state = location.state as {
      toast?: string
      customerId?: string
      customerName?: string
      deliveryReceiptId?: string
      continueWorkflow?: boolean
    } | null
    if (!state?.customerId && !state?.continueWorkflow && !state?.toast) return

    if (state.toast) setToast(state.toast)
    if (state.customerId) {
      setCustomerId(state.customerId)
      setSearched(true)
      setSearchError(null)
    }

    if (state.continueWorkflow) {
      const deliveryReceiptId = state.deliveryReceiptId?.trim() || ''
      const timer = window.setTimeout(() => {
        navigate(
          deliveryReceiptId
            ? `/accomplishments?dr=${encodeURIComponent(deliveryReceiptId)}`
            : '/accomplishments',
          { replace: true },
        )
      }, 900)
      return () => window.clearTimeout(timer)
    }

    navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  const billings = useMemo(() => {
    const localIds = new Set(localBillings.map((row) => row.id))
    return [...localBillings, ...activeBillings.filter((row) => !localIds.has(row.id))]
  }, [activeBillings, localBillings])

  const customerOptions = useMemo(() => {
    const options = new Map<string, { id: string; name: string }>()
    customers.forEach((customer) => {
      options.set(customer.id, { id: customer.id, name: customer.name })
    })
    billings.forEach((billing) => {
      if (billing.customerId && !options.has(billing.customerId)) {
        options.set(billing.customerId, {
          id: billing.customerId,
          name: billing.customerName,
        })
        return
      }
      if (
        !billing.customerId &&
        billing.customerName &&
        ![...options.values()].some((row) => row.name === billing.customerName)
      ) {
        options.set(`name:${billing.customerName}`, {
          id: `name:${billing.customerName}`,
          name: billing.customerName,
        })
      }
    })
    return [...options.values()]
  }, [customers, billings])

  const selectedCustomer = customers.find((row) => row.id === customerId)
  const selectedOption = customerOptions.find((row) => row.id === customerId)
  const customerName = selectedCustomer?.name || selectedOption?.name || ''

  const soa = useMemo(
    () =>
      buildSoaFromBillings(
        billings,
        customerId.startsWith('name:') ? '' : customerId,
        '',
        '',
        customerName,
      ),
    [billings, customerId, customerName],
  )

  const visibleLines = useMemo(() => {
    const needle = reference.trim().toLowerCase()
    return soa.lines.filter((line) => {
      if (dateFrom && line.transactionDate < dateFrom) return false
      if (dateTo && line.transactionDate > dateTo) return false
      if (needle && !line.reference.toLowerCase().includes(needle)) return false
      if (transactionType !== 'all' && line.kind !== transactionType) return false
      return true
    })
  }, [dateFrom, dateTo, reference, soa.lines, transactionType])

  const printDocument = useMemo(() => {
    const billing = billings.find((row) => row.id === printBillingId)
    if (!billing) return null
    return buildSoaPrintDocument(
      [billing],
      billing.customerId,
      '',
      '',
      {
        name: billing.customerName || customerName,
        address: selectedCustomer?.address,
        contactPerson: selectedCustomer?.contactPerson,
      },
    )
  }, [billings, customerName, printBillingId, selectedCustomer?.address, selectedCustomer?.contactPerson])

  function handlePrint(line: SoaLine) {
    flushSync(() => setPrintBillingId(line.billingId))
    window.print()
  }

  return (
    <div>
      <div className="no-print">
        {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
        <PageHeader title="Statement of Account" />

        <div className="rounded-lg border border-border bg-surface px-5 py-5">
          <div className="flex flex-wrap items-end gap-2">
              <FormField label="Client" labelClassName="text-xs font-normal text-text-secondary">
                <select
                  aria-label="Client"
                  value={customerId}
                  onChange={(event) => {
                    setCustomerId(event.target.value)
                    setSearched(false)
                    setSearchError(null)
                  }}
                  className="flex h-9 min-w-48 rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
                >
                  <option value="">Select client</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Date From" labelClassName="text-xs font-normal text-text-secondary">
                <Input
                  type="date"
                  value={draftFrom}
                  onChange={(event) => setDraftFrom(event.target.value)}
                />
              </FormField>
              <FormField label="Date To" labelClassName="text-xs font-normal text-text-secondary">
                <Input
                  type="date"
                  value={draftTo}
                  onChange={(event) => setDraftTo(event.target.value)}
                />
              </FormField>
              <FormField label="Reference" labelClassName="text-xs font-normal text-text-secondary">
                <Input
                  value={draftReference}
                  onChange={(event) => setDraftReference(event.target.value)}
                  placeholder="Reference no."
                />
              </FormField>
              <FormField
                label="Transaction Type"
                labelClassName="text-xs font-normal text-text-secondary"
              >
                <select
                  value={draftType}
                  onChange={(event) =>
                    setDraftType(event.target.value as 'all' | 'billing' | 'payment')
                  }
                  className="flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
                >
                  <option value="all">All</option>
                  <option value="billing">Billing</option>
                  <option value="payment">Payment</option>
                </select>
              </FormField>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setCustomerId('')
                  setDraftFrom('')
                  setDraftTo('')
                  setDraftReference('')
                  setDraftType('all')
                  setDateFrom('')
                  setDateTo('')
                  setReference('')
                  setTransactionType('all')
                  setSearched(false)
                  setSearchError(null)
                }}
              >
                Reset
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!customerId) {
                    setSearchError('Select a client first.')
                    setSearched(false)
                    return
                  }
                  setSearchError(null)
                  setDateFrom(draftFrom)
                  setDateTo(draftTo)
                  setReference(draftReference)
                  setTransactionType(draftType)
                  setSearched(true)
                }}
              >
                Search
              </Button>
            </div>
          {searchError ? <p className="mt-3 text-sm text-red-700">{searchError}</p> : null}

          {searched ? (
            <div className="mt-6">
              <p className="text-sm text-text-secondary">Ledger</p>
              <p className="text-sm font-medium text-text-primary">{customerName}</p>
              <p className="mt-3 text-2xl font-semibold text-text-primary">
                Balance: {formatSoaPrintMoney(soa.outstandingBalance)}
              </p>
              <div className="mt-6">
                <SoaLedger soa={soa} lines={visibleLines} onPrint={handlePrint} />
              </div>
            </div>
          ) : null}
        </div>

      </div>

      <div className="soa-print-root">
        {printDocument ? <SoaDocument document={printDocument} /> : null}
      </div>
    </div>
  )
}
