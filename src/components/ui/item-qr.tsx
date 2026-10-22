import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { request } from '@/lib/api'
import { receivingItemQrValue } from '@/lib/receivings'

let scanOrigin: Promise<string> | null = null

function loadScanOrigin() {
  scanOrigin ??= request<{ host: string | null; port: number }>('/network')
    .then((network) =>
      network.host ? `http://${network.host}:${network.port}` : window.location.origin,
    )
    .catch(() => window.location.origin)
  return scanOrigin
}

export function ItemQrCode({
  value,
  size = 56,
  title = 'Item QR',
}: {
  value: string
  size?: number
  title?: string
}) {
  return (
    <span className="receiving-line-qr">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#1a1614"
        title={title}
      />
    </span>
  )
}

export function ReceivingItemQr({
  receivingId,
  itemId,
  description,
  size = 220,
}: {
  receivingId: string
  itemId: string
  description: string
  size?: number
}) {
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadScanOrigin().then((origin) => {
      if (!cancelled) setValue(receivingItemQrValue(receivingId, itemId, origin))
    })
    return () => {
      cancelled = true
    }
  }, [receivingId, itemId])

  if (!value) {
    return <span className="text-sm text-text-secondary">Preparing QR…</span>
  }

  return <ItemQrCode value={value} size={size} title={`QR for ${description}`} />
}

export function DeliveryItemQr({
  receiptId,
  itemId,
  description,
  size = 220,
}: {
  receiptId: string
  itemId: string
  description: string
  size?: number
}) {
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadScanOrigin().then((origin) => {
      if (cancelled) return
      setValue(
        `${origin.replace(/\/$/, '')}/api/r?c=${encodeURIComponent(`DRITEM:${receiptId}:${itemId}`)}`,
      )
    })
    return () => {
      cancelled = true
    }
  }, [receiptId, itemId])

  if (!value) {
    return <span className="text-sm text-text-secondary">Preparing QR…</span>
  }

  return <ItemQrCode value={value} size={size} title={`QR for ${description}`} />
}

