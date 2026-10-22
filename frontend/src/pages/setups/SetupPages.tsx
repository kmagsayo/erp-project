import { SetupResourcePage } from '@/components/setups/SetupResourcePage'
import {
  brandConfig,
  categoryConfig,
  modelConfig,
  projectConfig,
  unitConfig,
  userConfig,
} from '@/pages/setups/setupConfigs'

export function CategorySetupPage() {
  return <SetupResourcePage config={categoryConfig} />
}

export function BrandSetupPage() {
  return <SetupResourcePage config={brandConfig} />
}

export function ModelSetupPage() {
  return <SetupResourcePage config={modelConfig} />
}

export function UnitSetupPage() {
  return <SetupResourcePage config={unitConfig} />
}

export function ProjectSetupPage() {
  return <SetupResourcePage config={projectConfig} />
}

export function UserSetupPage() {
  return <SetupResourcePage config={userConfig} />
}
