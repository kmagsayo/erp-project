import { FormField, Input } from '@/components/ui/input'
import type { DeliveryReceiptStatus } from '@/data/erpTypes'
import type { DeliveryReceiptFilters } from '@/lib/deliveryReceipts'
import { cn } from '@/lib/utils'

const statuses: Array<{ id: DeliveryReceiptStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'For Delivery' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'partially_delivered', label: 'Partially Delivered' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'received', label: 'Received' },
]

interface DeliveryReceiptFiltersBarProps {
  filters: DeliveryReceiptFilters
  counts: Record<DeliveryReceiptStatus | 'all', number>
  onChange: (filters: DeliveryReceiptFilters) => void
}

export function DeliveryReceiptFiltersBar({
  filters,
  counts,
  onChange,
}: DeliveryReceiptFiltersBarProps) {
  return (
    <div className="mb-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const active = filters.status === status.id
          return (
            <button
              key={status.id}
              type="button"
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-maroon bg-maroon text-white'
                  : 'border-border bg-surface text-text-secondary hover:border-maroon hover:text-maroon',
              )}
              onClick={() => onChange({ ...filters, status: status.id })}
            >
              {status.label} ({counts[status.id]})
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <FormField label="Search">
          <Input
            placeholder="Search delivery receipts..."
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </FormField>
        <FormField label="Date From">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
          />
        </FormField>
        <FormField label="Date To">
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
          />
        </FormField>
      </div>
    </div>
  )
}
