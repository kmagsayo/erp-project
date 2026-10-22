import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormField, Input } from '@/components/ui/input'
import { ItemSearchField } from '@/components/ui/item-search-field'
import type { CatalogItem, Quotation, QuotationLineItem } from '@/data/quotationTypes'
import { useSetupCustomers } from '@/hooks/useSetupCustomers'
import { useSetupItems } from '@/hooks/useSetupItems'
import {
  calculateLineAmount,
  calculateTotals,
  formatCurrency,
} from '@/lib/quotations'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'

const MIN_ITEM_ROWS = 5

interface QuotationFormProps {
  quotation: Quotation
  readOnly?: boolean
  onChange: (quotation: Quotation) => void
  onSave: () => void
  onPrint?: () => void
  onCancel: () => void
  /** When true, render form body without outer Card chrome (for modal use). */
  hideCardChrome?: boolean
  formTitle?: string
}

export function QuotationForm({
  quotation,
  readOnly = false,
  onChange,
  onSave,
  onPrint,
  onCancel,
  hideCardChrome = false,
  formTitle,
}: QuotationFormProps) {
  const customers = useSetupCustomers()
  const catalogItems = useSetupItems()
  const totals = useMemo(
    () => calculateTotals(quotation.items, quotation.discount, quotation.tax),
    [quotation.items, quotation.discount, quotation.tax],
  )

  useEffect(() => {
    if (readOnly || catalogItems.length === 0 || quotation.items.length === 0) return

    let changed = false
    const items = quotation.items.map((item) => {
      if (item.unitPrice > 0) return item
      const catalog = catalogItems.find(
        (row) => row.id === item.itemId || row.code === item.itemCode,
      )
      if (!catalog || catalog.unitPrice <= 0) return item
      changed = true
      return {
        ...item,
        unitPrice: catalog.unitPrice,
        amount: calculateLineAmount(item.quantity, catalog.unitPrice),
      }
    })
    if (!changed) return
    const nextTotals = calculateTotals(items, quotation.discount, quotation.tax)
    onChange({ ...quotation, items, ...nextTotals })
  }, [catalogItems, readOnly])

  function updateField<K extends keyof Quotation>(key: K, value: Quotation[K]) {
    onChange({ ...quotation, [key]: value })
  }

  function updateCustomer(customerId: string) {
    const customer = customers.find((row) => row.id === customerId)
    onChange({
      ...quotation,
      customerId,
      customerName: customer?.name ?? '',
      customerAddress: customer?.address?.trim() || '',
      customerPhone: customer?.phone?.trim() || '',
      customerTin: customer?.tin?.trim() || '',
    })
  }

  function updateItem(index: number, patch: Partial<QuotationLineItem>) {
    const items = quotation.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const next = { ...item, ...patch }
      next.amount = calculateLineAmount(next.quantity, next.unitPrice)
      return next
    })
    const nextTotals = calculateTotals(items, quotation.discount, quotation.tax)
    onChange({ ...quotation, items, ...nextTotals })
  }

  function lineFromCatalog(catalog: CatalogItem, quantity: number, id?: string): QuotationLineItem {
    return {
      id: id ?? crypto.randomUUID(),
      itemId: catalog.id,
      itemCode: catalog.code,
      itemName: catalog.name,
      unit: catalog.unit,
      quantity,
      unitPrice: catalog.unitPrice,
      amount: calculateLineAmount(quantity, catalog.unitPrice),
    }
  }

  function assignItemToSlot(index: number, catalog: CatalogItem) {
    const existing = quotation.items[index]
    const quantity = existing?.quantity > 0 ? existing.quantity : 1
    const line = lineFromCatalog(catalog, quantity, existing?.id)
    const items = [...quotation.items]
    if (index < items.length) {
      items[index] = line
    } else {
      items.push(line)
    }
    const nextTotals = calculateTotals(items, quotation.discount, quotation.tax)
    onChange({ ...quotation, items, ...nextTotals })
  }

  function removeItem(index: number) {
    const items = quotation.items.filter((_, itemIndex) => itemIndex !== index)
    const nextTotals = calculateTotals(items, quotation.discount, quotation.tax)
    onChange({ ...quotation, items, ...nextTotals })
  }

  const title = formTitle ?? (readOnly ? 'View Quotation' : 'Quotation Form')
  const extraEmptyRow =
    !readOnly && quotation.items.length >= MIN_ITEM_ROWS ? 1 : 0
  const itemRowCount = Math.max(MIN_ITEM_ROWS, quotation.items.length + extraEmptyRow)
  const usedItemIds = quotation.items.map((row) => row.itemId)
  const body = (
    <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Quotation No.">
            <Input value={quotation.quotationNo} readOnly />
          </FormField>
          <FormField label="Date">
            <Input
              type="date"
              value={quotation.date}
              readOnly={readOnly}
              onChange={(event) => updateField('date', event.target.value)}
            />
          </FormField>
          <FormField label="Customer" className="sm:col-span-2">
            <select
              value={quotation.customerId}
              disabled={readOnly}
              onChange={(event) => updateCustomer(event.target.value)}
              className={cn(
                'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary',
                'focus-visible:outline-none focus-visible:border-maroon focus-visible:ring-2 focus-visible:ring-maroon-light',
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
          <FormField label="Customer Address" className="sm:col-span-2">
            <Input
              value={quotation.customerAddress}
              readOnly={readOnly}
              onChange={(event) => updateField('customerAddress', event.target.value)}
            />
          </FormField>
          <FormField label="Telephone No.">
            <Input
              value={quotation.customerPhone}
              readOnly={readOnly}
              onChange={(event) => updateField('customerPhone', event.target.value)}
            />
          </FormField>
          <FormField label="TIN No.">
            <Input
              value={quotation.customerTin}
              readOnly={readOnly}
              onChange={(event) => updateField('customerTin', event.target.value)}
            />
          </FormField>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-text-primary">Items</h3>
          <div className="space-y-3">
            {Array.from({ length: itemRowCount }, (_, index) => {
              const item = quotation.items[index]
              return (
                <div
                  key={item?.id ?? `empty-${index}-${quotation.items.length}`}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-3 sm:flex-row sm:items-end"
                >
                  <FormField label="Item" className="min-w-0 flex-1">
                    {readOnly ? (
                      <Input value={item ? `${item.itemName}` : ''} readOnly />
                    ) : (
                      <ItemSearchField
                        items={catalogItems}
                        selectedId={item?.itemId}
                        excludeIds={usedItemIds.filter((id) => id !== item?.itemId)}
                        onSelect={(catalog) => assignItemToSlot(index, catalog)}
                      />
                    )}
                  </FormField>
                  <FormField label="Qty" className="sm:w-20">
                    <Input
                      type="number"
                      min={1}
                      value={item?.quantity ?? 1}
                      readOnly={readOnly || !item}
                      onChange={(event) =>
                        updateItem(index, { quantity: Number(event.target.value) || 0 })
                      }
                      className="text-center"
                    />
                  </FormField>
                  <FormField label="Unit Price" className="sm:w-28">
                    <Input
                      type="number"
                      min={0}
                      value={item?.unitPrice ?? 0}
                      readOnly
                      className="text-center"
                    />
                  </FormField>
                  <FormField
                    label="Amount"
                    className="sm:min-w-20"
                    labelClassName="text-xs font-medium text-text-secondary"
                  >
                    <p className="flex h-9 items-center justify-end text-sm font-medium text-text-primary">
                      {formatCurrency(item?.amount ?? 0)}
                    </p>
                  </FormField>
                  {!readOnly ? (
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E8A0A0] text-maroon hover:bg-error-bg"
                      aria-label={item ? `Remove ${item.itemName}` : `Clear item row ${index + 1}`}
                      disabled={!item}
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <FormField label="Subject">
          <textarea
            value={quotation.subject}
            readOnly={readOnly}
            onChange={(event) => updateField('subject', event.target.value)}
            className="min-h-24 w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
          />
        </FormField>

        <div className="ml-auto max-w-sm rounded-lg border border-border bg-table-header p-4 text-sm">
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {!readOnly ? (
            <Button type="button" onClick={onSave}>
              Save
            </Button>
          ) : null}
          {readOnly && onPrint ? (
            <Button type="button" variant="secondary" onClick={onPrint}>
              Print
            </Button>
          ) : null}
          <Button type="button" variant="secondary" onClick={onCancel}>
            {readOnly ? 'Back to List' : 'Cancel'}
          </Button>
        </div>
    </div>
  )

  if (hideCardChrome) {
    return body
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
