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
import { ApiError } from '@/lib/api'
import {
  createSetupRecord,
  deleteSetupRecord,
  listBranches,
  listCompanies,
  updateSetupRecord,
  type BranchSetup,
  type CompanySetup,
} from '@/lib/setupsApi'
import { cn } from '@/lib/utils'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

const emptyForm = {
  company_id: '',
  name: '',
  address: '',
  contact_information: '',
  status: 'active',
}

export function BranchSetupPage() {
  const [records, setRecords] = useState<BranchSetup[]>([])
  const [companies, setCompanies] = useState<CompanySetup[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BranchSetup | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BranchSetup | null>(null)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [result, companyResult] = await Promise.all([
        listBranches({
          page,
          per_page: 15,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
        }),
        listCompanies({ per_page: 100, status: 'active' }),
      ])
      setRecords(result.items)
      setTotalPages(result.pagination.last_page)
      setCompanies(companyResult.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load branches.')
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
    setForm({
      ...emptyForm,
      company_id: companies[0] ? String(companies[0].id) : '',
    })
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: BranchSetup) {
    setEditing(row)
    setForm({
      company_id: row.company_id ? String(row.company_id) : '',
      name: row.name,
      address: row.address ?? '',
      contact_information: row.contact_information ?? '',
      status: row.status || 'active',
    })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!form.company_id) {
      setFormError('Please select a company.')
      return
    }
    setSaving(true)
    setFormError(null)
    const payload = {
      company_id: Number(form.company_id),
      name: form.name.trim(),
      address: form.address,
      contact_information: form.contact_information,
      status: form.status,
    }
    try {
      if (editing) {
        await updateSetupRecord('branches', 'branch', editing.id, payload)
      } else {
        await createSetupRecord('branches', 'branch', payload)
      }
      setFormOpen(false)
      await loadRecords()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save branch.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteSetupRecord('branches', deleteTarget.id)
      setDeleteTarget(null)
      await loadRecords()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete branch.')
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Setup / Branch"
        title="Branch"
        description="Manage company branches."
        action={<AddButton label="Add Branch" onClick={openCreate} />}
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
              aria-label="Search branches"
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
              className={cn(
                'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary',
                'focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light',
              )}
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
                <TableHead>Branch Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-text-secondary">
                    Loading branches...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-text-secondary">
                    No branches found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium text-text-primary">{row.name}</TableCell>
                    <TableCell className="text-text-primary">
                      {row.company?.name ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-text-primary">
                      {row.address?.trim() || row.company?.address?.trim() || '—'}
                    </TableCell>
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
              {editing ? 'Edit Branch' : 'Add Branch'}
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <FormField label="Branch Name">
                <Input
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </FormField>
              <FormField label="Company">
                <select
                  required
                  value={form.company_id}
                  onChange={(event) => {
                    const companyId = event.target.value
                    const company = companies.find((row) => String(row.id) === companyId)
                    setForm((current) => ({
                      ...current,
                      company_id: companyId,
                      address:
                        current.address.trim() ||
                        company?.address?.trim() ||
                        current.address,
                    }))
                  }}
                  className="flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
                >
                  <option value="">Select company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
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
              <FormField label="Contact Information">
                <Input
                  value={form.contact_information}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contact_information: event.target.value,
                    }))
                  }
                />
              </FormField>
              <FormField label="Status">
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                  className="flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light"
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
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Branch'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteSetupDialog
        title="Branch"
        recordLabel={deleteTarget?.name ?? null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
