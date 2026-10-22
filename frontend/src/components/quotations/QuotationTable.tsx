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
  Quotation,
  QuotationSortField,
  SortDirection,
} from '@/data/quotationTypes'
import { formatCurrency, formatDisplayDate } from '@/lib/quotations'
import { cn } from '@/lib/utils'
import { Check, Pencil, Printer, Trash2 } from 'lucide-react'

const statusBadge = {
  approved: 'approved' as const,
  pending: 'pending' as const,
  rejected: 'rejected' as const,
  draft: 'draft' as const,
}

const statusLabel = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  draft: 'Draft',
}

interface QuotationTableProps {
  quotations: Quotation[]
  selectedId: string | null
  sortField: QuotationSortField
  sortDirection: SortDirection
  onSort: (field: QuotationSortField) => void
  onSelect: (quotation: Quotation) => void
  onEdit: (quotation: Quotation) => void
  onDelete: (quotation: Quotation) => void
  onPrint: (quotation: Quotation) => void
  onApprove: (quotation: Quotation) => void
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
  field: QuotationSortField
  sortField: QuotationSortField
  sortDirection: SortDirection
  onSort: (field: QuotationSortField) => void
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

export function QuotationTable({
  quotations,
  selectedId,
  sortField,
  sortDirection,
  onSort,
  onSelect,
  onEdit,
  onDelete,
  onPrint,
  onApprove,
}: QuotationTableProps) {
  if (quotations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm text-text-secondary">
          No quotations match your search or filters.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHead
              label="Quotation No."
              field="quotationNo"
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            <SortableHead
              label="Customer"
              field="customerName"
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
              field="total"
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
          {quotations.map((quotation) => {
            const isSelected = selectedId === quotation.id
            return (
              <TableRow
                key={quotation.id}
                className={cn(isSelected ? 'bg-maroon-light hover:bg-maroon-light' : undefined)}
              >
                <TableCell>
                  <TableLink onClick={() => onSelect(quotation)}>
                    {quotation.quotationNo}
                  </TableLink>
                </TableCell>
                <TableCell>{quotation.customerName}</TableCell>
                <TableCell>{formatDisplayDate(quotation.date)}</TableCell>
                <TableCell className="text-right">{formatCurrency(quotation.total)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={statusBadge[quotation.status]}>
                    {statusLabel[quotation.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {quotation.status === 'pending' || quotation.status === 'draft' ? (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary hover:border-success-text hover:bg-success-bg hover:text-success-text"
                        aria-label={`Approve ${quotation.quotationNo}`}
                        title="Approve"
                        onClick={() => onApprove(quotation)}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-md p-2 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                      aria-label={`Edit ${quotation.quotationNo}`}
                      onClick={() => onEdit(quotation)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-text-secondary hover:bg-error-bg hover:text-error-text"
                      aria-label={`Delete ${quotation.quotationNo}`}
                      onClick={() => onDelete(quotation)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                      aria-label={`Print ${quotation.quotationNo}`}
                      onClick={() => onPrint(quotation)}
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
