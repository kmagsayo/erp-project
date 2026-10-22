import { listItems } from '@/lib/setupsApi'
import type { CatalogItem } from '@/data/quotationTypes'
import { useEffect, useState } from 'react'

function parseUnitPrice(value: unknown): number {
  const price = Number.parseFloat(String(value ?? 0))
  return Number.isFinite(price) && price > 0 ? price : 0
}

export function useSetupItems() {
  const [items, setItems] = useState<CatalogItem[]>([])

  useEffect(() => {
    void listItems({ per_page: 100, status: 'active' })
      .then((result) => {
        setItems(
          result.items.map((item) => ({
            id: String(item.id),
            code: item.item_code,
            name: item.item_name,
            unit: item.unit_of_measure?.symbol || item.unit_of_measure?.code || item.unit_of_measure?.name || '',
            unitPrice: parseUnitPrice(item.unit_price),
            barcode: item.barcode ?? '',
          })),
        )
      })
      .catch(() => {
        setItems([])
      })
  }, [])

  return items
}
