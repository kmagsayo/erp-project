import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField, Input } from '@/components/ui/input'
import type { PurchaseOrder, PurchaseOrderLineItem, PurchaseOrderStatus } from '@/data/purchaseOrderTypes'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import { useSetupItems } from '@/hooks/useSetupItems'
import { useSetupSuppliers } from '@/hooks/useSetupSuppliers'
import { loadQuotations, initialQuotations } from '@/lib/quotations'
import {
  calculateLineAmount,
  calculateOrderTotal,
  formatCurrency,
} from '@/lib/purchaseOrders'
import { cn } from '@/lib/utils'
import { Check, CheckCircle2, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'

interface PurchaseOrderFormProps {
  order: PurchaseOrder
  readOnly?: boolean
  onChange: (order: PurchaseOrder) => void
  onSave: () => void
  onPrint?: () => void
  onCancel: () => void
  onDelete?: () => void
  onCreateOutslip?: () => void
  outslipMessage?: string | null
  onStatusChange?: (order: PurchaseOrder, status: PurchaseOrderStatus) => void
}

export function PurchaseOrderForm({
  order,
  readOnly = false,
  onChange,
  onSave,
  onPrint,
  onCancel,
  onDelete,
  onCreateOutslip,
  outslipMessage,
  onStatusChange,
}: PurchaseOrderFormProps) {
  const customers = useSetupCustomers()
  const suppliers = useSetupSuppliers()
  const catalogItems = useSetupItems()
  const quotations = useMemo(() => loadQuotations(initialQuotations), [])
  const total = useMemo(() => calculateOrderTotal(order.items), [order.items])

  useEffect(() => {
    if (order.customerId || !order.customer.trim() || customers.length === 0) return

    const match = customers.find(
      (row) => row.name.toLowerCase() === order.customer.trim().toLowerCase(),
    )
    if (!match) return

    onChange({
      ...order,
      customerId: match.id,
      customerAddress: match.address?.trim() || order.customerAddress,
      customerPhone: match.phone?.trim() || order.customerPhone,
      customerTin: match.tin?.trim() || order.customerTin,
    })
  }, [customers, order.customerId, order.customer])

  useEffect(() => {
    if (order.supplierId || !order.supplier.trim() || suppliers.length === 0) return

    const match = suppliers.find(
      (row) => row.name.toLowerCase() === order.supplier.trim().toLowerCase(),
    )
    if (!match) return

    onChange({
      ...order,
      supplierId: match.id,
      supplierAddress: match.address?.trim() || order.supplierAddress,
      supplierPhone: match.phone?.trim() || order.supplierPhone,
    })
  }, [suppliers, order.supplierId, order.supplier])

  function updateField<K extends keyof PurchaseOrder>(key: K, value: PurchaseOrder[K]) {
    onChange({ ...order, [key]: value })
  }

  function updateSupplier(supplierId: string) {
    const supplier = suppliers.find((row) => row.id === supplierId)
    onChange({
      ...order,
      supplierId,
      supplier: supplier?.name ?? '',
      supplierAddress: supplier?.address?.trim() || '',
      supplierPhone: supplier?.phone?.trim() || '',
      supplierTin: supplierId ? order.supplierTin : '',
    })
  }

  function updateCustomer(customerId: string) {
    const customer = customers.find((row) => row.id === customerId)
    onChange({
      ...order,
      customerId,
      customer: customer?.name ?? '',
      customerAddress: customer?.address?.trim() || '',
      customerPhone: customer?.phone?.trim() || '',
      customerTin: customer?.tin?.trim() || '',
    })
  }

  function updateItem(index: number, patch: Partial<PurchaseOrderLineItem>) {
    const items = order.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const next = { ...item, ...patch }
      next.amount = calculateLineAmount(next.quantity, next.unitPrice)
      return next
    })
    onChange({ ...order, items, amount: calculateOrderTotal(items) })
  }

  function addItemFromCatalog(itemId: string) {
    const catalog = catalogItems.find((row) => row.id === itemId)
    if (!catalog) return
    const items = [
      ...order.items,
      {
        id: crypto.randomUUID(),
        itemCode: catalog.code,
        itemName: catalog.name,
        unit: catalog.unit,
        quantity: 1,
        unitPrice: catalog.unitPrice,
        amount: catalog.unitPrice,
      },
    ]
    onChange({ ...order, items, amount: calculateOrderTotal(items) })
  }

  function removeItem(index: number) {
    const items = order.items.filter((_, itemIndex) => itemIndex !== index)
    onChange({ ...order, items, amount: calculateOrderTotal(items) })
  }

  function setStatus(status: PurchaseOrderStatus) {
    onChange({ ...order, status })
    onStatusChange?.(order, status)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{readOnly ? `Purchase Order ${order.poNo}` : `Edit ${order.poNo}`}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="PO Number">
            <Input value={order.poNo} disabled />
          </FormField>
          <FormField label="Date">
            <Input
              type="date"
              value={order.date}
              disabled={readOnly}
              onChange={(event) => updateField('date', event.target.value)}
            />
          </FormField>
          <FormField label="Reference Quotation">
            <select
              value={order.quotationRef ?? ''}
              disabled={readOnly}
              onChange={(event) => updateField('quotationRef', event.target.value)}
              className="flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm"
            >
              <option value="">No reference</option>
              {quotations.map((quotation) => (
                <option key={quotation.id} value={quotation.quotationNo}>
                  {quotation.quotationNo} — {quotation.customerName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            {readOnly ? (
              <Input
                value={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                disabled
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  title="Approve"
                  aria-label={`Approve ${order.poNo}`}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition',
                    order.status === 'approved'
                      ? 'border-success-text bg-success-bg text-success-text'
                      : 'border-border text-text-secondary hover:border-success-text hover:bg-success-bg hover:text-success-text',
                  )}
                  onClick={() => setStatus('approved')}
                >
                  <Check className="h-3.5 w-3.5" />
                  Approved
                </button>
                <button
                  type="button"
                  title="Complete"
                  aria-label={`Complete ${order.poNo}`}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition',
                    order.status === 'completed'
                      ? 'border-maroon bg-maroon-light text-maroon'
                      : 'border-border text-text-secondary hover:border-maroon hover:bg-maroon-light hover:text-maroon',
                  )}
                  onClick={() => setStatus('completed')}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </button>
              </div>
            )}
          </FormField>
          <FormField label="Supplier">
            <select
              value={order.supplierId || (order.supplier ? '__legacy__' : '')}
              disabled={readOnly}
              onChange={(event) => {
                if (event.target.value === '__legacy__') return
                updateSupplier(event.target.value)
              }}
              className={cn(
                'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary',
                'focus-visible:outline-none focus-visible:border-maroon focus-visible:ring-2 focus-visible:ring-maroon-light',
                readOnly && 'cursor-not-allowed opacity-70',
              )}
            >
              <option value="">Select supplier</option>
              {!order.supplierId && order.supplier ? (
                <option value="__legacy__">{order.supplier}</option>
              ) : null}
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Supplier Address">
            <Input
              value={order.supplierAddress}
              disabled={readOnly}
              onChange={(event) => updateField('supplierAddress', event.target.value)}
            />
          </FormField>
          <FormField label="Supplier Telephone">
            <Input
              value={order.supplierPhone}
              disabled={readOnly}
              onChange={(event) => updateField('supplierPhone', event.target.value)}
            />
          </FormField>
          <FormField label="Supplier TIN">
            <Input
              value={order.supplierTin}
              disabled={readOnly}
              onChange={(event) => updateField('supplierTin', event.target.value)}
            />
          </FormField>
          <FormField label="Customer">
            <select
              value={order.customerId}
              disabled={readOnly}
              onChange={(event) => updateCustomer(event.target.value)}
              className={cn(
                'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary',
                'focus-visible:outline-none focus-visible:border-maroon focus-visible:ring-2 focus-visible:ring-maroon-light',
                readOnly && 'cursor-not-allowed opacity-70',
              )}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Project">
            <Input
              value={order.project}
              disabled={readOnly}
              onChange={(event) => updateField('project', event.target.value)}
            />
          </FormField>
          <FormField label="Branch">
            <Input
              value={order.branch}
              disabled={readOnly}
              onChange={(event) => updateField('branch', event.target.value)}
            />
          </FormField>
          <FormField label="Place of Delivery">
            <Input
              value={order.destination}
              disabled={readOnly}
              onChange={(event) => updateField('destination', event.target.value)}
            />
          </FormField>
          <FormField label="Delivery Term">
            <Input
              value={order.deliveryTerm}
              disabled={readOnly}
              onChange={(event) => updateField('deliveryTerm', event.target.value)}
            />
          </FormField>
          <FormField label="Date of Delivery">
            <Input
              type="date"
              value={order.deliveryDate}
              disabled={readOnly}
              onChange={(event) => updateField('deliveryDate', event.target.value)}
            />
          </FormField>
          <FormField label="Payment Term">
            <Input
              value={order.paymentTerm}
              disabled={readOnly}
              onChange={(event) => updateField('paymentTerm', event.target.value)}
            />
          </FormField>
          <FormField label="Warranty Period">
            <Input
              value={order.warrantyPeriod}
              disabled={readOnly}
              onChange={(event) => updateField('warrantyPeriod', event.target.value)}
            />
          </FormField>
          <FormField label="Remarks" className="md:col-span-2">
            <textarea
              value={order.remarks}
              disabled={readOnly}
              onChange={(event) => updateField('remarks', event.target.value)}
              className="min-h-24 w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm"
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          {!readOnly ? (
            <select
              defaultValue=""
              onChange={(event) => {
                addItemFromCatalog(event.target.value)
                event.currentTarget.value = ''
              }}
              className="rounded-md border border-border-input bg-surface px-3 py-2 text-sm"
            >
              <option value="">Add item from catalog...</option>
              {catalogItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} — {item.name}
                </option>
              ))}
            </select>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {order.items.length === 0 ? (
            <p className="text-sm text-text-secondary">No line items yet.</p>
          ) : (
            order.items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 md:grid-cols-6"
              >
                <FormField label="Item Code" className="md:col-span-1">
                  <Input
                    value={item.itemCode}
                    disabled={readOnly}
                    onChange={(event) => updateItem(index, { itemCode: event.target.value })}
                  />
                </FormField>
                <FormField label="Item Name" className="md:col-span-2">
                  <Input
                    value={item.itemName}
                    disabled={readOnly}
                    onChange={(event) => updateItem(index, { itemName: event.target.value })}
                  />
                </FormField>
                <FormField label="Qty">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateItem(index, { quantity: Number(event.target.value) || 0 })
                    }
                  />
                </FormField>
                <FormField label="Unit Price">
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateItem(index, { unitPrice: Number(event.target.value) || 0 })
                    }
                  />
                </FormField>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wide text-text-secondary">Amount</p>
                    <p className="text-sm font-medium">{formatCurrency(item.amount)}</p>
                  </div>
                  {!readOnly ? (
                    <button
                      type="button"
                      className="rounded-md p-2 text-text-secondary hover:bg-error-bg hover:text-error-text"
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}

          <div className="flex justify-end border-t border-border pt-4">
            <p className="text-base font-semibold">Total: {formatCurrency(total)}</p>
          </div>
        </CardContent>
      </Card>

      {outslipMessage ? (
        <p className={cn('text-sm', outslipMessage.includes('created') ? 'text-green-700' : 'text-error-text')}>
          {outslipMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {readOnly ? 'Back to List' : 'Cancel'}
        </Button>
        {!readOnly ? (
          <Button type="button" onClick={onSave}>
            Save
          </Button>
        ) : null}
        {!readOnly && onDelete ? (
          <Button type="button" variant="secondary" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
        {onPrint ? (
          <Button type="button" variant="secondary" onClick={onPrint}>
            Print
          </Button>
        ) : null}
        {onCreateOutslip && order.status === 'approved' && !order.outslipId ? (
          <Button type="button" onClick={onCreateOutslip}>
            Create Outslip
          </Button>
        ) : null}
      </div>
    </div>
  )
}
