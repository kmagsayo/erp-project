import { ScannedItemPopup } from '@/components/items/ScannedItemPopup'
import { ScannedTransactionPopup } from '@/components/layout/ScannedTransactionPopup'
import { usePhysicalBarcodeScan } from '@/hooks/usePhysicalBarcodeScan'
import { useErp } from '@/data/erpStore'
import { ApiError } from '@/lib/api'
import { matchCatalogItemByBarcode } from '@/lib/deliveryReceipts'
import { findCatalogItemByBarcode } from '@/lib/setupsApi'
import {
  BARCODE_SCAN_EVENT,
  findTransactionByCode,
  type ScannedTransaction,
} from '@/lib/transactionBarcode'
import type { ItemSetup } from '@/data/setupTypes'
import { useEffect, useRef, useState } from 'react'

export function BarcodeLookup() {
  const { purchaseOrders, receivings, outslips, gatePasses, deliveryReceipts } = useErp()
  const [barcode, setBarcode] = useState('')
  const [item, setItem] = useState<ItemSetup | null>(null)
  const [transaction, setTransaction] = useState<ScannedTransaction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const open = Boolean(barcode)

  function openScan(code: string) {
    setBarcode(code)
    setItem(null)
    setTransaction(null)
    setError(null)
    setLoading(true)
  }

  const openScanRef = useRef(openScan)
  openScanRef.current = openScan

  usePhysicalBarcodeScan(openScan)

  useEffect(() => {
    function handleLookup(event: Event) {
      const code = (event as CustomEvent<string>).detail
      if (typeof code === 'string' && code.trim()) openScanRef.current(code.trim())
    }

    window.addEventListener(BARCODE_SCAN_EVENT, handleLookup)
    return () => window.removeEventListener(BARCODE_SCAN_EVENT, handleLookup)
  }, [])

  useEffect(() => {
    if (!barcode) return
    const match = findTransactionByCode(barcode, {
      purchaseOrders,
      receivings,
      outslips,
      gatePasses,
      deliveryReceipts,
    })
    if (match) {
      setTransaction(match)
      setItem(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setTransaction(null)

    void findCatalogItemByBarcode(barcode)
      .then((result) => {
        if (cancelled) return
        const found = matchCatalogItemByBarcode(result.items, barcode)
        setItem(found ?? null)
        setError(found ? null : `No transaction or item matches barcode ${barcode}.`)
      })
      .catch((caught) => {
        if (cancelled) return
        setItem(null)
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Unable to look up the scanned barcode.',
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [barcode, purchaseOrders, receivings, outslips, gatePasses, deliveryReceipts])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setBarcode('')
        setItem(null)
        setTransaction(null)
        setError(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  function close() {
    setBarcode('')
    setItem(null)
    setTransaction(null)
    setError(null)
  }

  if (!open) return null
  if (transaction) {
    return <ScannedTransactionPopup transaction={transaction} onClose={close} />
  }

  return (
    <ScannedItemPopup
      barcode={barcode}
      item={item}
      loading={loading}
      error={error}
      onClose={close}
    />
  )
}
