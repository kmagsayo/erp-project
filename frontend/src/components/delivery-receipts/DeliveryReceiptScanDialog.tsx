import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DeliveryReceipt } from '@/data/erpTypes'
import { deliveryReceiptStatusLabel, formatDrDisplayDate, formatReceivedAt } from '@/lib/deliveryReceipts'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

interface DeliveryReceiptScanDialogProps {
  open: boolean
  receipt: DeliveryReceipt | null
  error: string | null
  resolving: boolean
  confirming: boolean
  onClose: () => void
  onCode: (code: string) => void
  onConfirm: (remarks: string) => void
}

export function DeliveryReceiptScanDialog({
  open,
  receipt,
  error,
  resolving,
  confirming,
  onClose,
  onCode,
  onConfirm,
}: DeliveryReceiptScanDialogProps) {
  const titleId = useId()
  const readerId = useId().replace(/:/g, '')
  const onCodeRef = useRef(onCode)
  const lastCode = useRef('')
  const [manualCode, setManualCode] = useState('')
  const [remarks, setRemarks] = useState('')
  const [cameraMessage, setCameraMessage] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  onCodeRef.current = onCode

  useEffect(() => {
    if (!open) {
      lastCode.current = ''
      setManualCode('')
      setRemarks('')
      setCameraMessage(null)
      setCameraReady(false)
    }
  }, [open])

  useEffect(() => {
    if (!open || receipt || resolving) return
    const scanner = new Html5Qrcode(readerId)
    let stopped = false

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          if (stopped || lastCode.current === decoded) return
          lastCode.current = decoded
          onCodeRef.current(decoded)
        },
        () => undefined,
      )
      .then(() => {
        if (!stopped) setCameraReady(true)
      })
      .catch((scanError: unknown) => {
        if (stopped) return
        const text = scanError instanceof Error ? scanError.message : String(scanError)
        setCameraMessage(
          /notallowed|permission/i.test(text)
            ? 'Camera permission was denied. Enter the delivery receipt number instead.'
            : 'Camera is unavailable. Allow camera access, or type the delivery receipt number.',
        )
      })

    return () => {
      stopped = true
      if (scanner.isScanning) {
        void scanner.stop().catch(() => undefined)
      }
    }
  }, [open, readerId, receipt, resolving])

  if (!open) return null

  const alreadyReceived = receipt?.status === 'received'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-text-primary">
            {receipt ? 'Confirm Delivery' : 'Scan QR Code'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delivery receipt scanner"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-maroon-light hover:text-maroon"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {error ? <p className="text-sm text-error-text">{error}</p> : null}

          {resolving ? (
            <p className="text-sm text-text-secondary">Looking up delivery receipt…</p>
          ) : null}

          {receipt ? (
            <>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Detail label="Delivery Receipt" value={receipt.id} />
                <Detail label="Status" value={deliveryReceiptStatusLabel[receipt.status]} />
                <Detail label="Customer" value={receipt.customer || '—'} />
                <Detail label="Outslip" value={receipt.outslipId || '—'} />
                <Detail label="Delivery Date" value={formatDrDisplayDate(receipt.date) || '—'} />
                <Detail label="Remarks" value={receipt.remarks || '—'} />
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-table-header text-left text-xs uppercase tracking-wide text-text-secondary">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-text-secondary">
                          No items on this delivery receipt.
                        </td>
                      </tr>
                    ) : (
                      receipt.items.map((item) => (
                        <tr key={item.id} className="border-t border-border">
                          <td className="px-3 py-2">
                            <div>{item.description}</div>
                            <div className="text-xs text-text-secondary">{item.itemCode}</div>
                          </td>
                          <td className="px-3 py-2">{item.allowedQuantity || item.quantity}</td>
                          <td className="px-3 py-2">{item.unit}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {alreadyReceived ? (
                <p className="text-sm text-text-secondary">
                  Already received
                  {receipt.receivedBy ? ` by ${receipt.receivedBy}` : ''}
                  {receipt.receivedAt ? ` on ${formatReceivedAt(receipt.receivedAt)}` : ''}.
                </p>
              ) : (
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-text-secondary">
                    Confirmation remarks
                  </span>
                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    maxLength={500}
                    className="min-h-20 w-full rounded-md border border-border-input bg-surface px-3 py-2 text-sm"
                  />
                </label>
              )}
            </>
          ) : resolving ? null : (
            <>
              <p className="text-sm text-text-secondary">
                Scan the QR code on the delivery receipt. Scanning only opens this delivery for
                review. It is not marked received until you confirm.
              </p>
              <div id={readerId} className="overflow-hidden rounded-lg bg-black/5" />
              {cameraReady ? null : (
                <p className="text-sm text-text-secondary">Starting the camera…</p>
              )}
              {cameraMessage ? <p className="text-sm text-text-secondary">{cameraMessage}</p> : null}
              <form
                className="flex flex-col gap-2 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault()
                  const code = manualCode.trim()
                  if (!code || resolving) return
                  onCode(code)
                }}
              >
                <Input
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  placeholder="DR-000001"
                  aria-label="Delivery receipt number"
                />
                <Button type="submit" variant="secondary" disabled={resolving}>
                  Look up
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {receipt && !alreadyReceived ? (
            <Button type="button" disabled={confirming || resolving} onClick={() => onConfirm(remarks)}>
              {confirming ? 'Confirming…' : 'Confirm Received'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-text-secondary">{label}: </span>
      <span className="font-medium text-text-primary">{value}</span>
    </p>
  )
}
