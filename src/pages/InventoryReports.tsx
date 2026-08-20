import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLink,
  TableRow,
} from '@/components/ui/table'
import { WorkflowTracker } from '@/components/workflow/WorkflowTracker'
import { workflowStages } from '@/config/workflow'
import { getStockLevels, useErp } from '@/data/erpStore'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function InventoryReportsPage() {
  const { movements, outslips, createDeliveryReceiptFromOutslip } = useErp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<string | null>(null)

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

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
        <Card>
          <CardContent className="pt-4">
            <h2 className="mb-3 text-base font-semibold text-text-primary">Workflow</h2>
            <WorkflowTracker stages={workflowStages('Inventory & Reports')} />
          </CardContent>
        </Card>
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
                  {outslip?.status === 'released' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCreateDeliveryReceipt(outslip.id)}
                    >
                      Create DR
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {message && <p className="mt-3 text-sm text-text-secondary">{message}</p>}
    </div>
  )
}
