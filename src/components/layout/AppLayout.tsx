import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-page print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="ml-[250px] flex min-h-screen flex-col print:ml-0 print:block print:min-h-0">
        <div className="print:hidden">
          <Header />
        </div>
        <main className="flex-1 p-6 print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
