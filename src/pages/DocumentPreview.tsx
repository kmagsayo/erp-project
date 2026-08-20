import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { colors } from '@/lib/theme'

export function DocumentPreview() {
  return (
    <Card className="max-w-2xl">
      <CardContent className="p-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-text-primary">
            RESPONSIVCODE TECHNOLOGY SOLUTIONS
          </p>
          <div className="mt-6">
            <h2
              className="text-xl font-bold tracking-wide"
              style={{ color: colors.maroon }}
            >
              QUOTATION
            </h2>
            <div
              className="mx-auto mt-1 h-0.5 w-24"
              style={{ backgroundColor: colors.maroon }}
            />
          </div>
        </div>

        <div className="mt-8 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Quotation No:</span>
            <span className="font-medium text-maroon">QTN-00001</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Date:</span>
            <span className="text-text-primary">August 19, 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Customer:</span>
            <span className="text-text-primary">ABC Corporation</span>
          </div>
        </div>

        <div
          className="my-6 border-t"
          style={{ borderColor: colors.border }}
        />

        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs uppercase tracking-wide"
              style={{ color: colors.textSecondary }}
            >
              <th className="pb-2">Item</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Price</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t" style={{ borderColor: colors.border }}>
              <td className="py-3 text-text-primary">Laptop</td>
              <td className="py-3 text-right text-text-primary">10</td>
              <td className="py-3 text-right text-text-primary">₱40,000</td>
              <td className="py-3 text-right text-text-primary">₱400,000</td>
            </tr>
          </tbody>
        </table>

        <div
          className="my-4 border-t"
          style={{ borderColor: colors.border }}
        />

        <div className="flex justify-end">
          <div className="text-right">
            <span className="text-sm text-text-secondary">TOTAL </span>
            <span className="text-lg font-bold text-text-primary">₱400,000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DocumentPreviewPage() {
  return (
    <div>
      <PageHeader
        title="Document Preview"
        description="Official printable document format with maroon accents."
      />
      <DocumentPreview />
    </div>
  )
}
