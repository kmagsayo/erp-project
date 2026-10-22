import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/data/auth'
import { ErpProvider } from '@/data/erpStore'
import { AccomplishmentReportsPage } from '@/pages/AccomplishmentReports'
import { BillingPage } from '@/pages/Billing'
import { DashboardPage } from '@/pages/Dashboard'
import { DeliveryReceiptsPage } from '@/pages/DeliveryReceipts'
import { DocumentPreviewPage } from '@/pages/DocumentPreview'
import { GatePassesPage } from '@/pages/GatePasses'
import { InventoryReportsPage } from '@/pages/InventoryReports'
import { LoginPage } from '@/pages/Login'
import { OutslipsPage } from '@/pages/Outslips'
import { PurchaseOrdersPage } from '@/pages/PurchaseOrders'
import { QuotationsPage } from '@/pages/Quotations'
import { ReceivingPage } from '@/pages/Receiving'
import { ReportsPage } from '@/pages/Reports'
import { SettingsPage } from '@/pages/Settings'
import { StatementOfAccountPage } from '@/pages/StatementOfAccount'
import { CompanySetupPage } from '@/pages/setups/CompanySetupPage'
import { BranchSetupPage } from '@/pages/setups/BranchSetupPage'
import { PositionSetupPage } from '@/pages/setups/PositionSetupPage'
import { ItemSetupPage } from '@/pages/setups/ItemSetupPage'
import { SupplierSetupPage } from '@/pages/setups/SupplierSetupPage'
import { CustomerSetupPage } from '@/pages/setups/CustomerSetupPage'
import {
  BrandSetupPage,
  CategorySetupPage,
  ModelSetupPage,
  ProjectSetupPage,
  UnitSetupPage,
  UserSetupPage,
} from '@/pages/setups/SetupPages'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'

function ReceivingAliasRedirect() {
  const [params] = useSearchParams()
  const search = params.toString()
  return <Navigate to={`/inventory/receiving${search ? `?${search}` : ''}`} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ErpProvider>
        <BrowserRouter>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="quotations/*" element={<QuotationsPage />} />
            <Route path="purchase-orders/*" element={<PurchaseOrdersPage />} />
            <Route path="purchase-order" element={<Navigate to="/purchase-orders" replace />} />
            <Route path="receiving" element={<ReceivingAliasRedirect />} />
            <Route path="inventory/receiving" element={<ReceivingPage />} />
            <Route path="outslips" element={<OutslipsPage />} />
            <Route path="outslip" element={<OutslipsPage />} />
            <Route path="gate-passes" element={<GatePassesPage />} />
            <Route path="gate-pass" element={<GatePassesPage />} />
            <Route path="inventory" element={<InventoryReportsPage />} />
            <Route path="inventory/reports" element={<ReportsPage />} />
            <Route path="inventory/outslips" element={<Navigate to="/outslips" replace />} />
            <Route path="inventory/movements" element={<Navigate to="/inventory" replace />} />
            <Route path="inventory/stock-in" element={<Navigate to="/inventory/receiving" replace />} />
            <Route path="inventory/stock-out" element={<Navigate to="/inventory" replace />} />
            <Route path="inventory/history" element={<Navigate to="/inventory" replace />} />
            <Route path="delivery-receipts" element={<DeliveryReceiptsPage />} />
            <Route path="delivery-receipt" element={<DeliveryReceiptsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="soa" element={<StatementOfAccountPage />} />
            <Route path="statement-of-account" element={<Navigate to="/soa" replace />} />
            <Route path="accomplishments" element={<AccomplishmentReportsPage />} />
            <Route path="reports/accomplishment" element={<AccomplishmentReportsPage />} />
            <Route path="setup/users" element={<UserSetupPage />} />
            <Route path="setup/company" element={<CompanySetupPage />} />
            <Route path="setup/branch" element={<BranchSetupPage />} />
            <Route path="setup/project" element={<ProjectSetupPage />} />
            <Route path="setup/position" element={<PositionSetupPage />} />
            <Route path="setup/position-setup" element={<Navigate to="/setup/position" replace />} />
            <Route path="setup/category" element={<CategorySetupPage />} />
            <Route path="setup/brand" element={<BrandSetupPage />} />
            <Route path="setup/model" element={<ModelSetupPage />} />
            <Route path="setup/uom" element={<UnitSetupPage />} />
            <Route path="setup/items" element={<ItemSetupPage />} />
            <Route path="setup/suppliers" element={<SupplierSetupPage />} />
            <Route path="setup/supplier" element={<Navigate to="/setup/suppliers" replace />} />
            <Route path="setup/customers" element={<CustomerSetupPage />} />
            <Route path="customers" element={<Navigate to="/setup/customers" replace />} />
            <Route path="suppliers" element={<Navigate to="/setup/suppliers" replace />} />
            <Route path="products" element={<Navigate to="/setup/items" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="document-preview" element={<DocumentPreviewPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ErpProvider>
    </AuthProvider>
  )
}
