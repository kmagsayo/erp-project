import logo from '@/assets/logo.png'
import { navigation } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SidebarNavItem } from './SidebarNavItem'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        className={cn(
          'fixed inset-0 z-40 bg-black/50 lg:hidden',
          open ? 'block' : 'hidden',
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-[min(250px,85vw)] flex-col bg-maroon transition-transform duration-200 print:hidden',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Main navigation"
      >
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pt-4 pb-3">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-maroon-dark"
            aria-label="Go to Dashboard"
            onClick={onClose}
          >
            <img
              src={logo}
              alt="ResponsivCode ERP"
              width={42}
              height={42}
              className="nav-logo"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold tracking-wide text-white">
                RESPONSIVCODE
              </div>
              <div className="text-xs text-white/70">ERP</div>
            </div>
          </Link>
          <button
            type="button"
            className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-maroon-dark hover:text-white lg:hidden"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
          {navigation.map((section, sectionIndex) => (
            <div key={section.heading ?? sectionIndex} className={cn(sectionIndex > 0 && 'mt-4')}>
              {section.heading && (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                  {section.heading}
                </div>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavItem
                    key={item.path}
                    to={item.path}
                    label={item.label}
                    icon={item.icon}
                    end={item.path === '/' || item.path === '/inventory'}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
