import { request } from '@/lib/api'
import type {
  BranchSetup,
  BrandSetup,
  CategorySetup,
  CompanySetup,
  CustomerSetup,
  ItemSetup,
  PaginationMeta,
  PositionSetup,
  ProductModelSetup,
  ProjectSetup,
  SetupResourcePath,
  SupplierSetup,
  UnitOfMeasureSetup,
  UserSetup,
} from '@/data/setupTypes'

interface SetupApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface SetupListResult<T> {
  items: T[]
  pagination: PaginationMeta
}

export interface SetupListParams {
  search?: string
  status?: string
  page?: number
  per_page?: number
  category_id?: number
  brand_id?: number
  model_id?: number
  customer_id?: number
  barcode?: string
}

function buildQuery(params: SetupListParams = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  })
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export async function listSetupRecords<T>(
  resource: SetupResourcePath,
  collectionKey: string,
  params: SetupListParams = {},
): Promise<SetupListResult<T>> {
  const response = await request<SetupApiResponse<Record<string, unknown>>>(
    `/setups/${resource}${buildQuery(params)}`,
  )

  return {
    items: (response.data[collectionKey] as T[]) ?? [],
    pagination: response.data.pagination as PaginationMeta,
  }
}

export async function createSetupRecord<T>(
  resource: SetupResourcePath,
  singularKey: string,
  payload: Record<string, unknown>,
) {
  const response = await request<SetupApiResponse<Record<string, T>>>(
    `/setups/${resource}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return response.data[singularKey]
}

export async function updateSetupRecord<T>(
  resource: SetupResourcePath,
  singularKey: string,
  id: number,
  payload: Record<string, unknown>,
) {
  const response = await request<SetupApiResponse<Record<string, T>>>(
    `/setups/${resource}/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )

  return response.data[singularKey]
}

export async function deleteSetupRecord(resource: SetupResourcePath, id: number) {
  return request<SetupApiResponse<null>>(`/setups/${resource}/${id}`, {
    method: 'DELETE',
  })
}

export async function fetchModelsByBrand(brandId: number, search = '') {
  return listSetupRecords<ProductModelSetup>('models', 'models', {
    brand_id: brandId,
    search,
    per_page: 100,
  })
}

export async function listCompanies(params: SetupListParams = {}): Promise<SetupListResult<CompanySetup>> {
  const response = await request<
    SetupApiResponse<{
      company?: CompanySetup | null
      companies?: CompanySetup[]
      pagination?: PaginationMeta
    }>
  >(`/setups/companies${buildQuery(params)}`)

  if (Array.isArray(response.data.companies) && response.data.pagination) {
    return {
      items: response.data.companies.map((company) => ({
        ...company,
        status: company.status ?? 'active',
      })),
      pagination: response.data.pagination,
    }
  }

  let items = response.data.company ? [{ ...response.data.company, status: response.data.company.status ?? 'active' }] : []
  const search = params.search?.trim().toLowerCase()
  if (search) {
    items = items.filter((item) =>
      [item.name, item.address, item.contact_number, item.email, item.registration_information]
        .some((value) => value?.toLowerCase().includes(search)),
    )
  }
  if (params.status) {
    items = items.filter((item) => item.status === params.status)
  }

  return {
    items,
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: params.per_page ?? 15,
      total: items.length,
    },
  }
}

export function listBranches(params: SetupListParams = {}) {
  return listSetupRecords<BranchSetup>('branches', 'branches', params)
}

export function listPositions(params: SetupListParams = {}) {
  return listSetupRecords<PositionSetup>('positions', 'positions', params)
}

export function listItems(params: SetupListParams = {}) {
  return listSetupRecords<ItemSetup>('items', 'items', params)
}

export async function listAllItems(params: Omit<SetupListParams, 'page' | 'per_page'> = {}) {
  const items: ItemSetup[] = []
  let page = 1
  let lastPage = 1

  do {
    const result = await listItems({ ...params, page, per_page: 100 })
    items.push(...result.items)
    lastPage = result.pagination.last_page
    page += 1
  } while (page <= lastPage)

  return items
}

export function findCatalogItemByBarcode(barcode: string) {
  return listItems({
    barcode: barcode.trim(),
    status: 'active',
    per_page: 20,
  })
}

export function listSuppliers(params: SetupListParams = {}) {
  return listSetupRecords<SupplierSetup>('suppliers', 'suppliers', params)
}

export function listCustomers(params: SetupListParams = {}) {
  return listSetupRecords<CustomerSetup>('customers', 'customers', params)
}

export function createCompany(payload: Record<string, unknown>) {
  return createSetupRecord<CompanySetup>('companies', 'company', payload).then((company) => ({
    success: true,
    message: 'Company created successfully.',
    data: { company },
  }))
}

export function updateCompany(id: number, payload: Record<string, unknown>) {
  return updateSetupRecord<CompanySetup>('companies', 'company', id, payload).then((company) => ({
    success: true,
    message: 'Company updated successfully.',
    data: { company },
  }))
}

export function deleteCompany(id: number) {
  return deleteSetupRecord('companies', id)
}

export function uploadCompanyLogo(id: number, logo: File) {
  const formData = new FormData()
  formData.append('logo', logo)

  return request<SetupApiResponse<{ company: CompanySetup }>>(
    `/setups/companies/${id}/logo`,
    {
      method: 'POST',
      body: formData,
    },
  )
}

export type {
  BranchSetup,
  BrandSetup,
  CategorySetup,
  CompanySetup,
  CustomerSetup,
  ItemSetup,
  PositionSetup,
  ProductModelSetup,
  ProjectSetup,
  SupplierSetup,
  UnitOfMeasureSetup,
  UserSetup,
}
