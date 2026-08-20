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
import type { OutslipStatus } from '@/data/erpTypes'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const statusVariant = {
  approved: 'approved',
  pending: 'pending',
  draft: 'draft',
  released: 'released',
} as const

export function OutslipsPage() {
  const { outslips, updateOutslipStatus } = useErp()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState(params.get('id') ?? outslips[0]?.id)
  const [message, setMessage] = useState<string | null>(null)
  const selected = outslips.find((row) => row.id === selectedId)

  useEffect(() => {
    const fromUrl = params.get('id')
    if (fromUrl) setSelectedId(fromUrl)
  }, [params])

  function handleStatus(status: OutslipStatus) {
    if (!selected) return
    const result = updateOutslipStatus(selected.id, status)
    setMessage(result.error ?? `Outslip ${selected.id} is now ${status.toUpperCase()}.`)
  }

  return (
    <div>
      <PageHeader
        title="Outslips"
        description="Created from an approved Purchase Order. Released outslips post stock-out movement."
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {outslips.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-text-secondary">
                No outslips yet. Open an approved Purchase Order and click Create Outslip.
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Outslip No.</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outslips.map((row) => (
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
                      <TableLink onClick={() => navigate('/purchase-orders')}>
                        {row.poId}
                      </TableLink>
                    </TableCell>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.project}</TableCell>
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
            <WorkflowTracker stages={workflowStages('Outslip')} />
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Outslip {selected.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <p><span className="text-text-secondary">Date:</span> {selected.date}</p>
              <p><span className="text-text-secondary">Reference PO:</span> {selected.poId}</p>
              <p><span className="text-text-secondary">Supplier:</span> {selected.supplier}</p>
              <p><span className="text-text-secondary">Customer:</span> {selected.customer}</p>
              <p><span className="text-text-secondary">Project:</span> {selected.project}</p>
              <p><span className="text-text-secondary">Branch:</span> {selected.branch}</p>
              <p><span className="text-text-secondary">Warehouse:</span> {selected.warehouse}</p>
              <p><span className="text-text-secondary">Destination:</span> {selected.destination}</p>
              <p><span className="text-text-secondary">Prepared By:</span> {selected.preparedBy}</p>
              <p><span className="text-text-secondary">Released By:</span> {selected.releasedBy || '—'}</p>
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

            {message && <p className="mt-3 text-sm text-text-secondary">{message}</p>}

            <div className="mt-4 flex flex-wrap gap-3">
              {selected.status === 'draft' && (
                <Button size="sm" onClick={() => handleStatus('pending')}>
                  Submit
                </Button>
              )}
              {selected.status === 'pending' && (
                <Button size="sm" onClick={() => handleStatus('approved')}>
                  Approve
                </Button>
              )}
              {selected.status === 'approved' && (
                <Button size="sm" onClick={() => handleStatus('released')}>
                  Release
                </Button>
              )}
              {selected.status === 'released' && (
                <Button size="sm" onClick={() => navigate(`/inventory?outslip=${selected.id}`)}>
                  View Inventory & Reports
                </Button>
              )}
              {selected.status === 'released' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/delivery-receipts?from=${selected.id}`)}
                >
                  Create Delivery Receipt
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
