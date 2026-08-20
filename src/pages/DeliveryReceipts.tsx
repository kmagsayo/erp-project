import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useErp } from '@/data/erpStore'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const statusVariant = {
  approved: 'approved',
  pending: 'pending',
  draft: 'draft',
} as const

export function DeliveryReceiptsPage() {
  const { deliveryReceipts, createDeliveryReceiptFromOutslip, outslips } = useErp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(params.get('id') ?? deliveryReceipts[0]?.id)
  const [message, setMessage] = useState<string | null>(null)
  const createdFrom = useRef<string | null>(null)
  const selected = deliveryReceipts.find((row) => row.id === selectedId)

  useEffect(() => {
    const fromOutslip = params.get('from')
    const byId = params.get('id')
    if (byId) {
      setSelectedId(byId)
      return
    }
    if (!fromOutslip) return

    const existing = deliveryReceipts.find((row) => row.outslipId === fromOutslip)
    if (existing) {
      setSelectedId(existing.id)
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
    if (result.receipt) setSelectedId(result.receipt.id)
  }, [params, deliveryReceipts, createDeliveryReceiptFromOutslip])

  return (
    <div>
      <PageHeader
        title="Delivery Receipts"
        description="Created from a released Outslip after inventory is recorded."
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {deliveryReceipts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-text-secondary">
                No delivery receipts yet. Release an Outslip, then create a Delivery Receipt
                from Inventory & Reports or the Outslip.
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>DR Number</TableHead>
                  <TableHead>Outslip</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryReceipts.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      row.id === selectedId ? 'bg-maroon-light hover:bg-maroon-light' : undefined
                    }
                  >
                    <TableCell>
                      <TableLink onClick={() => setSelectedId(row.id)}>{row.id}</TableLink>
                    </TableCell>
                    <TableCell>
                      <TableLink onClick={() => navigate(`/outslips?id=${row.outslipId}`)}>
                        {row.outslipId}
                      </TableLink>
                    </TableCell>
                    <TableCell>
                      <TableLink onClick={() => navigate('/purchase-orders')}>{row.poId}</TableLink>
                    </TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[row.status]}>
                        {row.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Workflow Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowTracker stages={workflowStages('Delivery Receipt')} />
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Delivery Receipt {selected.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <p><span className="text-text-secondary">Date:</span> {selected.date}</p>
              <p><span className="text-text-secondary">Outslip:</span> {selected.outslipId}</p>
              <p><span className="text-text-secondary">PO Number:</span> {selected.poId}</p>
              <p><span className="text-text-secondary">Customer:</span> {selected.customer}</p>
              <p><span className="text-text-secondary">Project:</span> {selected.project}</p>
              <p><span className="text-text-secondary">Branch:</span> {selected.branch}</p>
              <p className="sm:col-span-2">
                <span className="text-text-secondary">Destination:</span> {selected.destination}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item Code</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selected.items.map((item) => (
                  <TableRow key={item.itemCode}>
                    <TableCell>{item.itemCode}</TableCell>
                    <TableCell>{item.item}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {message && <p className="mt-3 text-sm text-text-secondary">{message}</p>}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                size="sm"
                onClick={() => navigate(`/accomplishments?dr=${selected.id}`)}
              >
                Create Accomplishment Report
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/inventory')}
              >
                Back to Inventory & Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {deliveryReceipts.length === 0 && outslips.some((row) => row.status === 'released') && (
        <p className="mt-4 text-sm text-text-secondary">
          A released outslip is ready. Open it and click Create Delivery Receipt.
        </p>
      )}
    </div>
  )
}
