import logo from '@/assets/logo.png'
import { companyInfo } from '@/data/accomplishmentReports'
import type { DeliveryReceipt } from '@/data/erpTypes'
import { deliveryReceiptBrandAndSerials } from '@/lib/deliveryReceipts'

function formatMoney(value: number): string {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDrDate(value: string): string {
  if (!value) return '—'
  const iso = Date.parse(`${value}T00:00:00`)
  const date = Number.isNaN(iso) ? new Date(value) : new Date(iso)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DeliveryReceiptDocument({ receipt }: { receipt: DeliveryReceipt }) {
  return (
    <div className="dr-document">
      <div className="dr-head">
        <img src={logo} alt={`${companyInfo.name} logo`} className="dr-logo" />
        <div className="dr-company">
          <div className="dr-company-name">{companyInfo.name}</div>
          {companyInfo.addressLines.map((line) => (
            <div key={line} className="dr-company-meta">
              {line}
            </div>
          ))}
          <div className="dr-company-meta">Tel no: {companyInfo.phone}</div>
          <div className="dr-company-meta">VAT REG. TIN.: {companyInfo.vatTin}</div>
        </div>
      </div>

      <h1 className="dr-title">DELIVERY RECEIPT</h1>

      <div className="dr-meta-row">
        <div className="dr-delivered-to">
          <div className="dr-label">Delivered to:</div>
          <div className="dr-customer-name">{receipt.customer}</div>
          <div className="dr-customer-address">{receipt.customerAddress || receipt.destination}</div>
        </div>
        <div className="dr-right-meta">
          <div className="dr-meta-line">
            <span>Date:</span>
            <span>{formatDrDate(receipt.date)}</span>
          </div>
          <div className="dr-meta-line">
            <span>Delivery No.:</span>
            <span>{receipt.id}</span>
          </div>
        </div>
      </div>

      <div className="dr-reference">
        <span className="dr-label">Reference:</span>
        <span>{receipt.reference || receipt.poId || '—'}</span>
      </div>

      <table className="dr-items-table">
        <thead>
          <tr>
            <th className="dr-col-no">NO.</th>
            <th className="dr-col-desc">ITEM DESCRIPTION</th>
            <th className="dr-col-brand">BRAND</th>
            <th className="dr-col-qty">QTY.</th>
            <th className="dr-col-unit">UNIT</th>
            <th className="dr-col-price">Unit Price</th>
            <th className="dr-col-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, index) => {
            const { brand } = deliveryReceiptBrandAndSerials(item)
            return (
            <tr key={item.id}>
              <td className="dr-col-no">{index + 1}</td>
              <td className="dr-col-desc">{item.description}</td>
              <td className="dr-col-brand">{brand || '—'}</td>
              <td className="dr-col-qty">{item.quantity}</td>
              <td className="dr-col-unit">{item.unit}</td>
              <td className="dr-col-price">{formatMoney(item.unitPrice)}</td>
              <td className="dr-col-total">{formatMoney(item.total)}</td>
            </tr>
            )
          })}
          <tr>
            <td colSpan={7} className="dr-nothing-follows">
              ****NOTHING FOLLOWS****
            </td>
          </tr>
        </tbody>
      </table>

      <div className="dr-total-wrap">
        <div className="dr-total-box">
          <span className="dr-total-label">TOTAL AMOUNT</span>
          <span className="dr-total-value">{formatMoney(receipt.totalAmount)}</span>
        </div>
      </div>

      <p className="dr-acknowledge">
        I/We acknowledged to have received in good order and condition the above
        merchandise(s) in accordance to the specifications stated subject to the terms and
        conditions.
      </p>

      <div className="dr-signatures">
        <div className="dr-signature">
          <div className="dr-signature-label">Delivered by:</div>
          <div className="dr-signature-line" />
          <div className="dr-signature-name">{receipt.deliveredBy || '—'}</div>
          <div className="dr-signature-role">
            {receipt.deliveredByPosition || 'Name / Position'}
          </div>
        </div>
        <div className="dr-signature">
          <div className="dr-signature-label">Received by:</div>
          <div className="dr-signature-line" />
          <div className="dr-signature-name">
            {receipt.receivedBy || 'Signature Over Printed Name'}
          </div>
        </div>
      </div>
    </div>
  )
}
