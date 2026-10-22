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
import type { DeliveryReceipt } from '@/data/erpTypes'
import { formatDrDisplayDate, formatDrMoney } from '@/lib/deliveryReceipts'
import { Eye } from 'lucide-react'

const statusBadge: Record<DeliveryReceipt['status'], 'active' | 'out_for_delivery' | 'partially_delivered' | 'completed'> = {
  active: 'active',
  out_for_delivery: 'out_for_delivery',
  partially_delivered: 'partially_delivered',
  delivered: 'completed',
  received: 'completed',
}

const statusLabel: Record<DeliveryReceipt['status'], string> = {
  active: 'For Delivery',
  out_for_delivery: 'Out for Delivery',
  partially_delivered: 'Partially Delivered',
  delivered: 'Delivered',
  received: 'Received',
}

interface DeliveryReceiptTableProps {
  receipts: DeliveryReceipt[]
  selectedId: string | null
  onSelect: (receipt: DeliveryReceipt) => void
  onView: (receipt: DeliveryReceipt) => void
}

export function DeliveryReceiptTable({
  receipts,
  selectedId,
  onSelect,
  onView,
}: DeliveryReceiptTableProps) {
  if (receipts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
        <p className="text-sm font-medium text-text-primary">No delivery receipts yet.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Release an Outslip, create a Gate Pass, then generate a Delivery Receipt.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>DR No.</TableHead>
            <TableHead>Reference Outslip</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Delivery Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipts.map((receipt) => {
            const selected = selectedId === receipt.id
            return (
              <TableRow
                key={receipt.id}
                className={selected ? 'bg-maroon-light hover:bg-maroon-light' : undefined}
                onClick={() => onSelect(receipt)}
              >
                <TableCell>
                  <TableLink
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(receipt)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        onSelect(receipt)
                      }
                    }}
                  >
                    {receipt.id}
                  </TableLink>
                </TableCell>
                <TableCell>{receipt.outslipId}</TableCell>
                <TableCell>{receipt.customer}</TableCell>
                <TableCell>{formatDrDisplayDate(receipt.date)}</TableCell>
                <TableCell className="text-right">{formatDrMoney(receipt.totalAmount)}</TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <Badge variant={statusBadge[receipt.status]}>
                      {statusLabel[receipt.status]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`View ${receipt.id}`}
                      className="rounded-md p-2 text-text-secondary hover:bg-table-header hover:text-maroon"
                      onClick={(event) => {
                        event.stopPropagation()
                        onView(receipt)
                      }}
                    >
                      <Eye className="h-4 w-4" />
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
