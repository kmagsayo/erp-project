import { FormField, Input } from '@/components/ui/input'
import type { OutslipFilters, OutslipListFilterStatus } from '@/lib/outslips'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

const statuses: Array<{ id: OutslipListFilterStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'released', label: 'For Dispatch' },
]

interface OutslipFiltersBarProps {
  filters: OutslipFilters
  counts: Record<OutslipListFilterStatus, number>
  onChange: (filters: OutslipFilters) => void
}

export function OutslipFiltersBar({ filters, counts, onChange }: OutslipFiltersBarProps) {
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
              {status.label} {counts[status.id]}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
            aria-hidden="true"
          />
          <Input
            aria-label="Search outslips"
            placeholder="Search outslips..."
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[28rem]">
          <FormField label="Date From" labelClassName="text-xs font-normal text-text-secondary">
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
            />
          </FormField>
          <FormField label="Date To" labelClassName="text-xs font-normal text-text-secondary">
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
            />
          </FormField>
        </div>
      </div>
    </div>
  )
}
