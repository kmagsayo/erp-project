import Barcode from 'react-barcode'

const sizes = {
  compact: { width: 1, height: 36, fontSize: 10 },
  default: { width: 1.4, height: 56, fontSize: 12 },
}

export function ItemBarcode({
  value,
  compact = false,
  size,
}: {
  value?: string | null
  compact?: boolean
  size?: keyof typeof sizes
}) {
  const barcode = value?.trim() ?? ''
  if (!barcode) {
    return <span className="text-text-secondary">—</span>
  }

  const preset = sizes[size ?? (compact ? 'compact' : 'default')]

  return (
    <Barcode
      value={barcode}
      format="CODE128"
      width={preset.width}
      height={preset.height}
      fontSize={preset.fontSize}
      margin={0}
      background="transparent"
      lineColor="#1a1614"
      displayValue
    />
  )
}
