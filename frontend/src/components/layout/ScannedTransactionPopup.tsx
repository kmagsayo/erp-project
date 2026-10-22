import { TransactionBarcode } from '@/components/ui/transaction-barcode'
import { Button } from '@/components/ui/button'
import type { ScannedTransaction } from '@/lib/transactionBarcode'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function ScannedTransactionPopup({
  transaction,
  onClose,
}: {
  transaction: ScannedTransaction
  onClose: () => void
}) {
  const navigate = useNavigate()

  function openRecord() {
    onClose()
    navigate(transaction.path)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 print:hidden">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scanned-transaction-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {transaction.label}
            </p>
            <h2 id="scanned-transaction-title" className="mt-1 text-lg font-semibold text-text-primary">
              {transaction.number}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-text-secondary hover:bg-table-header hover:text-text-primary"
            aria-label="Close transaction details"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="flex justify-center rounded-md border border-border bg-white px-3 py-3">
            <TransactionBarcode value={transaction.number} />
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-secondary">Date</dt>
              <dd className="font-medium text-text-primary">{transaction.date}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Status</dt>
              <dd className="font-medium text-text-primary">{transaction.status}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">{transaction.partyLabel}</dt>
              <dd className="font-medium text-text-primary">{transaction.party}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">{transaction.referenceLabel}</dt>
              <dd className="font-medium text-text-primary">{transaction.reference}</dd>
            </div>
          </dl>

          <div className="overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-table-header text-left text-xs uppercase tracking-wide text-text-secondary">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transaction.lines.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-text-secondary">
                      No line items.
                    </td>
                  </tr>
                ) : (
                  transaction.lines.map((line, index) => (
                    <tr key={`${line.description}-${index}`} className="border-t border-border">
                      <td className="px-3 py-2 text-text-primary">{line.description}</td>
                      <td className="px-3 py-2 text-text-secondary">{line.detail}</td>
                      <td className="px-3 py-2 text-right font-medium text-text-primary">
                        {line.amount || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-right text-sm">
            <span className="text-text-secondary">{transaction.totalLabel}: </span>
            <span className="font-semibold text-text-primary">{transaction.total}</span>
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={openRecord}>
            Open record
          </Button>
        </div>
      </div>
    </div>
  )
}
