export type SetupStatus = 'active' | 'inactive'

export function formatUserId(id: number): string {
  return `USR-${String(id).padStart(3, '0')}`
}

export function formatBrandCode(id: number): string {
  return `BRD-${String(id).padStart(3, '0')}`
}

export function formatModelCode(id: number): string {
  return `MOD-${String(id).padStart(3, '0')}`
}

export function formatUnitCode(id: number): string {
  return `UOM-${String(id).padStart(3, '0')}`
}

export function formatItemCode(id: number): string {
  return `ITM-${String(id).padStart(4, '0')}`
}

export function formatSupplierCode(id: number): string {
  return `SUP-${String(id).padStart(3, '0')}`
}

export function formatCustomerCode(id: number): string {
  return `CUST-${String(id).padStart(3, '0')}`
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface CompanySetup {
  id: number
  name: string
  address: string | null
  contact_number: string | null
  email: string | null
  logo_path: string | null
  logo_url: string | null
  registration_information: string | null
  status: SetupStatus
}

export interface BranchSetup {
  id: number
  company_id: number | null
  name: string
  code: string
  address: string | null
  contact_information: string | null
  status: SetupStatus
  company?: CompanySetup | null
}

export interface CustomerSetup {
  id: number
  name: string
  code: string
  phone: string | null
  address: string | null
  tin: string | null
  terms: number | null
  terms_type: string | null
  status: SetupStatus
}

export interface SupplierSetup {
  id: number
  name: string
  code: string
  contact_person: string | null
  phone: string | null
  address: string | null
  tin: string | null
  status: SetupStatus
}

export interface PositionSetup {
  id: number
  name: string
  code: string
  description: string | null
  status: SetupStatus
}

export interface CategorySetup {
  id: number
  name: string
  code: string
  description: string | null
  status: SetupStatus
}

export interface BrandSetup {
  id: number
  name: string
  code: string
  description: string | null
  status: SetupStatus
}

export interface ProductModelSetup {
  id: number
  brand_id: number
  name: string
  code: string | null
  status: SetupStatus
  brand?: BrandSetup
}

export interface UnitOfMeasureSetup {
  id: number
  name: string
  code: string
  symbol: string | null
  status: SetupStatus
}

export interface ItemSetup {
  id: number
  item_code: string
  barcode: string | null
  requires_serial?: boolean
  item_name: string
  unit_price: number
  category_id: number
  brand_id: number
  model_id: number
  unit_of_measure_id: number
  description: string | null
  minimum_stock: number
  stock_on_hand: number
  status: SetupStatus
  display_name?: string
  stock_status?: 'in' | 'low' | 'out'
  category?: CategorySetup
  brand?: BrandSetup
  model?: ProductModelSetup
  unit_of_measure?: UnitOfMeasureSetup
}

export interface ProjectSetup {
  id: number
  project_code: string
  project_name: string
  customer_id: number
  location: string | null
  start_date: string | null
  end_date: string | null
  status: SetupStatus
  remarks: string | null
  customer?: CustomerSetup
}

export interface UserSetup {
  id: number
  username: string
  name: string
  email: string
  position_id: number | null
  type: 'admin' | 'user'
  status: SetupStatus
  position?: PositionSetup
}

export type SetupResourcePath =
  | 'companies'
  | 'branches'
  | 'projects'
  | 'positions'
  | 'categories'
  | 'brands'
  | 'models'
  | 'units'
  | 'items'
  | 'suppliers'
  | 'customers'
  | 'users'

export type SetupRecord =
  | BranchSetup
  | CustomerSetup
  | SupplierSetup
  | PositionSetup
  | CategorySetup
  | BrandSetup
  | ProductModelSetup
  | UnitOfMeasureSetup
  | ItemSetup
  | ProjectSetup
  | UserSetup
