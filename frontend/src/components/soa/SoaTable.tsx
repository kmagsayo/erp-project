import { Badge } from '@/components/ui/badge'
import { TableLink } from '@/components/ui/table'
import type { SoaStatus, StatementOfAccount } from '@/data/soaTypes'
import {
  formatSoaDisplayDate,
  formatSoaMoney,
  soaStatusLabel,
} from '@/lib/soa'
import { Printer } from 'lucide-react'

const statusVariant: Record<SoaStatus, 'pending' | 'current' | 'completed'> = {
  open: 'pending',
  partial: 'current',
  settled: 'completed',
}

interface SoaTableProps {
  statements: StatementOfAccount[]
  selectedId: string | null
  onSelect: (statement: StatementOfAccount) => void
  onPrint: (statement: StatementOfAccount) => void
}

export function SoaTable({
  statements,
  selectedId,
  onSelect,
  onPrint,
}: SoaTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-table-header text-left text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-4 py-3">SOA No.</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Balance</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {statements.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-text-secondary">
                No statements of account found.
              </td>
            </tr>
          ) : (
            statements.map((statement) => (
              <tr
                key={statement.id}
                className={
                  selectedId === statement.id
                    ? 'border-t border-border bg-maroon-light/40'
                    : 'border-t border-border'
                }
              >
                <td className="px-4 py-3">
                  <TableLink onClick={() => onSelect(statement)}>{statement.soaNo}</TableLink>
                </td>
                <td className="px-4 py-3 text-text-primary">{statement.customerName}</td>
                <td className="px-4 py-3 text-text-primary">
                  {formatSoaDisplayDate(statement.dateFrom)} –{' '}
                  {formatSoaDisplayDate(statement.dateTo)}
                </td>
                <td className="px-4 py-3 font-medium text-text-primary">
                  {formatSoaMoney(statement.endingBalance)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[statement.status]}>
                    {soaStatusLabel[statement.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-md p-2 text-text-secondary hover:bg-table-header hover:text-text-primary"
                    aria-label={`Print ${statement.soaNo}`}
                    onClick={() => onPrint(statement)}
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
