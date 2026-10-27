import type { Billing } from '@/data/billingTypes'
import { formatBillingDisplayDate, formatBillingMoney } from '@/lib/billings'
import { Trash2 } from 'lucide-react'

interface BillingTableProps {
  billings: Billing[]
  selectedId: string | null
  onDelete: (billing: Billing) => void
}

export function BillingTable({ billings, selectedId, onDelete }: BillingTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-table-header text-left text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-4 py-3">Invoice No</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Transaction Date</th>
            <th className="px-4 py-3 text-right">Withholding Tax</th>
            <th className="px-4 py-3 text-right">Retention</th>
            <th className="px-4 py-3 text-right">Recoupment</th>
            <th className="px-4 py-3 text-right">Mobilization</th>
            <th className="px-4 py-3 text-right">Net Amount</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {billings.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-10 text-center text-text-secondary">
                No billings found.
              </td>
            </tr>
          ) : (
            billings.map((billing) => (
              <tr
                key={billing.id}
                className={
                  selectedId === billing.id
                    ? 'border-t border-border bg-maroon-light/40'
                    : 'border-t border-border'
                }
              >
                <td className="px-4 py-3 text-text-primary">
                  {billing.invoiceNo || billing.billingNo}
                </td>
                <td className="px-4 py-3 text-text-primary">{billing.customerName}</td>
                <td className="px-4 py-3 text-text-primary">
                  {formatBillingDisplayDate(billing.date)}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">
                  {formatBillingMoney(billing.withholdingTax)}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">
                  {formatBillingMoney(billing.retentionAmount)}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">
                  {formatBillingMoney(billing.managementAmount)}
                </td>
                <td className="px-4 py-3 text-right text-text-primary">
                  {formatBillingMoney(billing.mobilizationAmount)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-text-primary">
                  {formatBillingMoney(billing.total)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-text-secondary hover:bg-error-bg hover:text-error-text"
                    aria-label={`Delete billing ${billing.invoiceNo || billing.billingNo}`}
                    onClick={() => onDelete(billing)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
