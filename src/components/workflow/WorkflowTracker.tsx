import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface WorkflowStage {
  label: string
  status: 'completed' | 'current' | 'future'
}

interface WorkflowTrackerProps {
  stages: WorkflowStage[]
  className?: string
}

export function WorkflowTracker({ stages, className }: WorkflowTrackerProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {stages.map((stage, index) => (
        <div key={stage.label} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                stage.status === 'completed' && 'bg-[#DCFCE7] text-[#15803D]',
                stage.status === 'current' && 'bg-maroon text-white',
                stage.status === 'future' && 'border-2 border-border bg-surface text-text-secondary',
              )}
            >
              {stage.status === 'completed' ? (
                <Check className="h-3.5 w-3.5" />
              ) : stage.status === 'current' ? (
                <span className="h-2 w-2 rounded-full bg-white" />
              ) : null}
            </div>
            {index < stages.length - 1 && (
              <div
                className={cn(
                  'my-1 h-6 w-0.5',
                  stage.status === 'completed' ? 'bg-[#15803D]' : 'bg-border',
                )}
              />
            )}
          </div>
          <span
            className={cn(
              'pb-6 text-sm',
              stage.status === 'current' && 'font-semibold text-maroon',
              stage.status === 'completed' && 'text-text-primary',
              stage.status === 'future' && 'text-text-secondary',
            )}
          >
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  )
}
