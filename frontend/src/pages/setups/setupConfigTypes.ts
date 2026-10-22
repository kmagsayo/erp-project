import type { ReactNode } from 'react'

export type SetupFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'password'
  | 'number'
  | 'date'
  | 'status'
  | 'select'

export type SetupOptionsKey =
  | 'customers'
  | 'brands'
  | 'categories'
  | 'units'
  | 'models'
  | 'positions'

export interface SetupStaticOption {
  value: string
  label: string
}

export interface SetupColumn<T extends { id: number }> {
  key: string
  label: string
  render?: (row: T) => ReactNode
}

export interface SetupFieldConfig {
  name: string
  label: string
  type: SetupFieldType
  required?: boolean
  placeholder?: string
  optionsKey?: SetupOptionsKey
  staticOptions?: SetupStaticOption[]
  dependsOn?: string
}

export interface SetupResourceConfig<T extends { id: number }> {
  title: string
  resource: import('@/data/setupTypes').SetupResourcePath
  collectionKey: string
  singularKey: string
  columns: SetupColumn<T>[]
  fields: SetupFieldConfig[]
  getRecordLabel: (row: T) => string
  getEmptyForm: () => Record<string, unknown>
  mapRowToForm: (row: T) => Record<string, unknown>
  sanitizePayload?: (
    payload: Record<string, unknown>,
    editing: boolean,
  ) => Record<string, unknown>
}
