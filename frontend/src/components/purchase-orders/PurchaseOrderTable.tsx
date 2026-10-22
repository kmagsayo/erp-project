import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLink,
  TableRow,
} from '@/components/ui/table'
import type {
  PurchaseOrder,
  PurchaseOrderSortField,
  SortDirection,
} from '@/data/purchaseOrderTypes'
import { formatCurrency, formatDisplayDate } from '@/lib/purchaseOrders'
import { cn } from '@/lib/utils'
import { Printer } from 'lucide-react'

const statusBadge = {
  approved: 'approved' as const,
  completed: 'completed' as const,
}

const statusLabel = {
  approved: 'Approved',
  completed: 'Completed',
}

interface PurchaseOrderTableProps {
  orders: PurchaseOrder[]
  selectedId: string | null
  sortField: PurchaseOrderSortField
  sortDirection: SortDirection
  onSort: (field: PurchaseOrderSortField) => void
  onSelect: (order: PurchaseOrder) => void
  onPrint: (order: PurchaseOrder) => void
}

function SortableHead({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className,
}: {
  label: string
  field: PurchaseOrderSortField
  sortField: PurchaseOrderSortField
  sortDirection: SortDirection
  onSort: (field: PurchaseOrderSortField) => void
  className?: string
}) {
  const active = sortField === field
  return (
    <TableHead className={className}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 font-medium uppercase tracking-wide',
          active ? 'text-maroon' : 'text-text-secondary',
        )}
        onClick={() => onSort(field)}
      >
        {label}
        {active ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : null}
      </button>
    </TableHead>
  )
}

export function PurchaseOrderTable({
  orders,
  selectedId,
  sortField,
  sortDirection,
  onSort,
  onSelect,
  onPrint,
}: PurchaseOrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm text-text-secondary">
          No purchase orders match your search or filters.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead
            label="PO No."
            field="poNo"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHead>Reference</TableHead>
          <SortableHead
            label="Supplier"
            field="supplier"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHead
            label="Date"
            field="date"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHead
            label="Amount"
            field="amount"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            className="text-right"
          />
          <SortableHead
            label="Status"
            field="status"
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            className="text-center"
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const isSelected = selectedId === order.id
          return (
            <TableRow
              key={order.id}
              className={cn(
                isSelected ? 'bg-maroon-light hover:bg-maroon-light' : undefined,
              )}
            >
              <TableCell>
                <TableLink
                  onClick={() => onSelect(order)}
                >
                  {order.poNo}
                </TableLink>
              </TableCell>
              <TableCell>{order.quotationRef || '—'}</TableCell>
              <TableCell>{order.supplier}</TableCell>
              <TableCell>{formatDisplayDate(order.date)}</TableCell>
              <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
              <TableCell className="text-center">
                <Badge variant={statusBadge[order.status]}>
                  {statusLabel[order.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <button
                  type="button"
                  className="rounded-md p-2 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                  aria-label={`Print ${order.poNo}`}
                  onClick={() => onPrint(order)}
                >
                  <Printer className="h-4 w-4" />
                </button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
