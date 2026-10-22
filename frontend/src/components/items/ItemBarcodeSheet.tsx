import { ItemBarcode } from '@/components/ui/item-barcode'
import type { ItemSetup } from '@/data/setupTypes'

export function ItemBarcodeSheet({ items }: { items: ItemSetup[] }) {
  return (
    <div className="item-barcode-sheet">
      <h1 className="item-barcode-sheet-title">Item Barcodes</h1>
      {items.length === 0 ? (
        <p className="item-barcode-empty">No items have a barcode yet.</p>
      ) : (
        <div className="item-barcode-grid">
          {items.map((item) => (
            <div key={item.id} className="item-barcode-label">
              <div className="item-barcode-name">{item.item_name}</div>
              <div className="item-barcode-code">{item.item_code}</div>
              <div className="item-barcode-graphic">
                <ItemBarcode value={item.barcode} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
