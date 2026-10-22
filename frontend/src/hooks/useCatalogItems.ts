import type { ItemSetup } from '@/data/setupTypes'
import { listAllItems } from '@/lib/setupsApi'
import { useEffect, useState } from 'react'

let cachedItems: ItemSetup[] | null = null
let pendingItems: Promise<ItemSetup[]> | null = null

export function loadCatalogItems() {
  if (cachedItems) return Promise.resolve(cachedItems)
  if (!pendingItems) {
    pendingItems = listAllItems()
      .then((rows) => {
        cachedItems = rows
        return rows
      })
      .finally(() => {
        pendingItems = null
      })
  }
  return pendingItems
}

export function useCatalogItems() {
  const [items, setItems] = useState<ItemSetup[]>(cachedItems ?? [])

  useEffect(() => {
    let cancelled = false
    void loadCatalogItems()
      .then((rows) => {
        if (!cancelled) setItems(rows)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return items
}

export function catalogBrandAndModel(items: ItemSetup[], itemCode: string) {
  const needle = itemCode.trim().toLowerCase()
  const match = items.find((row) => row.item_code.trim().toLowerCase() === needle)
  return {
    brand: match?.brand?.name?.trim() ?? '',
    model: match?.model?.name?.trim() ?? '',
  }
}
