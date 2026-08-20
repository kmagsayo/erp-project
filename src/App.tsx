import { AppLayout } from '@/components/layout/AppLayout'
import { ErpProvider } from '@/data/erpStore'
import { AccomplishmentReportsPage } from '@/pages/AccomplishmentReports'
import { DashboardPage } from '@/pages/Dashboard'
import { DeliveryReceiptsPage } from '@/pages/DeliveryReceipts'
import { DocumentPreviewPage } from '@/pages/DocumentPreview'
import { InventoryReportsPage } from '@/pages/InventoryReports'
import { OutslipsPage } from '@/pages/Outslips'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { PurchaseOrdersPage } from '@/pages/PurchaseOrders'
import { QuotationsPage } from '@/pages/Quotations'
import { ReportsPage } from '@/pages/Reports'
import { SettingsPage } from '@/pages/Settings'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

function setupPage(title: string, description: string) {
  return <PlaceholderPage title={title} description={description} />
}

export default function App() {
  return (
    <ErpProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="outslips" element={<OutslipsPage />} />
            <Route path="inventory" element={<InventoryReportsPage />} />
            <Route path="inventory/reports" element={<ReportsPage />} />
            <Route path="inventory/outslips" element={<Navigate to="/outslips" replace />} />
            <Route path="inventory/receiving" element={<Navigate to="/inventory" replace />} />
            <Route path="inventory/movements" element={<Navigate to="/inventory" replace />} />
            <Route path="inventory/stock-in" element={<Navigate to="/inventory" replace />} />
            <Route path="inventory/stock-out" element={<Navigate to="/inventory" replace />} />
            <Route path="inventory/history" element={<Navigate to="/inventory" replace />} />
            <Route path="delivery-receipts" element={<DeliveryReceiptsPage />} />
            <Route path="accomplishments" element={<AccomplishmentReportsPage />} />
            <Route path="reports/accomplishment" element={<AccomplishmentReportsPage />} />
            <Route
              path="billing"
              element={setupPage('Billing', 'Generate and manage billing records.')}
            />
            <Route
              path="soa"
              element={setupPage(
                'Statement of Account',
                'Generate and manage customer SOA documents.',
              )}
            />
            <Route
              path="setup/users"
              element={setupPage('User', 'Manage system users and login accounts.')}
            />
            <Route
              path="setup/company"
              element={setupPage('Company', 'Configure company profile and letterhead.')}
            />
            <Route
              path="setup/branch"
              element={setupPage('Branch', 'Manage company branches.')}
            />
            <Route
              path="setup/project"
              element={setupPage('Project', 'Manage project master data.')}
            />
            <Route
              path="setup/position"
              element={setupPage('Position', 'Manage employee positions.')}
            />
            <Route
              path="setup/category"
              element={setupPage('Category', 'Manage item categories.')}
            />
            <Route
              path="setup/brand"
              element={setupPage('Brand', 'Manage item brands.')}
            />
            <Route
              path="setup/model"
              element={setupPage('Model', 'Manage item models.')}
            />
            <Route
              path="setup/uom"
              element={setupPage('Unit of Measure', 'Manage units of measure.')}
            />
            <Route
              path="setup/items"
              element={setupPage(
                'Items',
                'Manage items using brand, model, and item name.',
              )}
            />
            <Route
              path="setup/suppliers"
              element={setupPage('Suppliers', 'Manage supplier master data.')}
            />
            <Route
              path="setup/customers"
              element={setupPage('Customers', 'Manage customer master data.')}
            />
            <Route path="customers" element={<Navigate to="/setup/customers" replace />} />
            <Route path="suppliers" element={<Navigate to="/setup/suppliers" replace />} />
            <Route path="products" element={<Navigate to="/setup/items" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="document-preview" element={<DocumentPreviewPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErpProvider>
  )
}
