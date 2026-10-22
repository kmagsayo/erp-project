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
import { formatSupplierCode } from '@/data/setupTypes'
import { ApiError } from '@/lib/api'
import {
  createSetupRecord,
  deleteSetupRecord,
  listSuppliers,
  updateSetupRecord,
  type SupplierSetup,
} from '@/lib/setupsApi'
import { cn } from '@/lib/utils'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

const emptyForm = {
  name: '',
  contact_person: '',
  phone: '',
  tin: '',
  address: '',
  status: 'active',
}

const selectClassName =
  'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light'

export function SupplierSetupPage() {
  const [records, setRecords] = useState<SupplierSetup[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierSetup | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SupplierSetup | null>(null)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await         listSuppliers({
        page,
        per_page: 50,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      })
      setRecords(result.items)
      setTotalPages(result.pagination.last_page)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load suppliers.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: SupplierSetup) {
    setEditing(row)
    setForm({
      name: row.name,
      contact_person: row.contact_person ?? '',
      phone: row.phone ?? '',
      tin: row.tin ?? '',
      address: row.address ?? '',
      status: row.status || 'active',
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
      contact_person: form.contact_person.trim(),
      phone: form.phone.trim(),
      tin: form.tin.trim(),
      address: form.address.trim(),
      status: form.status,
    }
    try {
      if (editing) {
        await updateSetupRecord('suppliers', 'supplier', editing.id, payload)
      } else {
        await createSetupRecord('suppliers', 'supplier', payload)
      }
      setFormOpen(false)
      await loadRecords()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save supplier.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteSetupRecord('suppliers', deleteTarget.id)
      setDeleteTarget(null)
      await loadRecords()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete supplier.')
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Setup / Supplier"
        title="Supplier Setup"
        description="Manage supplier master records."
        action={<AddButton label="Add Supplier" onClick={openCreate} />}
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
              aria-label="Search suppliers"
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
                <TableHead>Supplier Code</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact No.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-text-secondary">
                    Loading suppliers...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-text-secondary">
                    No suppliers found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-text-primary">
                      {row.code || formatSupplierCode(row.id)}
                    </TableCell>
                    <TableCell className="text-text-primary">{row.name}</TableCell>
                    <TableCell className="text-text-primary">{row.contact_person || '—'}</TableCell>
                    <TableCell className="text-text-primary">{row.phone || '—'}</TableCell>
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-text-primary">
              {editing ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <FormField label="Supplier Name">
                <Input
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </FormField>
              <FormField label="Contact Person">
                <Input
                  value={form.contact_person}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contact_person: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Contact No.">
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </FormField>
              <FormField label="TIN No.">
                <Input
                  value={form.tin}
                  onChange={(event) => setForm((current) => ({ ...current, tin: event.target.value }))}
                />
              </FormField>
              <FormField label="Address">
                <textarea
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                  className="min-h-20 w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
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
              {formError ? <p className="text-sm text-error-text">{formError}</p> : null}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Supplier'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteSetupDialog
        title="Supplier"
        recordLabel={deleteTarget?.name ?? null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
