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
import { formatItemCode } from '@/data/setupTypes'
import { ApiError } from '@/lib/api'
import {
  createSetupRecord,
  deleteSetupRecord,
  fetchModelsByBrand,
  listItems,
  listSetupRecords,
  updateSetupRecord,
  type BrandSetup,
  type CategorySetup,
  type ItemSetup,
  type ProductModelSetup,
  type UnitOfMeasureSetup,
} from '@/lib/setupsApi'
import { cn } from '@/lib/utils'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

const emptyForm = {
  item_name: '',
  category_id: '',
  brand_id: '',
  model_id: '',
  unit_of_measure_id: '',
  unit_price: '0',
  minimum_stock: '0',
  stock_on_hand: '0',
  status: 'active',
}

const selectClassName =
  'flex h-9 w-full rounded-md border border-border-input bg-surface px-3 py-1 text-sm text-text-primary focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light'

function stockBadge(status: ItemSetup['stock_status']) {
  if (status === 'low') return { label: 'Low Stock', variant: 'pending' as const }
  if (status === 'out') return { label: 'Out of Stock', variant: 'cancelled' as const }
  return { label: 'In Stock', variant: 'approved' as const }
}

export function ItemSetupPage() {
  const [records, setRecords] = useState<ItemSetup[]>([])
  const [categories, setCategories] = useState<CategorySetup[]>([])
  const [brands, setBrands] = useState<BrandSetup[]>([])
  const [units, setUnits] = useState<UnitOfMeasureSetup[]>([])
  const [models, setModels] = useState<ProductModelSetup[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ItemSetup | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ItemSetup | null>(null)

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [result, categoryResult, brandResult, unitResult] = await Promise.all([
        listItems({
          page,
          per_page: 100,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
        }),
        listSetupRecords<CategorySetup>('categories', 'categories', { per_page: 100, status: 'active' }),
        listSetupRecords<BrandSetup>('brands', 'brands', { per_page: 100, status: 'active' }),
        listSetupRecords<UnitOfMeasureSetup>('units', 'units', { per_page: 100, status: 'active' }),
      ])
      setRecords(result.items)
      setTotalPages(result.pagination.last_page)
      setCategories(categoryResult.items)
      setBrands(brandResult.items)
      setUnits(unitResult.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load items.')
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    if (!form.brand_id) {
      setModels([])
      return
    }
    void fetchModelsByBrand(Number(form.brand_id))
      .then((result) => setModels(result.items))
      .catch(() => setModels([]))
  }, [form.brand_id])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: ItemSetup) {
    setEditing(row)
    setForm({
      item_name: row.item_name,
      category_id: String(row.category_id),
      brand_id: String(row.brand_id),
      model_id: String(row.model_id),
      unit_of_measure_id: String(row.unit_of_measure_id),
      unit_price: String(row.unit_price ?? 0),
      minimum_stock: String(row.minimum_stock ?? 0),
      stock_on_hand: String(row.stock_on_hand ?? 0),
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
      item_name: form.item_name.trim(),
      category_id: Number(form.category_id || categories[0]?.id),
      brand_id: Number(form.brand_id),
      model_id: Number(form.model_id),
      unit_of_measure_id: Number(form.unit_of_measure_id),
      unit_price: Number(form.unit_price || 0),
      minimum_stock: Number(form.minimum_stock || 0),
      stock_on_hand: Number(form.stock_on_hand || 0),
      status: form.status || 'active',
    }
    if (!payload.category_id) {
      setFormError('No category is available. Please add a category first.')
      setSaving(false)
      return
    }
    try {
      if (editing) {
        await updateSetupRecord('items', 'item', editing.id, payload)
      } else {
        await createSetupRecord('items', 'item', payload)
      }
      setFormOpen(false)
      await loadRecords()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save item.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteSetupRecord('items', deleteTarget.id)
      setDeleteTarget(null)
      await loadRecords()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete item.')
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Setup / Item"
        title="Item Setup"
        description="Product catalog with live stock on hand."
        action={<AddButton label="Add Item" onClick={openCreate} />}
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
              aria-label="Search items"
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
                <TableHead>Item Code</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit of Measure</TableHead>
                <TableHead>Stock on Hand</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-text-secondary">
                    Loading items...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-text-secondary">
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row) => {
                  const stock = stockBadge(row.stock_status)
                  const unit = row.unit_of_measure?.name ?? '—'
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-text-primary">
                        {row.item_code || formatItemCode(row.id)}
                      </TableCell>
                      <TableCell className="text-text-primary">{row.brand?.name ?? '—'}</TableCell>
                      <TableCell className="text-text-primary">{row.model?.name ?? '—'}</TableCell>
                      <TableCell className="text-text-primary">{row.item_name}</TableCell>
                      <TableCell className="text-text-primary">{row.category?.name ?? '—'}</TableCell>
                      <TableCell className="text-text-primary">{unit}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-text-primary">
                            {row.stock_on_hand ?? 0} {unit}
                          </span>
                          <Badge variant={stock.variant}>{stock.label}</Badge>
                        </div>
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
                            aria-label={`Edit ${row.item_code}`}
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-md p-2 text-error-text hover:bg-error-bg"
                            aria-label={`Delete ${row.item_code}`}
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
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
              {editing ? 'Edit Item' : 'Add Item'}
            </h2>
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <FormField label="Brand">
                <select
                  required
                  value={form.brand_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      brand_id: event.target.value,
                      model_id: '',
                    }))
                  }
                  className={selectClassName}
                >
                  <option value="">Select...</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Model">
                <select
                  required
                  value={form.model_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, model_id: event.target.value }))
                  }
                  className={selectClassName}
                  disabled={!form.brand_id}
                >
                  <option value="">Select...</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Category">
                <select
                  required
                  value={form.category_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category_id: event.target.value }))
                  }
                  className={selectClassName}
                >
                  <option value="">Select...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Item Name">
                <Input
                  required
                  value={form.item_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, item_name: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Unit Price">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={form.unit_price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unit_price: event.target.value }))
                  }
                />
              </FormField>
              <FormField label="Unit of Measure">
                <select
                  required
                  value={form.unit_of_measure_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unit_of_measure_id: event.target.value }))
                  }
                  className={selectClassName}
                >
                  <option value="">Select...</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Minimum Stock">
                  <Input
                    type="number"
                    min={0}
                    value={form.minimum_stock}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, minimum_stock: event.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Stock on Hand">
                  <Input
                    type="number"
                    min={0}
                    value={form.stock_on_hand}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, stock_on_hand: event.target.value }))
                    }
                  />
                </FormField>
              </div>
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
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <DeleteSetupDialog
        title="Item"
        recordLabel={deleteTarget?.item_code ?? deleteTarget?.item_name ?? null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
