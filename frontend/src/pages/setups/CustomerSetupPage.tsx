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
import { formatCustomerCode } from '@/data/setupTypes'
import { ApiError } from '@/lib/api'
import {
  createSetupRecord,
  deleteSetupRecord,
  listCustomers,
  updateSetupRecord,
  type CustomerSetup,
} from '@/lib/setupsApi'
import { cn } from '@/lib/utils'
import { Pencil, Search, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  tin: '',
  terms: '',
  terms_type: '',
  status: 'active',
}

const termsTypeOptions = ['IN DAYS', 'NET']

const selectClassName =
  'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light'

function formatTerms(row: CustomerSetup) {
  const days = row.terms == null ? '' : String(row.terms)
  const type = row.terms_type?.trim() ?? ''
  const label = [days, type].filter(Boolean).join(' ')
  return label || '—'
}

export function CustomerSetupPage() {
  const [records, setRecords] = useState<CustomerSetup[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerSetup | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CustomerSetup | null>(null)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await         listCustomers({
        page,
        per_page: 50,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      })
      setRecords(result.items)
      setTotalPages(result.pagination.last_page)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load customers.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setFormError(null)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: CustomerSetup) {
    setEditing(row)
    setForm({
      name: row.name,
      phone: row.phone ?? '',
      address: row.address ?? '',
      tin: row.tin ?? '',
      terms: row.terms == null ? '' : String(row.terms),
      terms_type: row.terms_type ?? '',
      status: row.status === 'inactive' ? 'inactive' : 'active',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      tin: form.tin.trim(),
      terms: form.terms === '' ? null : Number(form.terms),
      terms_type: form.terms_type || null,
      status: form.status,
    }
    try {
      if (editing) {
        await updateSetupRecord('customers', 'customer', editing.id, payload)
      } else {
        await createSetupRecord('customers', 'customer', payload)
      }
      closeForm()
      await loadRecords()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save customer.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteSetupRecord('customers', deleteTarget.id)
      setDeleteTarget(null)
      await loadRecords()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete customer.')
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Setup / Customer"
        title="Customer Setup"
        description="Manage customer master records."
        action={<AddButton label="Add Customer" onClick={openCreate} />}
      />

      <SetupApiNotice />

      <div className="rounded-lg border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
            <Input
              aria-label="Search customers"
              placeholder="Search..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="pl-9"
            />
          </div>
          <FormField
            label="Status"
            className="sm:w-48"
            labelClassName="text-xs font-normal text-text-secondary"
          >
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value)
                setPage(1)
              }}
              className={cn(selectClassName)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>

        {error ? (
          <div className="mx-4 mt-4 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error-text">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer Code</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact No.</TableHead>
                <TableHead>TIN</TableHead>
                <TableHead>Terms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-text-secondary">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-text-secondary">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-text-primary">
                      {row.code || formatCustomerCode(row.id)}
                    </TableCell>
                    <TableCell className="text-text-primary">{row.name}</TableCell>
                    <TableCell className="text-text-primary">{row.phone || '—'}</TableCell>
                    <TableCell className="text-text-primary">{row.tin || '—'}</TableCell>
                    <TableCell className="text-text-primary">{formatTerms(row)}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === 'active' ? 'approved' : 'cancelled'}>
                        {row.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded-md p-2 text-text-secondary hover:bg-table-header hover:text-text-primary"
                          aria-label={`Edit ${row.name}`}
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-2 text-error-text hover:bg-error-bg"
                          aria-label={`Delete ${row.name}`}
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
          <div className="border-t border-border px-4 py-3">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        ) : null}
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-text-primary">
                {editing ? 'Edit Customer' : 'Add Customer'}
              </h2>
              <button
                type="button"
                className="rounded-md p-1 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                aria-label="Close"
                onClick={closeForm}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-3 px-6 py-4" onSubmit={handleSubmit}>
              <FormField label="Customer Name">
                <Input
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </FormField>
              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                  className={selectClassName}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FormField>
              <FormField label="Address">
                <Input
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Contact No.">
                <Input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="TIN">
                  <Input
                    value={form.tin}
                    onChange={(event) => setForm((current) => ({ ...current, tin: event.target.value }))}
                  />
                </FormField>
                <FormField label="Terms (days)">
                  <Input
                    type="number"
                    min={0}
                    value={form.terms}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, terms: event.target.value }))
                    }
                  />
                </FormField>
              </div>
              <FormField label="Terms Type">
                <select
                  value={form.terms_type}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, terms_type: event.target.value }))
                  }
                  className={selectClassName}
                >
                  <option value="">Select...</option>
                  {termsTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </FormField>
              {formError ? <p className="text-sm text-error-text">{formError}</p> : null}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="secondary" onClick={closeForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteSetupDialog
        title="Customer"
        recordLabel={deleteTarget?.name ?? null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
