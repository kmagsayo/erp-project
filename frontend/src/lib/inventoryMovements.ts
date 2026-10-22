import type { InventoryMovement } from '@/data/erpTypes'

const STORAGE_KEY = 'erp-inventory-movements'

export function loadInventoryMovements(): InventoryMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InventoryMovement[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveInventoryMovements(rows: InventoryMovement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}
