import { Bell, ChevronDown, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div />
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-maroon-light"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-xs font-semibold text-white">
            A
          </div>
          <span>Admin</span>
          <ChevronDown className="h-4 w-4 text-text-secondary" />
        </button>
        <Link
          to="/settings"
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  )
}
