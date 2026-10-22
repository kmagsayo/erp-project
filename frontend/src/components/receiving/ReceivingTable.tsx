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
import type { Receiving, ReceivingStatus } from '@/data/erpTypes'
import { formatDisplayDate, receivingListStatusLabel } from '@/lib/receivings'
import { cn } from '@/lib/utils'
import { Printer } from 'lucide-react'

const statusBadge: Record<ReceivingStatus, 'pending' | 'completed'> = {
  pending: 'pending',
  completed: 'completed',
}

interface ReceivingTableProps {
  receivings: Receiving[]
  highlightedId: string | null
  onSelect: (receiving: Receiving) => void
  onPrint: (receiving: Receiving) => void
}

export function ReceivingTable({
  receivings,
  highlightedId,
  onSelect,
  onPrint,
}: ReceivingTableProps) {
  if (receivings.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm text-text-secondary">
          No receiving records yet. Open an approved Purchase Order to create one.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Receiving No.</TableHead>
          <TableHead>Purchase Order</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {receivings.map((receiving) => {
          const isHighlighted = highlightedId === receiving.id
          return (
            <TableRow
              key={receiving.id}
              className={cn(
                isHighlighted
                  ? 'bg-maroon-light transition-none hover:bg-maroon-light'
                  : undefined,
              )}
            >
              <TableCell className="font-medium">
                <TableLink
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(receiving)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(receiving)
                    }
                  }}
                >
                  {receiving.id}
                </TableLink>
              </TableCell>
              <TableCell>{receiving.poId || '—'}</TableCell>
              <TableCell>{receiving.supplier || '—'}</TableCell>
              <TableCell>{formatDisplayDate(receiving.date)}</TableCell>
              <TableCell className="text-center">
                <Badge variant={statusBadge[receiving.status]}>
                  {receivingListStatusLabel[receiving.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <button
                  type="button"
                  className="rounded-md p-2 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                  aria-label={`Print ${receiving.id}`}
                  onClick={() => onPrint(receiving)}
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
