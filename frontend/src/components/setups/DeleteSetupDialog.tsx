import { Button } from '@/components/ui/button'

interface DeleteSetupDialogProps {
  title: string
  recordLabel: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteSetupDialog({
  title,
  recordLabel,
  onCancel,
  onConfirm,
}: DeleteSetupDialogProps) {
  if (!recordLabel) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-text-primary">Delete {title}?</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Are you sure you want to delete {recordLabel}?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
