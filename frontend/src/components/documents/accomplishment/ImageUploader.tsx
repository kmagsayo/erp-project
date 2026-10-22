import { Upload } from 'lucide-react'
import type { ChangeEvent } from 'react'

interface ImageUploaderProps {
  onSelect: (files: File[]) => void
  disabled?: boolean
}

export function ImageUploader({ onSelect, disabled }: ImageUploaderProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length > 0) onSelect(files)
  }

  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-maroon bg-surface px-4 py-2 text-sm font-medium text-maroon hover:bg-maroon-light ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      <Upload className="h-4 w-4" />
      {disabled ? 'Optimizing…' : 'Upload pictures'}
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
      />
    </label>
  )
}
