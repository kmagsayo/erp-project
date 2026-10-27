import { Button } from '@/components/ui/button'
import type { BillingLineItem } from '@/data/billingTypes'
import type { ProjectSetup } from '@/data/setupTypes'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import { installmentDates, regularInstallmentAmount } from '@/lib/billingSchedule'
import { formatBillingMoney } from '@/lib/billings'
import { scheduleBilling } from '@/lib/billingsApi'
import { ApiError } from '@/lib/api'
import { todayIsoDate } from '@/lib/quotations'
import { listSetupRecords } from '@/lib/setupsApi'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'

const fieldClass =
  'h-9 w-full rounded-md border border-border-input bg-surface px-3 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light'

interface DraftAccount {
  id: string
  accountName: string
  accountNumber: string
  monthlyFee: number
}

function parseAmount(value: string): number {
  const amount = Number(value.replace(/,/g, '').trim())
  return Number.isFinite(amount) ? amount : Number.NaN
}

function dayFromIso(isoDate: string) {
  const day = Number(isoDate.slice(-2))
  if (!Number.isInteger(day) || day < 1 || day > 31) return '1'
  return String(day)
}

export function AddBillingForm({ onScheduled }: { onScheduled: (message: string) => void }) {
  const customers = useSetupCustomers()
  const [projects, setProjects] = useState<ProjectSetup[]>([])
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(todayIsoDate)
  const [invoiceNo, setInvoiceNo] = useState('')
  const [withholdingTax, setWithholdingTax] = useState('0.00')
  const [retentionAmount, setRetentionAmount] = useState('0.00')
  const [recoupmentAmount, setRecoupmentAmount] = useState('0.00')
  const [mobilizationAmount, setMobilizationAmount] = useState('0.00')
  const [netAmount, setNetAmount] = useState('0.00')
  const [remarks, setRemarks] = useState('')
  const [contractAmount, setContractAmount] = useState('0.00')
  const [monthlyRecurring, setMonthlyRecurring] = useState('0.00')
  const [startDate, setStartDate] = useState(todayIsoDate)
  const [endDate, setEndDate] = useState(todayIsoDate)
  const [runDay, setRunDay] = useState(() => dayFromIso(todayIsoDate()))
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountFee, setAccountFee] = useState('0.00')
  const [accounts, setAccounts] = useState<DraftAccount[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void listSetupRecords<ProjectSetup>('projects', 'projects', {
      per_page: 100,
      status: 'active',
    })
      .then((result) => setProjects(result.items))
      .catch(() => setProjects([]))
  }, [])

  const clientProjects = projects.filter((project) => String(project.customer_id) === clientId)
  const runDayNumber = Number(runDay)

  useEffect(() => {
    const count = installmentDates(startDate, endDate, runDayNumber).length
    const monthly = regularInstallmentAmount(parseAmount(contractAmount), count)
    if (monthly <= 0) return
    const formatted = monthly.toFixed(2)
    setMonthlyRecurring(formatted)
    setNetAmount(formatted)
  }, [contractAmount, startDate, endDate, runDayNumber])

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId)
    setProjectId('')
  }

  function handleTransactionDate(nextDate: string) {
    setDate(nextDate)
    setRunDay(dayFromIso(nextDate))
  }

  const subtotal = accounts.reduce((sum, account) => sum + account.monthlyFee, 0)

  function addAccount() {
    const name = accountName.trim()
    const number = accountNumber.trim()
    const fee = accountFee.trim() === '' ? 0 : parseAmount(accountFee)
    if (!name) {
      setError('Enter the account name and location.')
      return
    }
    if (!number) {
      setError('Enter the account number.')
      return
    }
    if (!Number.isFinite(fee) || fee < 0) {
      setError('Monthly recurring fee cannot be negative.')
      return
    }
    setAccounts((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        accountName: name,
        accountNumber: number,
        monthlyFee: fee,
      },
    ])
    setAccountName('')
    setAccountNumber('')
    setAccountFee('0.00')
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const day = Number(runDay)
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setError('Enter a run script day from 1 to 31.')
      return
    }
    const customer = customers.find((row) => row.id === clientId)
    const project = clientProjects.find((row) => String(row.id) === projectId)
    if (!customer) {
      setError('Select a client.')
      return
    }
    if (!project) {
      setError('Select a project.')
      return
    }
    if (!date) {
      setError('Enter the transaction date.')
      return
    }
    if (!startDate || !endDate) {
      setError('Enter the start date and end date.')
      return
    }
    if (endDate < startDate) {
      setError('End date cannot be before the start date.')
      return
    }
    const contract = parseAmount(contractAmount)
    const dates = installmentDates(startDate, endDate, day)
    if (!Number.isFinite(contract) || contract <= 0) {
      setError('Enter the contract amount.')
      return
    }
    if (dates.length === 0) {
      setError('No installment dates fall in the selected period.')
      return
    }
    const optionalAmounts = [withholdingTax, retentionAmount, recoupmentAmount, mobilizationAmount]
    if (optionalAmounts.some((value) => !Number.isFinite(parseAmount(value)) || parseAmount(value) < 0)) {
      setError('Amounts cannot be negative.')
      return
    }
    const items: BillingLineItem[] = accounts.map((account) => ({
      id: account.id,
      description: account.accountName,
      quantity: 1,
      unit: 'month',
      unitPrice: account.monthlyFee,
      amount: account.monthlyFee,
      accountNumber: account.accountNumber,
    }))
    setSaving(true)
    try {
      const message = await scheduleBilling({
        customerId: clientId,
        customerName: customer.name,
        projectId,
        projectName: project.project_name,
        invoiceNo: invoiceNo.trim(),
        transactionDate: date,
        withholdingTax: parseAmount(withholdingTax),
        retentionAmount: parseAmount(retentionAmount),
        recoupmentAmount: parseAmount(recoupmentAmount),
        mobilizationAmount: parseAmount(mobilizationAmount),
        contractAmount: contract,
        startDate,
        endDate,
        runDay: day,
        remarks,
        items,
      })
      onScheduled(message)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Unable to schedule this billing.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid items-start gap-x-16 gap-y-8 lg:grid-cols-2">
        <div className="space-y-3">
          <Field label="Client">
            <select
              value={clientId}
              onChange={(event) => handleClientChange(event.target.value)}
              className={fieldClass}
            >
              <option value="">Select</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Project">
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              disabled={!clientId}
              className={fieldClass}
            >
              <option value="">Select</option>
              {clientProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transaction date">
            <input
              type="date"
              value={date}
              onChange={(event) => handleTransactionDate(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Invoice No">
            <input
              value={invoiceNo}
              onChange={(event) => setInvoiceNo(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <AmountField label="Withholding Tax Amount" value={withholdingTax} onChange={setWithholdingTax} />
          <AmountField label="Retention Amount" value={retentionAmount} onChange={setRetentionAmount} />
          <AmountField label="Recoupment Amount" value={recoupmentAmount} onChange={setRecoupmentAmount} />
          <AmountField label="Mobilization Amount" value={mobilizationAmount} onChange={setMobilizationAmount} />
          <AmountField label="Net Amount" value={netAmount} onChange={setNetAmount} />
          <Field label="Remarks">
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              rows={2}
              className="w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
            />
          </Field>
          <AmountField label="Contract Amount" value={contractAmount} onChange={setContractAmount} />
          <AmountField label="Monthly Recurring" value={monthlyRecurring} onChange={setMonthlyRecurring} />
          <Field label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Run Script date">
            <div className="flex h-9 items-center gap-2 text-sm text-text-primary">
              <span>Every</span>
              <input
                type="number"
                min={1}
                max={31}
                value={runDay}
                onChange={(event) => setRunDay(event.target.value)}
                className={cn(fieldClass, 'w-16 text-center')}
              />
              <span className="whitespace-nowrap">of the month</span>
            </div>
          </Field>

          {error ? <p className="text-sm text-red-700 sm:pl-[11.5rem]">{error}</p> : null}

          <div className="pt-2 sm:pl-[11.5rem]">
            <Button type="submit" className="rounded-full px-5" disabled={saving}>
              Save
            </Button>
          </div>
        </div>

        <div className="min-w-0">
          <div className="max-w-md space-y-3">
            <input
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              placeholder="ADD ACCOUNT NAME - LOCATION"
              aria-label="Account name and location"
              className={fieldClass}
            />
            <input
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="ADD ACCOUNT NUMBER"
              aria-label="Account number"
              className={fieldClass}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={accountFee}
              onChange={(event) => setAccountFee(event.target.value)}
              aria-label="Monthly recurring fee"
              className={fieldClass}
            />
            <div className="flex justify-end">
              <Button type="button" size="sm" className="rounded-full" onClick={addAccount}>
                Add To List
              </Button>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <div className="bg-[#fff6d8] px-3 py-2 text-center text-xs font-semibold tracking-wide text-text-secondary">
              ITEMS
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-medium">ACCOUNT NAME - LOCATION</th>
                  <th className="px-3 py-2 font-medium">ACCOUNT NUMBER</th>
                  <th className="px-3 py-2 font-medium">MONTHLY RECURRING FEE</th>
                  <th className="px-3 py-2 font-medium">TOTAL</th>
                  <th className="px-3 py-2 text-right font-medium">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-t border-border">
                    <td className="px-3 py-2 text-text-primary">{account.accountName}</td>
                    <td className="px-3 py-2 text-text-primary">{account.accountNumber}</td>
                    <td className="px-3 py-2 text-text-primary">
                      {formatBillingMoney(account.monthlyFee)}
                    </td>
                    <td className="px-3 py-2 text-text-primary">
                      {formatBillingMoney(account.monthlyFee)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="rounded-md p-1 text-text-secondary hover:bg-table-header hover:text-red-700"
                        aria-label={`Remove ${account.accountName}`}
                        onClick={() =>
                          setAccounts((current) => current.filter((row) => row.id !== account.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right font-medium text-text-secondary">
                    SUB-TOTAL
                  </td>
                  <td className="px-3 py-2 text-text-primary">{formatBillingMoney(subtotal)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[10.5rem_minmax(0,18rem)] sm:items-center sm:gap-4">
      <label className="text-sm text-text-secondary sm:text-right">{label}</label>
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
        className={fieldClass}
      />
    </Field>
  )
}
