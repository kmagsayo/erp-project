import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { WorkflowTracker } from '@/components/workflow/WorkflowTracker'
import { workflowStages } from '@/config/workflow'
import { Plus } from 'lucide-react'

const quotations = [
  {
    id: 'QTN-00001',
    customer: 'ABC Corporation',
    date: 'Aug 18, 2026',
    amount: '₱400,000',
    status: 'approved' as const,
  },
  {
    id: 'QTN-00002',
    customer: 'XYZ Industries',
    date: 'Aug 18, 2026',
    amount: '₱250,000',
    status: 'pending' as const,
  },
  {
    id: 'QTN-00003',
    customer: 'Global Tech Inc.',
    date: 'Aug 17, 2026',
    amount: '₱180,000',
    status: 'draft' as const,
  },
]

const statusBadge = {
  approved: 'approved' as const,
  pending: 'pending' as const,
  draft: 'draft' as const,
}

const statusLabel = {
  approved: 'Approved',
  pending: 'Pending',
  draft: 'Draft',
}

export function QuotationsPage() {
  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Create and manage customer quotations."
        action={
          <Button>
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Quotation No.</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <TableLink>{q.id}</TableLink>
                  </TableCell>
                  <TableCell>{q.customer}</TableCell>
                  <TableCell>{q.date}</TableCell>
                  <TableCell>{q.amount}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[q.status]}>
                      {statusLabel[q.status]}
                    </Badge>
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
            <WorkflowTracker stages={workflowStages('Quotation')} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quotation Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Quotation No.">
              <Input value="QTN-00001" readOnly />
            </FormField>
            <FormField label="Date">
              <Input value="Aug 19, 2026" readOnly />
            </FormField>
            <FormField label="Customer" className="sm:col-span-2">
              <Input value="ABC Corporation" readOnly />
            </FormField>
          </div>
          <div className="mt-4 flex gap-3">
            <Button>Save</Button>
            <Button variant="secondary">Preview</Button>
            <Button variant="secondary">Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
