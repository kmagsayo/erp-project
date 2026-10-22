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
import type { GatePass } from '@/data/erpTypes'
import { formatDisplayDate, gatePassStatusLabel } from '@/lib/gatePasses'
import { Printer } from 'lucide-react'

const statusBadge: Record<GatePass['status'], 'approved' | 'cancelled'> = {
  approved: 'approved',
  cancelled: 'cancelled',
}

interface GatePassTableProps {
  gatePasses: GatePass[]
  selectedId: string | null
  onSelect: (gatePass: GatePass) => void
  onPrint: (gatePass: GatePass) => void
}

function itemCountLabel(count: number) {
  return count === 1 ? '1 item' : `${count} items`
}

export function GatePassTable({
  gatePasses,
  selectedId,
  onSelect,
  onPrint,
}: GatePassTableProps) {
  if (gatePasses.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm font-medium text-text-primary">No gate passes yet.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Create a Gate Pass from a released Outslip.
        </p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Gate Pass No.</TableHead>
          <TableHead>Outslip No.</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Items</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {gatePasses.map((gatePass) => {
          const selected = selectedId === gatePass.id
          return (
            <TableRow
              key={gatePass.id}
              className={selected ? 'bg-maroon-light hover:bg-maroon-light' : undefined}
            >
              <TableCell>
                <TableLink
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(gatePass)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(gatePass)
                    }
                  }}
                >
                  {gatePass.id}
                </TableLink>
              </TableCell>
              <TableCell>{gatePass.outslipId}</TableCell>
              <TableCell>{gatePass.customer}</TableCell>
              <TableCell>{formatDisplayDate(gatePass.date)}</TableCell>
              <TableCell>{itemCountLabel(gatePass.items.length)}</TableCell>
              <TableCell className="text-center">
                <Badge variant={statusBadge[gatePass.status]}>
                  {gatePassStatusLabel[gatePass.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className="rounded-md p-2 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                    aria-label={`Print ${gatePass.id}`}
                    onClick={() => onPrint(gatePass)}
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
  )
}
