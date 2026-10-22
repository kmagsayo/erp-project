import logo from '@/assets/logo.png'
import { companyInfo } from '@/data/accomplishmentReports'
import type { Outslip } from '@/data/erpTypes'
import { formatPrintMoney } from '@/lib/quotations'

const EMPTY_ROWS = 6

function formatLongDate(isoDate: string): string {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function receivingLabel(receivingId?: string): string {
  if (!receivingId) return ''
  const match = receivingId.match(/(\d+)\s*$/)
  if (!match) return receivingId
  return String(Number(match[1]))
}

export function OutslipDocument({ outslip }: { outslip: Outslip }) {
  const address = companyInfo.addressLines.filter(Boolean).join(', ')
  const rows = outslip.items.filter(
    (item) => item.releasedQuantity > 0 || item.poQuantity > 0 || item.description.trim(),
  )
  const emptyRows = Math.max(0, EMPTY_ROWS - rows.length)

  return (
    <div className="outslip-form-page">
      <div className="outslip-form-sheet">
        <div className="outslip-form-header">
          <img src={logo} alt="" className="outslip-form-logo" />
          <div className="outslip-form-company">
            <div className="outslip-form-company-name">{companyInfo.name}</div>
            {address ? <div>{address}</div> : null}
            {companyInfo.phone ? <div>Tel no: {companyInfo.phone}</div> : null}
            {companyInfo.vatTin ? <div>VAT REG. TIN.: {companyInfo.vatTin}</div> : null}
          </div>
        </div>

        <div className="outslip-form-title">OUTSLIP</div>

        <table className="outslip-form-meta">
          <tbody>
            <tr>
              <th>Outslip No.:</th>
              <td>{outslip.id}</td>
            </tr>
            <tr>
              <th>Date:</th>
              <td>{formatLongDate(outslip.date)}</td>
            </tr>
            <tr>
              <th>Customer:</th>
              <td>{outslip.customer}</td>
            </tr>
            <tr>
              <th>Receiving:</th>
              <td>{receivingLabel(outslip.receivingId)}</td>
            </tr>
            <tr>
              <th>Status:</th>
              <td>{outslip.status}</td>
            </tr>
          </tbody>
        </table>

        <table className="outslip-form-items">
          <colgroup>
            <col style={{ width: '14%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Item Number</th>
              <th>Item Description</th>
              <th>QTY.</th>
              <th>Unit</th>
              <th>Unit Cost</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => {
              const quantity = item.releasedQuantity > 0 ? item.releasedQuantity : item.poQuantity
              const description = item.description.trim()
              const brand = item.brand.trim()
              const label =
                brand && description && !description.toLowerCase().includes(brand.toLowerCase())
                  ? `${brand} ${description}`
                  : description || brand
              return (
                <tr key={item.id}>
                  <td className="osf-c">{`${index + 1}.0`}</td>
                  <td className="osf-l">{label}</td>
                  <td className="osf-c">{quantity}</td>
                  <td className="osf-c">{item.unit.toUpperCase()}</td>
                  <td className="osf-r">{formatPrintMoney(item.unitPrice)}</td>
                  <td className="osf-r">{formatPrintMoney(item.total)}</td>
                </tr>
              )
            })}
            {Array.from({ length: emptyRows }).map((_, index) => (
              <tr key={`empty-${index}`} className="outslip-form-empty">
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
            <tr>
              <td colSpan={6} className="outslip-form-nothing">
                ****NOTHING FOLLOWS****
              </td>
            </tr>
          </tbody>
        </table>

        <div className="outslip-form-grand">
          <span>GRAND TOTAL</span>
          <span className="outslip-form-grand-amount">
            {formatPrintMoney(outslip.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  )
}
