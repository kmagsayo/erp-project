import { cn } from '@/lib/utils'
import type { QuotationFilters, QuotationStatus } from '@/data/quotationTypes'
import { FormField, Input } from '@/components/ui/input'

const statuses: Array<{ id: QuotationStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

interface QuotationFiltersBarProps {
  filters: QuotationFilters
  counts: Record<QuotationStatus | 'all', number>
  onChange: (filters: QuotationFilters) => void
}

export function QuotationFiltersBar({
  filters,
  counts,
  onChange,
}: QuotationFiltersBarProps) {
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
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                active
                  ? 'border-maroon bg-maroon text-white'
                  : 'border-border bg-surface text-text-secondary hover:border-maroon hover:text-maroon',
              )}
              onClick={() => onChange({ ...filters, status: status.id })}
            >
              {status.label} {counts[status.id]}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <FormField label="Search" className="md:col-span-1">
          <Input
            placeholder="Search quotations..."
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
