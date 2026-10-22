import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface AddButtonProps {
  label?: string
  onClick?: () => void
}

export function AddButton({ label = 'Add', onClick }: AddButtonProps) {
  return (
    <Button type="button" onClick={onClick}>
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  )
}
