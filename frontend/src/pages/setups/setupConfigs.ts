import { formatBrandCode, formatCustomerCode, formatUnitCode, formatUserId } from '@/data/setupTypes'
import type { SetupResourceConfig } from '@/pages/setups/setupConfigTypes'
import type {
  BranchSetup,
  BrandSetup,
  CategorySetup,
  CustomerSetup,
  ItemSetup,
  PositionSetup,
  ProductModelSetup,
  ProjectSetup,
  SupplierSetup,
  UnitOfMeasureSetup,
  UserSetup,
} from '@/data/setupTypes'

const statusField = {
  name: 'status',
  label: 'Status',
  type: 'status' as const,
}

export const branchConfig: SetupResourceConfig<BranchSetup> = {
  title: 'Branch',
  resource: 'branches',
  collectionKey: 'branches',
  singularKey: 'branch',
  columns: [
    { key: 'name', label: 'Branch Name' },
    {
      key: 'company',
      label: 'Company',
      render: (row) => row.company?.name ?? '—',
    },
    { key: 'address', label: 'Address' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'name', label: 'Branch Name', type: 'text', required: true },
    { name: 'company_id', label: 'Company', type: 'select', required: true, optionsKey: 'positions' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'contact_information', label: 'Contact Information', type: 'text' },
    statusField,
  ],
  getRecordLabel: (row) => row.name,
  getEmptyForm: () => ({
    name: '',
    company_id: '',
    address: '',
    contact_information: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    name: row.name,
    company_id: row.company_id ? String(row.company_id) : '',
    address: row.address ?? '',
    contact_information: row.contact_information ?? '',
    status: row.status,
  }),
}

export const customerConfig: SetupResourceConfig<CustomerSetup> = {
  title: 'Customer',
  resource: 'customers',
  collectionKey: 'customers',
  singularKey: 'customer',
  columns: [
    {
      key: 'code',
      label: 'Customer Code',
      render: (row) => row.code || formatCustomerCode(row.id),
    },
    { key: 'name', label: 'Customer Name' },
    { key: 'phone', label: 'Contact No.' },
    { key: 'tin', label: 'TIN No.' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'name', label: 'Customer Name', type: 'text', required: true },
    { name: 'phone', label: 'Contact No.', type: 'text' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'tin', label: 'TIN No.', type: 'text' },
    statusField,
  ],
  getRecordLabel: (row) => row.name,
  getEmptyForm: () => ({
    name: '',
    phone: '',
    address: '',
    tin: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    name: row.name,
    phone: row.phone ?? '',
    address: row.address ?? '',
    tin: row.tin ?? '',
    status: row.status,
  }),
  sanitizePayload: (payload) => {
    const next = { ...payload }
    delete next.code
    delete next.contact_person
    delete next.email
    delete next.terms
    return next
  },
}

export const supplierConfig: SetupResourceConfig<SupplierSetup> = {
  title: 'Supplier',
  resource: 'suppliers',
  collectionKey: 'suppliers',
  singularKey: 'supplier',
  columns: [
    { key: 'code', label: 'Supplier Code' },
    { key: 'name', label: 'Supplier Name' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Contact No.' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'name', label: 'Supplier Name', type: 'text', required: true },
    { name: 'contact_person', label: 'Contact Person', type: 'text' },
    { name: 'phone', label: 'Contact No.', type: 'text' },
    { name: 'tin', label: 'TIN No.', type: 'text' },
    { name: 'address', label: 'Address', type: 'textarea' },
    statusField,
  ],
  getRecordLabel: (row) => row.name,
  getEmptyForm: () => ({
    name: '',
    contact_person: '',
    phone: '',
    tin: '',
    address: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    name: row.name,
    contact_person: row.contact_person ?? '',
    phone: row.phone ?? '',
    tin: row.tin ?? '',
    address: row.address ?? '',
    status: row.status,
  }),
  sanitizePayload: (payload) => {
    const next = { ...payload }
    delete next.code
    return next
  },
}

export const positionConfig: SetupResourceConfig<PositionSetup> = {
  title: 'Position',
  resource: 'positions',
  collectionKey: 'positions',
  singularKey: 'position',
  columns: [
    { key: 'name', label: 'Position' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'name', label: 'Position Name', type: 'text', required: true },
    { name: 'code', label: 'Position Code', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    statusField,
  ],
  getRecordLabel: (row) => row.code,
  getEmptyForm: () => ({
    name: '',
    code: '',
    description: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    name: row.name,
    code: row.code,
    description: row.description ?? '',
    status: row.status,
  }),
}

export const categoryConfig: SetupResourceConfig<CategorySetup> = {
  title: 'Category',
  resource: 'categories',
  collectionKey: 'categories',
  singularKey: 'category',
  columns: [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'name', label: 'Category Name', type: 'text', required: true },
    statusField,
  ],
  getRecordLabel: (row) => row.name,
  getEmptyForm: () => ({
    name: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    name: row.name,
    status: row.status,
  }),
  sanitizePayload: (payload) => {
    const next = { ...payload }
    delete next.code
    delete next.description
    return next
  },
}

export const brandConfig: SetupResourceConfig<BrandSetup> = {
  title: 'Brand',
  resource: 'brands',
  collectionKey: 'brands',
  singularKey: 'brand',
  columns: [
    {
      key: 'code',
      label: 'Brand Code',
      render: (row) => formatBrandCode(row.id),
    },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'name', label: 'Brand Name', type: 'text', required: true },
    statusField,
  ],
  getRecordLabel: (row) => row.name,
  getEmptyForm: () => ({
    name: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    name: row.name,
    status: row.status,
  }),
  sanitizePayload: (payload) => {
    const next = { ...payload }
    delete next.code
    delete next.description
    return next
  },
}

export const modelConfig: SetupResourceConfig<ProductModelSetup> = {
  title: 'Model',
  resource: 'models',
  collectionKey: 'models',
  singularKey: 'model',
  columns: [
    {
      key: 'brand',
      label: 'Brand',
      render: (row) => row.brand?.name ?? '—',
    },
    { key: 'name', label: 'Model Name' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    {
      name: 'brand_id',
      label: 'Brand',
      type: 'select',
      required: true,
      optionsKey: 'brands',
    },
    { name: 'name', label: 'Model Name', type: 'text', required: true },
    statusField,
  ],
  getRecordLabel: (row) => row.name,
  getEmptyForm: () => ({
    brand_id: '',
    name: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    brand_id: String(row.brand_id),
    name: row.name,
    status: row.status,
  }),
  sanitizePayload: (payload) => {
    const next = { ...payload }
    delete next.code
    return next
  },
}

export const unitConfig: SetupResourceConfig<UnitOfMeasureSetup> = {
  title: 'Unit of Measure',
  resource: 'units',
  collectionKey: 'units',
  singularKey: 'unit',
  columns: [
    {
      key: 'code',
      label: 'Code',
      render: (row) => formatUnitCode(row.id),
    },
    { key: 'name', label: 'Name' },
    { key: 'symbol', label: 'Symbol' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'name', label: 'Unit Name', type: 'text', required: true },
    { name: 'symbol', label: 'Symbol', type: 'text' },
    statusField,
  ],
  getRecordLabel: (row) => row.name,
  getEmptyForm: () => ({
    name: '',
    symbol: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    name: row.name,
    symbol: row.symbol ?? '',
    status: row.status,
  }),
  sanitizePayload: (payload) => {
    const next = { ...payload }
    delete next.code
    return next
  },
}

export const projectConfig: SetupResourceConfig<ProjectSetup> = {
  title: 'Project',
  resource: 'projects',
  collectionKey: 'projects',
  singularKey: 'project',
  columns: [
    { key: 'project_code', label: 'Code' },
    { key: 'project_name', label: 'Name' },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => row.customer?.name ?? '—',
    },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'project_name', label: 'Project Name', type: 'text', required: true },
    {
      name: 'customer_id',
      label: 'Customer',
      type: 'select',
      required: true,
      optionsKey: 'customers',
    },
    { name: 'location', label: 'Location', type: 'text' },
    { name: 'start_date', label: 'Start Date', type: 'date' },
    { name: 'end_date', label: 'End Date', type: 'date' },
    { name: 'remarks', label: 'Remarks', type: 'textarea' },
    statusField,
  ],
  getRecordLabel: (row) => row.project_name,
  getEmptyForm: () => ({
    project_name: '',
    customer_id: '',
    location: '',
    start_date: '',
    end_date: '',
    remarks: '',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    project_name: row.project_name,
    customer_id: String(row.customer_id),
    location: row.location ?? '',
    start_date: row.start_date ?? '',
    end_date: row.end_date ?? '',
    remarks: row.remarks ?? '',
    status: row.status,
  }),
  sanitizePayload: (payload) => {
    const next = { ...payload }
    delete next.project_code
    return next
  },
}

export const itemConfig: SetupResourceConfig<ItemSetup> = {
  title: 'Item',
  resource: 'items',
  collectionKey: 'items',
  singularKey: 'item',
  columns: [
    { key: 'item_code', label: 'Code' },
    {
      key: 'display_name',
      label: 'Display Name',
      render: (row) => row.display_name ?? row.item_name,
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name ?? '—',
    },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'item_code', label: 'Item Code', type: 'text', required: true },
    { name: 'item_name', label: 'Item Name', type: 'text', required: true },
    {
      name: 'category_id',
      label: 'Category',
      type: 'select',
      required: true,
      optionsKey: 'categories',
    },
    {
      name: 'brand_id',
      label: 'Brand',
      type: 'select',
      required: true,
      optionsKey: 'brands',
    },
    {
      name: 'model_id',
      label: 'Model',
      type: 'select',
      required: true,
      optionsKey: 'models',
      dependsOn: 'brand_id',
    },
    {
      name: 'unit_of_measure_id',
      label: 'Unit of Measure',
      type: 'select',
      required: true,
      optionsKey: 'units',
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'minimum_stock', label: 'Minimum Stock', type: 'number' },
    statusField,
  ],
  getRecordLabel: (row) => row.item_code,
  getEmptyForm: () => ({
    item_code: '',
    item_name: '',
    category_id: '',
    brand_id: '',
    model_id: '',
    unit_of_measure_id: '',
    description: '',
    minimum_stock: 0,
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    item_code: row.item_code,
    item_name: row.item_name,
    category_id: String(row.category_id),
    brand_id: String(row.brand_id),
    model_id: String(row.model_id),
    unit_of_measure_id: String(row.unit_of_measure_id),
    description: row.description ?? '',
    minimum_stock: row.minimum_stock,
    status: row.status,
  }),
}

export const userConfig: SetupResourceConfig<UserSetup> = {
  title: 'User',
  resource: 'users',
  collectionKey: 'users',
  singularKey: 'user',
  columns: [
    {
      key: 'id',
      label: 'User ID',
      render: (row) => formatUserId(row.id),
    },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'position',
      label: 'Position',
      render: (row) => row.position?.name ?? '—',
    },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
  ],
  fields: [
    { name: 'username', label: 'Username', type: 'text', required: true },
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Leave blank to auto-generate from username',
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      required: true,
      placeholder: 'Minimum 6 characters',
    },
    {
      name: 'password_confirmation',
      label: 'Confirm Password',
      type: 'password',
      required: true,
    },
    {
      name: 'position_id',
      label: 'Position',
      type: 'select',
      optionsKey: 'positions',
    },
    {
      name: 'type',
      label: 'User Type',
      type: 'select',
      staticOptions: [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' },
      ],
    },
    statusField,
  ],
  getRecordLabel: (row) => formatUserId(row.id),
  getEmptyForm: () => ({
    username: '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    position_id: '',
    type: 'user',
    status: 'active',
  }),
  mapRowToForm: (row) => ({
    username: row.username,
    name: row.name,
    email: row.email,
    password: '',
    password_confirmation: '',
    position_id: row.position_id ? String(row.position_id) : '',
    type: row.type,
    status: row.status,
  }),
  sanitizePayload: (payload, editing) => {
    const next = { ...payload }

    if (editing && !next.password) {
      delete next.password
      delete next.password_confirmation
    }

    if (next.position_id === '') {
      next.position_id = null
    }

    if (next.email === '') {
      delete next.email
    }

    return next
  },
}
