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
import { Printer } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusVariant = {
  approved: 'approved',
  pending: 'pending',
  draft: 'draft',
} as const

export function PurchaseOrdersPage() {
  const { purchaseOrders, createOutslipFromPO } = useErp()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(purchaseOrders[0]?.id)
  const [message, setMessage] = useState<string | null>(null)
  const selected = purchaseOrders.find((row) => row.id === selectedId)

  function handleCreateOutslip() {
    if (!selected) return
    const result = createOutslipFromPO(selected.id)
    if (result.error) {
      setMessage(result.error)
      return
    }
    navigate(`/outslips?id=${result.outslip?.id}`)
  }

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Approved purchase orders can create an Outslip without re-entering items."
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow
                  key={po.id}
                  className={
                    po.id === selectedId ? 'bg-maroon-light hover:bg-maroon-light' : undefined
                  }
                >
                  <TableCell>
                    <TableLink onClick={() => setSelectedId(po.id)}>{po.id}</TableLink>
                  </TableCell>
                  <TableCell>{po.supplier}</TableCell>
                  <TableCell>{po.customer}</TableCell>
                  <TableCell>{po.project}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[po.status]}>{po.status.toUpperCase()}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowTracker stages={workflowStages('Purchase Order')} />
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>
              Purchase Order {selected.id}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-text-secondary">
              Status:{' '}
              <Badge variant={statusVariant[selected.status]}>
                {selected.status.toUpperCase()}
              </Badge>
            </p>
            <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <p><span className="text-text-secondary">Supplier:</span> {selected.supplier}</p>
              <p><span className="text-text-secondary">Customer:</span> {selected.customer}</p>
              <p><span className="text-text-secondary">Project:</span> {selected.project}</p>
              <p><span className="text-text-secondary">Branch:</span> {selected.branch}</p>
              <p className="sm:col-span-2">
                <span className="text-text-secondary">Destination:</span> {selected.destination}
              </p>
              <p className="sm:col-span-2">
                <span className="text-text-secondary">Remarks:</span> {selected.remarks}
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

            {message && <p className="mt-3 text-sm text-error-text">{message}</p>}

            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" size="sm" onClick={() => setSelectedId(selected.id)}>
                View
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
              {selected.status === 'approved' && !selected.outslipId && (
                <Button size="sm" onClick={handleCreateOutslip}>
                  Create Outslip
                </Button>
              )}
              {selected.outslipId && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/outslips?id=${selected.outslipId}`)}
                >
                  Open Outslip
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
