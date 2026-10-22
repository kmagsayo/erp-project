import {
  Archive,
  BarChart3,
  Box,
  Building2,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  Layers,
  Package,
  Receipt,
  Ruler,
  ScrollText,
  ShoppingCart,
  Tag,
  Ticket,
  Truck,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  path: string
  icon?: LucideIcon
  children?: NavItem[]
}

export interface NavGroup {
  label: string
  icon?: LucideIcon
  children: NavItem[]
}

export interface NavSection {
  heading?: string
  items: NavItem[]
  groups?: NavGroup[]
}

export const navigation: NavSection[] = [
  {
    items: [{ label: 'Dashboard', path: '/', icon: Home }],
  },
  {
    heading: 'TRANSACTIONS',
    items: [
      { label: 'Quotations', path: '/quotations', icon: FileText },
      { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
      { label: 'Receiving', path: '/inventory/receiving', icon: Package },
      { label: 'Outslips', path: '/outslips', icon: ClipboardList },
      { label: 'Gate Passes', path: '/gate-passes', icon: Ticket },
      { label: 'Delivery Receipts', path: '/delivery-receipts', icon: Truck },
      { label: 'Billing', path: '/billing', icon: Receipt },
      { label: 'Statement of Account', path: '/soa', icon: ScrollText },
      { label: 'Accomplishments', path: '/accomplishments', icon: BarChart3 },
    ],
  },
  {
    heading: 'SETUPS',
    items: [
      { label: 'User', path: '/setup/users', icon: User },
      { label: 'Company', path: '/setup/company', icon: Building2 },
      { label: 'Branch', path: '/setup/branch', icon: Building2 },
      { label: 'Project', path: '/setup/project', icon: FolderKanban },
      { label: 'Position', path: '/setup/position', icon: Users },
      { label: 'Category', path: '/setup/category', icon: Layers },
      { label: 'Brand', path: '/setup/brand', icon: Tag },
      { label: 'Model', path: '/setup/model', icon: Box },
      { label: 'Unit of Measure', path: '/setup/uom', icon: Ruler },
      { label: 'Items', path: '/setup/items', icon: Archive },
      { label: 'Suppliers', path: '/setup/suppliers', icon: Building2 },
      { label: 'Customers', path: '/setup/customers', icon: Users },
    ],
  },
  {
    heading: 'REPORTS',
    items: [{ label: 'Inventory', path: '/inventory', icon: Package }],
  },
]
