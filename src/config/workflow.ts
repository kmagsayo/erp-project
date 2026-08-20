import type { WorkflowStage } from '@/components/workflow/WorkflowTracker'

export const ERP_WORKFLOW = [
  'Quotation',
  'Purchase Order',
  'Outslip',
  'Inventory & Reports',
  'Delivery Receipt',
  'Accomplishment',
] as const

export function workflowStages(current: (typeof ERP_WORKFLOW)[number]): WorkflowStage[] {
  const currentIndex = ERP_WORKFLOW.indexOf(current)

  return ERP_WORKFLOW.map((label, index) => {
    if (index < currentIndex) return { label, status: 'completed' as const }
    if (index === currentIndex) return { label, status: 'current' as const }
    return { label, status: 'future' as const }
  })
}
