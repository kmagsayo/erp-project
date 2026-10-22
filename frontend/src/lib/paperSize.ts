const SETTINGS_KEY = 'erp-settings'

const PAGE_SIZES: Record<string, string> = {
  A4: 'A4',
  Letter: 'letter',
  Legal: 'legal',
}

export function applyPrintPaperSize(paperSize?: string | null) {
  const size = PAGE_SIZES[paperSize ?? ''] ?? 'A4'
  let style = document.getElementById('erp-paper-size')
  if (!style) {
    style = document.createElement('style')
    style.id = 'erp-paper-size'
    document.head.appendChild(style)
  }
  style.textContent = `@media print { @page { size: ${size} portrait; margin: 0; } }`
}

export function applySavedPrintPaperSize() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    const paperSize = raw ? (JSON.parse(raw) as { paper_size?: string }).paper_size : undefined
    applyPrintPaperSize(paperSize)
  } catch {
    applyPrintPaperSize('A4')
  }
}
