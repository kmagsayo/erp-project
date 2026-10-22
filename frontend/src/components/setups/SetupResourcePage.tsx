import { DeleteSetupDialog } from '@/components/setups/DeleteSetupDialog'
import { SetupApiNotice } from '@/components/setups/SetupApiNotice'
import { PageHeader } from '@/components/layout/PageHeader'
import { AddButton } from '@/components/ui/add-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FormField, Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SetupResourceConfig } from '@/pages/setups/setupConfigTypes'
import { ApiError } from '@/lib/api'
import {
  createSetupRecord,
  deleteSetupRecord,
  fetchModelsByBrand,
  listSetupRecords,
  updateSetupRecord,
} from '@/lib/setupsApi'
import { cn } from '@/lib/utils'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface SelectOption {
  value: string
  label: string
}

interface SetupResourcePageProps<T extends { id: number }> {
  config: SetupResourceConfig<T>
}

function FieldSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [box, setBox] = useState({ top: 0, left: 0, width: 0, maxHeight: 224 })
  const selected = options.find((option) => option.value === value)

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom - 8
    const spaceAbove = rect.top - 8
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow
    const maxHeight = Math.max(120, Math.min(224, openUp ? spaceAbove : spaceBelow))
    setBox({
      top: openUp ? rect.top - 4 - maxHeight : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
    })
  }, [])

  useEffect(() => {
    if (!open) return
    place()

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border-input bg-surface px-3 py-1 text-left text-sm',
          'focus-visible:outline-none focus-visible:border-maroon focus-visible:ring-2 focus-visible:ring-maroon-light',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span className={cn('truncate', selected ? 'text-text-primary' : 'text-text-secondary')}>
          {selected?.label ?? placeholder ?? 'Select'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary" />
      </button>
      {open && !disabled
        ? createPortal(
            <ul
              ref={menuRef}
              role="listbox"
              style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
              className="fixed z-[80] overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
            >
              {placeholder ? (
                <li>
                  <button
                    type="button"
                    className="flex w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-maroon-light"
                    onClick={() => {
                      onChange('')
                      setOpen(false)
                    }}
                  >
                    {placeholder}
                  </button>
                </li>
              ) : null}
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    className={cn(
                      'flex w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-maroon-light',
                      option.value === value && 'bg-maroon-light',
                    )}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </>
  )
}

export function SetupResourcePage<T extends { id: number }>({
  config,
}: SetupResourcePageProps<T>) {
  const [records, setRecords] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>(config.getEmptyForm())
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [optionSets, setOptionSets] = useState<Record<string, SelectOption[]>>({})
  const [dependentModels, setDependentModels] = useState<SelectOption[]>([])

  const needsOptions = useMemo(
    () => config.fields.some((field) => field.type === 'select'),
    [config.fields],
  )

  const loadOptions = useCallback(async () => {
    const next: Record<string, SelectOption[]> = {}

    async function loadSimple(
      key: string,
      resource: 'customers' | 'brands' | 'categories' | 'units' | 'positions',
      collectionKey: string,
    ) {
      const result = await listSetupRecords<Record<string, unknown>>(
        resource,
        collectionKey,
        { per_page: 100, status: 'active' },
      )
      next[key] = result.items.map((item) => ({
        value: String(item.id),
        label: String(item.name ?? item.code ?? item.id),
      }))
    }

    if (needsOptions) {
      await Promise.all([
        loadSimple('customers', 'customers', 'customers'),
        loadSimple('brands', 'brands', 'brands'),
        loadSimple('categories', 'categories', 'categories'),
        loadSimple('units', 'units', 'units'),
        loadSimple('positions', 'positions', 'positions'),
      ])
    }

    setOptionSets(next)
  }, [needsOptions])

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await listSetupRecords<T>(config.resource, config.collectionKey, {
        search,
        status: statusFilter || undefined,
        page,
        per_page: 100,
      })
      setRecords(result.items)
      setTotalPages(result.pagination.last_page)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load records.')
      setRecords([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [config.collectionKey, config.resource, page, search, statusFilter])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    if (formOpen && needsOptions) {
      void loadOptions()
    }
  }, [formOpen, needsOptions, loadOptions])

  useEffect(() => {
    const brandId = String(form.brand_id ?? '')
    if (!brandId) {
      setDependentModels([])
      return
    }

    void fetchModelsByBrand(Number(brandId))
      .then((result) => {
        setDependentModels(
          result.items.map((model) => ({
            value: String(model.id),
            label: model.name,
          })),
        )
      })
      .catch(() => setDependentModels([]))
  }, [form.brand_id])

  function openCreate() {
    setEditing(null)
    setForm(config.getEmptyForm())
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: T) {
    setEditing(row)
    setForm(config.mapRowToForm(row))
    setFormError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setFormError(null)
  }

  function updateField(name: string, value: string | number) {
    setForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'brand_id') {
        next.model_id = ''
      }
      return next
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    const rawPayload = { ...form }
    config.fields.forEach((field) => {
      if (field.type === 'number') {
        rawPayload[field.name] = Number(rawPayload[field.name] ?? 0)
      }
      if (field.type === 'select' && field.optionsKey) {
        rawPayload[field.name] =
          rawPayload[field.name] === '' ? '' : Number(rawPayload[field.name])
      }
    })

    const payload = config.sanitizePayload
      ? config.sanitizePayload(rawPayload, Boolean(editing))
      : rawPayload

    if (!editing) {
      const passwordField = config.fields.find((field) => field.name === 'password')
      if (passwordField?.required && !payload.password) {
        setFormError('Password is required.')
        return
      }
    }

    try {
      if (editing) {
        await updateSetupRecord(
          config.resource,
          config.singularKey,
          editing.id,
          payload,
        )
      } else {
        await createSetupRecord(config.resource, config.singularKey, payload)
      }

      closeForm()
      await loadRecords()
    } catch (err) {
      if (err instanceof ApiError) {
        const firstFieldError = err.errors
          ? Object.values(err.errors)[0]?.[0]
          : undefined
        setFormError(firstFieldError ?? err.message)
        return
      }
      setFormError('Failed to save record.')
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    try {
      await deleteSetupRecord(config.resource, deleteTarget.id)
      setDeleteTarget(null)
      await loadRecords()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete record.')
      setDeleteTarget(null)
    }
  }

  function renderCell(row: T, key: string, render?: (row: T) => React.ReactNode) {
    if (render) return render(row)
    const value = (row as Record<string, unknown>)[key]
    if (key === 'status') {
      return (
        <Badge variant={value === 'active' ? 'approved' : 'draft'}>
          {String(value)}
        </Badge>
      )
    }
    return value ? String(value) : '—'
  }

  function renderField(field: (typeof config.fields)[number]) {
    const value = String(form[field.name] ?? '')

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(event) => updateField(field.name, event.target.value)}
          className="min-h-24 w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm"
        />
      )
    }

    if (field.type === 'status') {
      return (
        <FieldSelect
          value={value}
          onChange={(next) => updateField(field.name, next)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      )
    }

    if (field.type === 'select') {
      const options = field.staticOptions?.length
        ? field.staticOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))
        : field.optionsKey === 'models' && field.dependsOn
          ? dependentModels
          : optionSets[field.optionsKey ?? ''] ?? []

      return (
        <FieldSelect
          value={value}
          onChange={(next) => updateField(field.name, next)}
          options={options}
          placeholder={`Select ${field.label}`}
          disabled={field.dependsOn === 'brand_id' && !form.brand_id}
        />
      )
    }

    return (
      <Input
        type={
          field.type === 'number'
            ? 'number'
            : field.type === 'date'
              ? 'date'
              : field.type === 'email'
                ? 'email'
                : field.type === 'password'
                  ? 'password'
                  : 'text'
        }
        value={field.type === 'number' ? String(form[field.name] ?? 0) : value}
        onChange={(event) =>
          updateField(
            field.name,
            field.type === 'number' ? Number(event.target.value) : event.target.value,
          )
        }
        required={
          field.required &&
          (!editing || (field.name !== 'password' && field.name !== 'password_confirmation'))
        }
        placeholder={
          editing && (field.name === 'password' || field.name === 'password_confirmation')
            ? 'Leave blank to keep current password'
            : field.placeholder
        }
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={config.title}
        action={<AddButton label={`Add ${config.title}`} onClick={openCreate} />}
      />

      <SetupApiNotice />

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <FormField label="Search">
          <Input
            placeholder={`Search ${config.title.toLowerCase()}s...`}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </FormField>
        <FormField label="Status">
          <FieldSelect
            value={statusFilter}
            placeholder="All Status"
            onChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </FormField>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {config.columns.map((column) => (
                <TableHead key={column.key}>{column.label}</TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={config.columns.length + 1} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={config.columns.length + 1} className="text-center">
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((row) => (
                <TableRow key={row.id}>
                  {config.columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(row, column.key, column.render)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded-md p-2 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                        aria-label={`Edit ${config.getRecordLabel(row)}`}
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-2 text-text-secondary hover:bg-error-bg hover:text-error-text"
                        aria-label={`Delete ${config.getRecordLabel(row)}`}
                        onClick={() => setDeleteTarget(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      ) : null}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-text-primary">
              {editing ? `Edit ${config.title}` : `Add ${config.title}`}
            </h2>

            {formError ? (
              <p className="mt-3 rounded-md border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
                {formError}
              </p>
            ) : null}

            <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              {config.fields.map((field) => (
                <FormField
                  key={field.name}
                  label={field.label}
                  className={field.type === 'textarea' ? 'md:col-span-2' : undefined}
                >
                  {renderField(field)}
                </FormField>
              ))}

              <div className="flex justify-end gap-3 md:col-span-2">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteSetupDialog
        title={config.title}
        recordLabel={deleteTarget ? config.getRecordLabel(deleteTarget) : null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
