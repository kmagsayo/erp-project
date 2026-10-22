import { Button } from '@/components/ui/button'
import type { Billing } from '@/data/billingTypes'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import { buildManualBilling, formatBillingMoney, generateBillingNo } from '@/lib/billings'
import { cn } from '@/lib/utils'
import { todayIsoDate } from '@/lib/quotations'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'

const fieldClass =
  'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light'

function parseAmount(value: string): number {
  const amount = Number(value.replace(/,/g, '').trim())
  return Number.isFinite(amount) ? amount : Number.NaN
}

function amountOrZero(value: string): number {
  const amount = parseAmount(value)
  return Number.isFinite(amount) ? amount : 0
}

export function AddBillingForm({
  billings,
  onCancel,
  onCreate,
}: {
  billings: Billing[]
  onCancel: () => void
  onCreate: (billing: Billing) => void
}) {
  const customers = useSetupCustomers()
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState(todayIsoDate)
  const invoiceNo = useMemo(() => generateBillingNo(billings), [billings])
  const [withholdingTax, setWithholdingTax] = useState('0.00')
  const [retentionAmount, setRetentionAmount] = useState('0.00')
  const [managementAmount, setManagementAmount] = useState('0.00')
  const [mobilizationAmount, setMobilizationAmount] = useState('0.00')
  const [netAmount, setNetAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)
  const remainingBalance =
    amountOrZero(netAmount) -
    amountOrZero(withholdingTax) -
    amountOrZero(retentionAmount) -
    amountOrZero(managementAmount) -
    amountOrZero(mobilizationAmount)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const customer = customers.find((row) => row.id === clientId)
    const result = buildManualBilling(billings, {
      customerId: clientId,
      customerName: customer?.name ?? '',
      projectId: '',
      projectName: '',
      date,
      invoiceNo,
      withholdingTax: parseAmount(withholdingTax),
      retentionAmount: parseAmount(retentionAmount),
      managementAmount: parseAmount(managementAmount),
      mobilizationAmount: parseAmount(mobilizationAmount),
      netAmount: parseAmount(netAmount),
      remarks,
    })
    if (result.error || !result.billing) {
      setError(result.error ?? 'Unable to save this billing.')
      return
    }
    onCreate(result.billing)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-3xl rounded-lg border border-border bg-surface px-6 py-8 sm:px-10"
    >
      <div className="space-y-4">
        <Field label="Client">
          <select
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className={fieldClass}
          >
            <option value="">Select client</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Transaction Date">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Invoice No">
          <p className="flex h-9 items-center text-sm text-text-primary">{invoiceNo}</p>
        </Field>
        <AmountField label="Withholding Tax Amount" value={withholdingTax} onChange={setWithholdingTax} />
        <AmountField label="Retention Amount" value={retentionAmount} onChange={setRetentionAmount} />
        <AmountField label="Management Amount" value={managementAmount} onChange={setManagementAmount} />
        <AmountField label="Mobilization Amount" value={mobilizationAmount} onChange={setMobilizationAmount} />
        <AmountField label="Net Amount" value={netAmount} onChange={setNetAmount} />
        <Field label="Remaining Balance">
          <p className="flex h-9 items-center justify-end text-sm font-semibold text-text-primary">
            {formatBillingMoney(remainingBalance)}
          </p>
        </Field>
        <Field label="Remarks">
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
          />
        </Field>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex gap-2 sm:pl-[236px]">
        <Button type="submit">Save</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <label className="text-sm text-text-secondary">{label}</label>
      {children}
    </div>
  )
}

function AmountField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldClass, 'text-right')}
      />
    </Field>
  )
}
