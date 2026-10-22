import { PageHeader } from '@/components/layout/PageHeader'
import { AddButton } from '@/components/ui/add-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormField, Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLink,
  TableRow,
} from '@/components/ui/table'
import { getStockLevels, useErp } from '@/data/erpStore'
import type { MovementType } from '@/data/erpTypes'
import type { ItemSetup } from '@/data/setupTypes'
import { listAllItems } from '@/lib/setupsApi'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

const selectClassName =
  'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light'

function todayIsoDate() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function InventoryReportsPage() {
  const { movements, outslips, gatePasses, createDeliveryReceiptFromOutslip, addInventoryMovement } =
    useErp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [items, setItems] = useState<ItemSetup[]>([])
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState({
    itemId: '',
    quantity: '',
    movementType: 'STOCK IN' as MovementType,
    date: todayIsoDate(),
    warehouse: 'Main Warehouse',
  })

  useEffect(() => {
    if (!formOpen) return
    let cancelled = false
    listAllItems({ status: 'active' })
      .then((rows) => {
        if (!cancelled) setItems(rows)
      })
      .catch(() => {
        if (!cancelled) setItemsError('Could not load items from setup.')
      })
    return () => {
      cancelled = true
    }
  }, [formOpen])

  const stock = getStockLevels(movements)
  const totalQuantity = stock.reduce((sum, row) => sum + row.quantity, 0)

  const records = useMemo(() => {
    const text = query.trim().toLowerCase()
    return movements.filter((row) => {
      if (!text) return true
      return [
        row.item,
        row.itemCode,
        row.project,
        row.customer,
        row.poId,
        row.outslipId,
        row.warehouse,
      ]
        .join(' ')
        .toLowerCase()
        .includes(text)
    })
  }, [movements, query])

  function openAdd() {
    setForm({
      itemId: '',
      quantity: '',
      movementType: 'STOCK IN',
      date: todayIsoDate(),
      warehouse: 'Main Warehouse',
    })
    setFormError(null)
    setItemsError(null)
    setFormOpen(true)
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const item = items.find((row) => String(row.id) === form.itemId)
    if (!item) {
      setFormError('Select an item.')
      return
    }
    const result = addInventoryMovement({
      item: item.display_name || item.item_name,
      itemCode: item.item_code,
      unit: item.unit_of_measure?.name || 'pc',
      quantity: Number(form.quantity),
      movementType: form.movementType,
      date: form.date,
      warehouse: form.warehouse,
    })
    if (result.error) {
      setFormError(result.error)
      return
    }
    setFormOpen(false)
    setMessage(
      `${form.movementType === 'STOCK IN' ? 'Stock in' : 'Stock out'} saved for ${item.display_name || item.item_name}.`,
    )
  }

  function handleCreateDeliveryReceipt(outslipId: string) {
    if (outslipId === '—') return
    const result = createDeliveryReceiptFromOutslip(outslipId)
    if (result.error) {
      setMessage(result.error)
      return
    }
    navigate(`/delivery-receipts?id=${result.receipt?.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Inventory & Reports"
        description="Current stock and inventory records from released outslips, on one page."
        action={<AddButton label="Add Inventory" onClick={openAdd} />}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-text-secondary">Items</p>
            <p className="mt-2 text-3xl font-semibold text-text-primary">{stock.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-text-secondary">Total quantity on hand</p>
            <p className="mt-2 text-3xl font-semibold text-text-primary">{totalQuantity}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-text-secondary">Inventory records</p>
            <p className="mt-2 text-3xl font-semibold text-text-primary">{movements.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div>
          <h2 className="mb-3 text-base font-semibold text-text-primary">Current stock</h2>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Item Code</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((row) => (
                <TableRow key={row.itemCode}>
                  <TableCell>{row.itemCode}</TableCell>
                  <TableCell>{row.item}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text-primary">Inventory records</h2>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search item, PO, outslip, project…"
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>PO</TableHead>
            <TableHead>Outslip</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((row) => {
            const outslip = outslips.find((item) => item.id === row.outslipId)
            return (
              <TableRow key={row.id}>
                <TableCell>{row.date}</TableCell>
                <TableCell>
                  {row.item}
                  <div className="text-xs text-text-secondary">{row.itemCode}</div>
                </TableCell>
                <TableCell>
                  {row.quantity} {row.unit}
                  <div className="text-xs text-text-secondary">
                    {row.movementType === 'STOCK IN' ? 'Stock in' : 'Stock out'}
                  </div>
                </TableCell>
                <TableCell>{row.warehouse}</TableCell>
                <TableCell>{row.project}</TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell>
                  {row.poId !== '—' ? (
                    <TableLink onClick={() => navigate('/purchase-orders')}>{row.poId}</TableLink>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {row.outslipId !== '—' ? (
                    <TableLink onClick={() => navigate(`/outslips?id=${row.outslipId}`)}>
                      {row.outslipId}
                    </TableLink>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  {outslip?.status === 'released' &&
                    (gatePasses.some(
                      (row) => row.outslipId === outslip.id && row.status === 'approved',
                    ) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCreateDeliveryReceipt(outslip.id)}
                      >
                        Create DR
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          navigate(`/gate-passes?from=${encodeURIComponent(outslip.id)}`)
                        }
                      >
                        Create Gate Pass
                      </Button>
                    ))}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {message && <p className="mt-3 text-sm text-text-secondary">{message}</p>}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-text-primary">Add Inventory</h2>
            <form className="mt-4 space-y-3" onSubmit={handleAdd}>
              <FormField label="Item">
                <select
                  required
                  value={form.itemId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, itemId: event.target.value }))
                  }
                  className={selectClassName}
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.item_code} — {item.display_name || item.item_name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Type">
                <select
                  value={form.movementType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      movementType: event.target.value as MovementType,
                    }))
                  }
                  className={selectClassName}
                >
                  <option value="STOCK IN">Stock in</option>
                  <option value="STOCK OUT">Stock out</option>
                </select>
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Quantity">
                  <Input
                    required
                    type="number"
                    min={1}
                    step="1"
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, quantity: event.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Date">
                  <Input
                    required
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, date: event.target.value }))
                    }
                  />
                </FormField>
              </div>
              <FormField label="Warehouse">
                <Input
                  required
                  value={form.warehouse}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, warehouse: event.target.value }))
                  }
                />
              </FormField>
              {itemsError ? <p className="text-sm text-error-text">{itemsError}</p> : null}
              {formError ? <p className="text-sm text-error-text">{formError}</p> : null}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
