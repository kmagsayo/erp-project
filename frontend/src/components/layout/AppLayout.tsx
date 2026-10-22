import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BarcodeLookup } from './BarcodeLookup'

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!navOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setNavOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navOpen])

  return (
    <div className="min-h-screen overflow-x-hidden bg-page print:bg-white">
      <div className="print:hidden">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      </div>
      <div className="flex min-h-screen min-w-0 flex-col lg:ml-[250px] print:ml-0 print:block print:min-h-0">
        <div className="print:hidden">
          <Header onOpenNav={() => setNavOpen(true)} />
        </div>
        <main className="min-w-0 flex-1 p-4 sm:p-6 print:p-0">
          <Outlet />
        </main>
      </div>
      <BarcodeLookup />
    </div>
  )
}
