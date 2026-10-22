import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumb?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, breadcrumb, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4', className)}>
      <div className="min-w-0">
        {breadcrumb ? (
          <p className="mb-1 text-sm text-text-secondary">{breadcrumb}</p>
        ) : null}
        <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
