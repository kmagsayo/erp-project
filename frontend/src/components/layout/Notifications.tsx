import { buildNotifications, type AppNotification } from '@/lib/buildNotifications'
import { useErp } from '@/data/erpStore'
import { cn } from '@/lib/utils'
import { Bell, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const READ_KEY = 'erp-notification-read'

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)))
}

export function Notifications() {
  const { purchaseOrders, outslips, deliveryReceipts, gatePasses } = useErp()
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(loadReadIds)
  const panelRef = useRef<HTMLDivElement>(null)

  const notifications = useMemo(
    () => buildNotifications(purchaseOrders, outslips, deliveryReceipts, gatePasses),
    [purchaseOrders, outslips, deliveryReceipts, gatePasses],
  )

  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function markRead(id: string) {
    setReadIds((current) => {
      const next = new Set(current)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }

  function markAllRead() {
    const next = new Set(notifications.map((item) => item.id))
    setReadIds(next)
    saveReadIds(next)
  }

  function handleOpenNotification(item: AppNotification) {
    markRead(item.id)
    setOpen(false)
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        className="relative rounded-md p-2 text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-maroon px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-1.5rem),24rem)] overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  className="text-xs font-medium text-maroon hover:underline"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-md p-1 text-text-secondary hover:bg-maroon-light hover:text-maroon"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-secondary">
                No notifications right now.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((item) => {
                  const unread = !readIds.has(item.id)
                  const content = (
                    <>
                      <p className="text-sm font-medium text-text-primary">{item.title}</p>
                      <p className="mt-1 text-xs text-text-secondary">{item.message}</p>
                    </>
                  )

                  return (
                    <li key={item.id}>
                      {item.link ? (
                        <Link
                          to={item.link}
                          className={cn(
                            'block px-4 py-3 transition-colors hover:bg-maroon-light/60',
                            unread && 'bg-maroon-light/30',
                          )}
                          onClick={() => handleOpenNotification(item)}
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={cn(
                            'block w-full px-4 py-3 text-left transition-colors hover:bg-maroon-light/60',
                            unread && 'bg-maroon-light/30',
                          )}
                          onClick={() => handleOpenNotification(item)}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
