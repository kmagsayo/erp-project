import { useAuth } from '@/data/auth'
import { LogOut, Menu, Settings } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Notifications } from './Notifications'

function getHeaderTitle(pathname: string): string | null {
  if (pathname === '/') return 'Dashboard'
  return null
}

interface HeaderProps {
  onOpenNav: () => void
}

export function Header({ onOpenNav }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const pageTitle = getHeaderTitle(pathname)
  const initial = (user?.name ?? 'A').trim().charAt(0).toUpperCase() || 'A'

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-surface px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-maroon-light hover:text-maroon lg:hidden"
          aria-label="Open navigation"
          onClick={onOpenNav}
        >
          <Menu className="h-5 w-5" />
        </button>
        {pageTitle ? (
          <h1 className="truncate text-lg font-semibold text-text-primary sm:text-2xl">
            {pageTitle}
          </h1>
        ) : (
          <p className="truncate text-sm font-semibold text-text-primary lg:hidden">
            RESPONSIVCODE ERP
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <Notifications />
        <div className="flex items-center gap-2 rounded-md px-1 py-1.5 text-sm font-medium text-text-primary sm:px-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-xs font-semibold text-white">
            {initial}
          </div>
          <span className="hidden max-w-[9rem] truncate sm:inline">{user?.name ?? 'Admin'}</span>
        </div>
        <Link
          to="/settings"
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-maroon-light hover:text-maroon"
          aria-label="Log out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
