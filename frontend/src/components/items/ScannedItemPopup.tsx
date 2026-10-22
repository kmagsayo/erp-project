import { ItemBarcode } from '@/components/ui/item-barcode'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ItemSetup } from '@/data/setupTypes'
import { X } from 'lucide-react'

function money(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function stockBadge(status: ItemSetup['stock_status']) {
  if (status === 'low') return { label: 'Low Stock', variant: 'pending' as const }
  if (status === 'out') return { label: 'Out of Stock', variant: 'cancelled' as const }
  return { label: 'In Stock', variant: 'approved' as const }
}

export function ScannedItemPopup({
  barcode,
  item,
  loading,
  error,
  onClose,
}: {
  barcode: string
  item: ItemSetup | null
  loading: boolean
  error: string | null
  onClose: () => void
}) {
  const stock = stockBadge(item?.stock_status)
  const unit = item?.unit_of_measure?.name ?? ''

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 print:hidden">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanned-item-title"
        className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Scanned item
            </p>
            <h2 id="scanned-item-title" className="mt-1 text-lg font-semibold text-text-primary">
              {loading ? 'Looking up barcode…' : item?.item_name || 'Item not found'}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-text-secondary hover:bg-table-header hover:text-text-primary"
            aria-label="Close scanned item"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-text-secondary">Please wait.</p>
        ) : error || !item ? (
          <p className="mt-4 text-sm text-error-text">
            {error || `No item matches barcode ${barcode}.`}
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex justify-center rounded-md border border-border bg-white px-3 py-3">
              <ItemBarcode value={item.barcode || barcode} />
            </div>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-secondary">Item code</dt>
                <dd className="font-medium text-text-primary">{item.item_code}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Brand / Model</dt>
                <dd className="font-medium text-text-primary">
                  {[item.brand?.name, item.model?.name].filter(Boolean).join(' / ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">Unit price</dt>
                <dd className="font-medium text-text-primary">{money(item.unit_price)}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Stock on hand</dt>
                <dd className="flex flex-wrap items-center gap-2 font-medium text-text-primary">
                  {item.stock_on_hand ?? 0} {unit}
                  <Badge variant={stock.variant}>{stock.label}</Badge>
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
