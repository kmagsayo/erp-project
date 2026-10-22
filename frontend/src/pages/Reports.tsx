import { PageHeader } from '@/components/layout/PageHeader'
import { AddButton } from '@/components/ui/add-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getStockLevels, useErp } from '@/data/erpStore'
import { Printer } from 'lucide-react'

export function ReportsPage() {
  const { movements } = useErp()
  const stock = getStockLevels(movements)

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Inventory reports generated from ERP transactions."
        action={
          <div className="flex items-center gap-2">
            <AddButton label="Add Report" />
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-4">
          <h2 className="mb-3 text-base font-semibold text-text-primary">Current stock report</h2>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Item Code</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((row) => (
                <TableRow key={row.itemCode}>
                  <TableCell>{row.itemCode}</TableCell>
                  <TableCell>{row.item}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <h2 className="mb-3 text-base font-semibold text-text-primary">Inventory records report</h2>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>PO</TableHead>
                <TableHead>Outslip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    {row.item}
                    <div className="text-xs text-text-secondary">{row.itemCode}</div>
                  </TableCell>
                  <TableCell>
                    {row.quantity} {row.unit}
                  </TableCell>
                  <TableCell>{row.project}</TableCell>
                  <TableCell>{row.customer}</TableCell>
                  <TableCell>{row.poId}</TableCell>
                  <TableCell>{row.outslipId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
