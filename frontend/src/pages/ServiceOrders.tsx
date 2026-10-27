import { ServiceInvoiceDocument } from '@/components/service-orders/ServiceInvoiceDocument'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import type { ProjectSetup } from '@/data/setupTypes'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import { todayIsoDate } from '@/lib/quotations'
import { listSetupRecords } from '@/lib/setupsApi'
import {
  formatServiceInvoiceDate,
  formatServiceMoney,
  loadServiceOrders,
  nextServiceInvoiceNo,
  saveServiceOrders,
  type ServiceOrder,
  type ServiceSaleType,
} from '@/lib/serviceOrders'
import { Printer, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

const fieldClass =
  'h-9 w-full rounded-md border border-border-input bg-surface px-3 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light'

function parseAmount(value: string): number {
  const amount = Number(value.replace(/,/g, '').trim())
  return Number.isFinite(amount) ? amount : Number.NaN
}

export function ServiceOrdersPage() {
  const customers = useSetupCustomers()
  const [orders, setOrders] = useState<ServiceOrder[]>(() => loadServiceOrders())
  const [projects, setProjects] = useState<ProjectSetup[]>([])
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayIsoDate)
  const [saleType, setSaleType] = useState<ServiceSaleType>('charge')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('0.00')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [printOrder, setPrintOrder] = useState<ServiceOrder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ServiceOrder | null>(null)
  const invoiceNo = useMemo(() => nextServiceInvoiceNo(orders), [orders])

  useEffect(() => {
    saveServiceOrders(orders)
  }, [orders])

  useEffect(() => {
    void listSetupRecords<ProjectSetup>('projects', 'projects', {
      per_page: 100,
      status: 'active',
    })
      .then((result) => setProjects(result.items))
      .catch(() => setProjects([]))
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const clientProjects = projects.filter((project) => String(project.customer_id) === clientId)

  function resetForm() {
    setClientId('')
    setProjectId('')
    setDescription('')
    setDate(todayIsoDate())
    setSaleType('charge')
    setQuantity('1')
    setUnitPrice('0.00')
    setError(null)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const deletedNo = deleteTarget.invoiceNo
    setOrders((current) => current.filter((row) => row.id !== deleteTarget.id))
    setDeleteTarget(null)
    setToast(`Service order ${deletedNo} deleted.`)
  }

  function printInvoice(order: ServiceOrder) {
    flushSync(() => setPrintOrder(order))
    const clearPrint = () => {
      setPrintOrder(null)
      window.removeEventListener('afterprint', clearPrint)
    }
    window.addEventListener('afterprint', clearPrint)
    requestAnimationFrame(() => {
      window.print()
      window.setTimeout(clearPrint, 1000)
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const customer = customers.find((row) => row.id === clientId)
    const project = clientProjects.find((row) => String(row.id) === projectId)
    const qty = parseAmount(quantity)
    const price = parseAmount(unitPrice)
    if (!customer) {
      setError('Select a customer.')
      return
    }
    if (!project) {
      setError('Select a project.')
      return
    }
    if (!description.trim()) {
      setError('Enter the description.')
      return
    }
    if (!date) {
      setError('Enter the date.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter a quantity greater than 0.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Unit cost cannot be negative.')
      return
    }

    const order: ServiceOrder = {
      id: crypto.randomUUID(),
      invoiceNo,
      customerId: customer.id,
      customerName: customer.name,
      customerTin: customer.tin ?? '',
      customerAddress: customer.address ?? '',
      projectId: String(project.id),
      projectName: project.project_name,
      description: description.trim(),
      date,
      saleType,
      quantity: qty,
      unitPrice: price,
      amount: qty * price,
    }
    setOrders((current) => [order, ...current])
    setToast(`Service invoice ${order.invoiceNo} saved.`)
    resetForm()
    printInvoice(order)
  }

  return (
    <div>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
      <PageHeader title="Service Order" />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        <Field label="Customer">
          <select
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value)
              setProjectId('')
            }}
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
        <Field label="Description">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Sale type">
          <select
            value={saleType}
            onChange={(event) => setSaleType(event.target.value as ServiceSaleType)}
            className={fieldClass}
          >
            <option value="charge">Charge Sales</option>
            <option value="cash">Cash Sales</option>
          </select>
        </Field>
        <Field label="Quantity">
          <input
            type="number"
            min={0}
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Unit Cost">
          <input
            type="number"
            min={0}
            step="0.01"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            className={fieldClass}
          />
        </Field>
        <Field label="Invoice No">
          <p className="flex h-9 items-center text-sm text-text-primary">{invoiceNo}</p>
        </Field>

        {error ? <p className="text-sm text-red-700 sm:pl-[11.5rem]">{error}</p> : null}

        <div className="sm:pl-[11.5rem]">
          <Button type="submit">Print Invoice</Button>
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-table-header text-left text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-4 py-3">Invoice No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-text-secondary">
                  No service orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-3 text-text-primary">{order.invoiceNo}</td>
                  <td className="px-4 py-3 text-text-primary">{order.customerName}</td>
                  <td className="px-4 py-3 text-text-primary">{order.projectName}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-text-primary">{order.description}</td>
                  <td className="px-4 py-3 text-text-primary">{formatServiceInvoiceDate(order.date)}</td>
                  <td className="px-4 py-3 text-right text-text-primary">
                    {formatServiceMoney(order.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-text-secondary hover:bg-table-header hover:text-maroon"
                      aria-label={`Print invoice ${order.invoiceNo}`}
                      onClick={() => printInvoice(order)}
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-text-secondary hover:bg-error-bg hover:text-error-text"
                      aria-label={`Delete service order ${order.invoiceNo}`}
                      onClick={() => setDeleteTarget(order)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-text-primary">Delete Service Order?</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Are you sure you want to delete {deleteTarget.invoiceNo}?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button type="button" onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {printOrder ? (
        <div className="service-invoice-print-root">
          <ServiceInvoiceDocument order={printOrder} />
        </div>
      ) : null}
    </div>
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
