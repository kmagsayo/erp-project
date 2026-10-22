import { ItemBarcode } from '@/components/ui/item-barcode'

export function TransactionBarcode({ value }: { value: string }) {
  const code = value.trim()
  if (!code) return null

  return (
    <div className="transaction-barcode" aria-label={`Barcode for ${code}`}>
      <ItemBarcode value={code} compact />
    </div>
  )
}
