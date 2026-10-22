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
import type { Outslip, OutslipStatus } from '@/data/erpTypes'
import { formatDisplayDate, outslipListStatusLabel } from '@/lib/outslips'
import { formatReceivingReference } from '@/lib/receivings'
import { cn } from '@/lib/utils'
import { Printer } from 'lucide-react'

const statusBadge: Record<OutslipStatus, 'draft' | 'pending' | 'approved' | 'released' | 'cancelled'> =
  {
    draft: 'draft',
    pending: 'pending',
    approved: 'approved',
    released: 'released',
    cancelled: 'cancelled',
  }

interface OutslipTableProps {
  outslips: Outslip[]
  selectedId: string | null
  onSelect: (outslip: Outslip) => void
  onPrint: (outslip: Outslip) => void
}

function itemCountLabel(count: number) {
  return count === 1 ? '1 item' : `${count} items`
}

export function OutslipTable({ outslips, selectedId, onSelect, onPrint }: OutslipTableProps) {
  if (outslips.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm text-text-secondary">
          No outslips match your search or filters.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Outslip No.</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {outslips.map((outslip) => {
          const isSelected = selectedId === outslip.id
          return (
            <TableRow
              key={outslip.id}
              className={cn(isSelected ? 'bg-maroon-light hover:bg-maroon-light' : undefined)}
            >
              <TableCell>
                <TableLink onClick={() => onSelect(outslip)}>{outslip.id}</TableLink>
              </TableCell>
              <TableCell>
                {outslip.receivingId
                  ? formatReceivingReference(outslip.receivingId)
                  : outslip.poId || '—'}
              </TableCell>
              <TableCell>{outslip.customer}</TableCell>
              <TableCell>{formatDisplayDate(outslip.date)}</TableCell>
              <TableCell>{itemCountLabel(outslip.items.length)}</TableCell>
              <TableCell className="text-center">
                <Badge variant={statusBadge[outslip.status]}>
                  {outslipListStatusLabel[outslip.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <button
                  type="button"
                  className="rounded-md p-2 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                  aria-label={`Print ${outslip.id}`}
                  onClick={() => onPrint(outslip)}
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
