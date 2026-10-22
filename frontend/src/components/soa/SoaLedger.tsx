import type { SoaLine } from '@/data/soaTypes'
import type { SoaViewModel } from '@/lib/soa'
import { formatSoaDisplayDate, formatSoaPrintMoney } from '@/lib/soa'
import { Printer } from 'lucide-react'

interface SoaLedgerProps {
  soa: SoaViewModel
  lines: SoaLine[]
  onPrint: (line: SoaLine) => void
}

export function SoaLedger({ soa, lines, onPrint }: SoaLedgerProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-y border-border text-left text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Transaction Date</th>
            <th className="px-3 py-3">Reference No.</th>
            <th className="px-3 py-3 text-right">Debit</th>
            <th className="px-3 py-3 text-right">Credit</th>
            <th className="px-3 py-3 text-right">Balance</th>
            <th className="px-3 py-3">
              <span className="sr-only">Print</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-10 text-center text-text-secondary">
                {soa.customerName && soa.customerName !== '—'
                  ? 'No transactions for this ledger.'
                  : 'Select a client to view the ledger.'}
              </td>
            </tr>
          ) : (
            lines.map((line) => (
              <tr key={line.id} className="border-b border-border">
                <td className="px-3 py-3">{formatSoaDisplayDate(line.date)}</td>
                <td className="px-3 py-3">{formatSoaDisplayDate(line.transactionDate)}</td>
                <td className="px-3 py-3">{line.reference}</td>
                <td className="px-3 py-3 text-right">{formatSoaPrintMoney(line.debit)}</td>
                <td className="px-3 py-3 text-right">{formatSoaPrintMoney(line.credit)}</td>
                <td className="px-3 py-3 text-right">{formatSoaPrintMoney(line.balance)}</td>
                <td className="px-3 py-3 text-right align-middle">
                  <button
                    type="button"
                    aria-label={`Print ${line.reference}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-maroon-light hover:text-maroon"
                    onClick={() => onPrint(line)}
                  >
                    <Printer className="h-4 w-4" />
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
