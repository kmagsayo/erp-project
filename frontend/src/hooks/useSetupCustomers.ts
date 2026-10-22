import { listSetupRecords } from '@/lib/setupsApi'
import { useEffect, useState } from 'react'

export interface SetupCustomerOption {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  tin?: string
  contactPerson?: string
}

const fallbackOptions: SetupCustomerOption[] = []

export function useSetupCustomers() {
  const [customers, setCustomers] = useState<SetupCustomerOption[]>(fallbackOptions)

  useEffect(() => {
    void listSetupRecords<{
      id: number
      name: string
      code: string
      address?: string | null
      phone?: string | null
      tin?: string | null
      contact_person?: string | null
    }>('customers', 'customers', { per_page: 100, status: 'active' })
      .then((result) => {
        if (result.items.length === 0) {
          setCustomers(fallbackOptions)
          return
        }

        setCustomers(
          result.items.map((customer) => ({
            id: String(customer.id),
            name: customer.name,
            code: customer.code,
            address: customer.address ?? '',
            phone: customer.phone ?? '',
            tin: customer.tin ?? '',
            contactPerson: customer.contact_person ?? '',
          })),
        )
      })
      .catch(() => {
        setCustomers(fallbackOptions)
      })
  }, [])

  return customers
}
