import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getStockLevels, useErp } from '@/data/erpStore'
import type { QuotationStatus } from '@/data/quotationTypes'
import {
  formatCurrency,
  initialQuotations,
  loadQuotations,
} from '@/lib/quotations'
import {
  ClipboardList,
  FileText,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const statusBadge = {
  approved: 'approved' as const,
  pending: 'pending' as const,
  draft: 'draft' as const,
  rejected: 'rejected' as const,
  completed: 'completed' as const,
}

const statusLabel = {
  approved: 'Approved',
  pending: 'Pending',
  draft: 'Draft',
  rejected: 'Rejected',
  completed: 'Completed',
}

function parseDisplayDate(value: string): number {
  const iso = Date.parse(`${value}T00:00:00`)
  if (!Number.isNaN(iso)) return iso
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function DashboardPage() {
  const { purchaseOrders, outslips, movements, gatePasses } = useErp()
  const [quotations, setQuotations] = useState(() =>
    loadQuotations(initialQuotations),
  )

  useEffect(() => {
    function refreshQuotations() {
      setQuotations(loadQuotations(initialQuotations))
    }

    refreshQuotations()
    window.addEventListener('erp-quotations-updated', refreshQuotations)
    window.addEventListener('storage', refreshQuotations)
    window.addEventListener('focus', refreshQuotations)

    return () => {
      window.removeEventListener('erp-quotations-updated', refreshQuotations)
      window.removeEventListener('storage', refreshQuotations)
      window.removeEventListener('focus', refreshQuotations)
    }
  }, [])

  const pendingQuotations = quotations.filter(
    (quotation) => quotation.status === 'pending',
  ).length

  const openPurchaseOrders = purchaseOrders.filter(
    (po) => po.status === 'approved' && !po.receivingId,
  ).length

  const pendingOutslips = outslips.filter(
    (outslip) => outslip.status !== 'released',
  ).length

  const inventoryItemCount = getStockLevels(movements).length

  const stats = [
    {
      label: 'Pending Quotations',
      value: String(pendingQuotations),
      change: `${quotations.length} total quotation${quotations.length === 1 ? '' : 's'}`,
      icon: FileText,
    },
    {
      label: 'Open Purchase Orders',
      value: String(openPurchaseOrders),
      change: `${purchaseOrders.length} total purchase order${purchaseOrders.length === 1 ? '' : 's'}`,
      icon: ShoppingCart,
    },
    {
      label: 'Pending Outslips',
      value: String(pendingOutslips),
      change:
        pendingOutslips > 0 ? 'Awaiting release' : 'No pending outslips',
      icon: ClipboardList,
    },
    {
      label: 'Inventory items',
      value: String(inventoryItemCount),
      change: 'See Inventory & Reports',
      icon: Package,
    },
  ]

  const recentTransactions = useMemo(() => {
    type RowStatus = QuotationStatus | 'approved' | 'pending' | 'draft' | 'completed'

    const rows: Array<{
      id: string
      type: string
      customer: string
      amount: string
      status: RowStatus
      sortDate: number
      link: string
    }> = [
      ...quotations.map((quotation) => ({
        id: quotation.quotationNo,
        type: 'Quotation',
        customer: quotation.customerName,
        amount: formatCurrency(quotation.total),
        status: quotation.status,
        sortDate: parseDisplayDate(quotation.date),
        link: '/quotations',
      })),
      ...purchaseOrders.map((po) => ({
        id: po.poNo,
        type: 'Purchase Order',
        customer: po.supplier,
        amount: formatCurrency(po.amount),
        status: po.status,
        sortDate: parseDisplayDate(po.date),
        link: '/purchase-orders',
      })),
      ...outslips.map((outslip) => ({
        id: outslip.id,
        type: 'Outslip',
        customer: outslip.customer,
        amount: '—',
        status:
          outslip.status === 'released' || outslip.status === 'approved'
            ? ('approved' as const)
            : outslip.status === 'pending'
              ? ('pending' as const)
              : ('draft' as const),
        sortDate: parseDisplayDate(outslip.date),
        link: '/outslips',
      })),
      ...gatePasses.map((gatePass) => ({
        id: gatePass.id,
        type: 'Gate Pass',
        customer: gatePass.customer,
        amount: '—',
        status:
          gatePass.status === 'approved' ? ('approved' as const) : ('draft' as const),
        sortDate: parseDisplayDate(gatePass.date),
        link: '/gate-passes',
      })),
    ]

    return rows
      .sort((a, b) => b.sortDate - a.sortDate)
      .slice(0, 5)
  }, [quotations, purchaseOrders, outslips, gatePasses])

  return (
    <div>
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

      <div>
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
            {recentTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-text-secondary">
                  No transactions yet.
                </TableCell>
              </TableRow>
            ) : (
              recentTransactions.map((tx) => (
                <TableRow key={`${tx.type}-${tx.id}`}>
                  <TableCell>
                    <Link
                      to={tx.link}
                      className="font-medium text-maroon hover:text-maroon-dark"
                    >
                      {tx.id}
                    </Link>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
