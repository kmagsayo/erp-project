import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface PrintButtonProps {
  onPrint: () => void
  disabled?: boolean
}

export function PrintButton({ onPrint, disabled }: PrintButtonProps) {
  return (
    <Button onClick={onPrint} disabled={disabled}>
      <Printer className="h-4 w-4" />
      Print
    </Button>
  )
}
