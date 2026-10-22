import { listSetupRecords } from '@/lib/setupsApi'
import type { SupplierSetup } from '@/data/setupTypes'
import { useEffect, useState } from 'react'

export interface SetupSupplierOption {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
}

export function useSetupSuppliers() {
  const [suppliers, setSuppliers] = useState<SetupSupplierOption[]>([])

  useEffect(() => {
    void listSetupRecords<SupplierSetup>('suppliers', 'suppliers', {
      per_page: 100,
      status: 'active',
    })
      .then((result) => {
        setSuppliers(
          result.items.map((supplier) => ({
            id: String(supplier.id),
            name: supplier.name,
            code: supplier.code,
            address: supplier.address ?? '',
            phone: supplier.phone ?? '',
          })),
        )
      })
      .catch(() => {
        setSuppliers([])
      })
  }, [])

  return suppliers
}
