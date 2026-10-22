import { useEffect, useRef } from 'react'

const RAPID_MS = 50
const MIN_BURST = 4
const MIN_LENGTH = 3
const IDLE_MS = 80

function isScannerTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true
  if (target instanceof HTMLTextAreaElement) return false
  if (target instanceof HTMLInputElement) {
    if (target.type === 'password') return false
    if (target.getAttribute('aria-label') === 'Scan Barcode') return false
  }
  return true
}

export function usePhysicalBarcodeScan(onScan: (barcode: string) => void) {
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    let buffer = ''
    let burst = 0
    let lastAt = 0
    let idleTimer: number | null = null

    function reset() {
      buffer = ''
      burst = 0
      if (idleTimer !== null) {
        window.clearTimeout(idleTimer)
        idleTimer = null
      }
    }

    function commit() {
      const code = buffer.trim()
      reset()
      if (code.length >= MIN_LENGTH) onScanRef.current(code)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return
      if (!isScannerTarget(event.target)) return

      const now = Date.now()
      const rapid = now - lastAt < RAPID_MS
      lastAt = now

      if (event.key === 'Enter') {
        if (burst >= MIN_BURST && buffer.length >= MIN_LENGTH) {
          event.preventDefault()
          event.stopPropagation()
          commit()
        } else {
          reset()
        }
        return
      }

      if (event.key.length !== 1) return

      if (rapid) {
        burst += 1
        buffer += event.key
        if (burst >= MIN_BURST - 1) {
          event.preventDefault()
        }
      } else {
        burst = 1
        buffer = event.key
      }

      if (idleTimer !== null) window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        if (burst >= MIN_BURST && buffer.length >= MIN_LENGTH) {
          commit()
        } else {
          reset()
        }
      }, IDLE_MS)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      reset()
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [])
}
