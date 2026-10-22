import type { CatalogItem } from '@/data/quotationTypes'
import { formatCurrency } from '@/lib/quotations'
import { cn } from '@/lib/utils'
import { ChevronDown, Search } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ItemSearchFieldProps {
  items: CatalogItem[]
  selectedId?: string
  excludeIds?: string[]
  disabled?: boolean
  placeholder?: string
  onSelect: (item: CatalogItem) => void
}

export function ItemSearchField({
  items,
  selectedId,
  excludeIds = [],
  disabled = false,
  placeholder = 'Type to search item...',
  onSelect,
}: ItemSearchFieldProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const selected = items.find((row) => row.id === selectedId) ?? null
  const [query, setQuery] = useState(selected?.name ?? '')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [menuBox, setMenuBox] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    setQuery(selected?.name ?? '')
  }, [selected?.id, selected?.name])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const available = items.filter(
      (row) => row.id === selectedId || !excludeIds.includes(row.id),
    )
    const browsingSelected = Boolean(selected && query === selected.name)
    if (!needle || browsingSelected) return available.slice(0, 20)
    return available
      .filter((row) =>
        [row.name, row.code, row.barcode ?? ''].some((value) =>
          value.toLowerCase().includes(needle),
        ),
      )
      .slice(0, 20)
  }, [excludeIds, items, query, selected, selectedId])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useLayoutEffect(() => {
    if (!open) return

    function updatePosition() {
      const el = inputRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setMenuBox({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, query, matches.length])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
      setQuery(selected?.name ?? '')
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [selected?.name])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      setQuery(selected?.name ?? '')
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [open, selected?.name])

  function choose(item: CatalogItem) {
    onSelect(item)
    setQuery(item.name)
    setOpen(false)
  }

  const menu =
    open && !disabled
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
            className="fixed z-[80] max-h-56 overflow-auto rounded-md border border-border bg-surface py-1 shadow-lg"
          >
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-secondary">No matching items.</li>
            ) : (
              matches.map((item, index) => (
                <li key={item.id} role="option" aria-selected={item.id === selectedId}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-maroon-light',
                      index === activeIndex && 'bg-maroon-light',
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(item)}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-text-primary">{item.name}</span>
                      <span className="block text-xs text-text-secondary">{item.code}</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-text-secondary">
                      {formatCurrency(item.unitPrice)}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => {
          if (!disabled) setOpen(true)
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
            setActiveIndex((current) => Math.min(current + 1, Math.max(matches.length - 1, 0)))
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((current) => Math.max(current - 1, 0))
          } else if (event.key === 'Enter' && open && matches[activeIndex]) {
            event.preventDefault()
            choose(matches[activeIndex])
          }
        }}
        className={cn(
          'flex h-9 w-full rounded-md border border-border-input bg-surface py-1 pl-9 pr-9 text-sm text-text-primary',
          'placeholder:text-text-secondary',
          'focus-visible:border-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-light',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
      {menu}
    </div>
  )
}
