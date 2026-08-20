import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLink,
  TableRow,
} from '@/components/ui/table'
import {
  AlertCircle,
  ClipboardList,
  FileText,
  Package,
  ShoppingCart,
} from 'lucide-react'

const stats = [
  {
    label: 'Pending Quotations',
    value: '8',
    change: '+3 from last week',
    icon: FileText,
  },
  {
    label: 'Open Purchase Orders',
    value: '5',
    change: '+1 from last week',
    icon: ShoppingCart,
  },
  {
    label: 'Pending Outslips',
    value: '2',
    change: 'Awaiting release',
    icon: ClipboardList,
  },
  {
    label: 'Inventory items',
    value: '2',
    change: 'See Inventory & Reports',
    icon: Package,
  },
]

const recentTransactions = [
  {
    id: 'QTN-00001',
    type: 'Quotation',
    customer: 'ABC Corporation',
    amount: '₱400,000',
    status: 'pending' as const,
  },
  {
    id: 'PO-000123',
    type: 'Purchase Order',
    customer: 'ABC Corporation',
    amount: '₱400,000',
    status: 'approved' as const,
  },
  {
    id: 'OS-000123',
    type: 'Outslip',
    customer: 'ABC Corporation',
    amount: '—',
    status: 'draft' as const,
  },
  {
    id: 'QTN-00002',
    type: 'Quotation',
    customer: 'XYZ Industries',
    amount: '₱250,000',
    status: 'draft' as const,
  },
]

const needsAttention = [
  'Approved PO-000123 is ready for Create Outslip',
  'Release outslips to post inventory records',
  'Create Delivery Receipt after Inventory & Reports',
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

export function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of current transactions and workflow status."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-text-primary">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">{stat.change}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-light">
                  <stat.icon className="h-5 w-5 text-maroon" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold text-text-primary">
            Recent Transactions
          </h2>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Document No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <TableLink>{tx.id}</TableLink>
                  </TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>{tx.customer}</TableCell>
                  <TableCell>{tx.amount}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadge[tx.status]}>
                      {statusLabel[tx.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold text-text-primary">
            Needs Attention
          </h2>
          <Card>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {needsAttention.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-primary">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-maroon" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
