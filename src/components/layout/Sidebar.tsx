import logo from '@/assets/logo.png'
import { navigation } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { SidebarNavItem } from './SidebarNavItem'

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[250px] flex-col bg-maroon print:hidden">
      <div className="shrink-0 px-3 pt-4 pb-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-maroon-dark"
          aria-label="Go to Dashboard"
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
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
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
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
