import logo from '@/assets/logo.png'
import { TransactionBarcode } from '@/components/ui/transaction-barcode'
import { companyInfo } from '@/data/accomplishmentReports'
import type { GatePass } from '@/data/erpTypes'
import { catalogBrandAndModel, useCatalogItems } from '@/hooks/useCatalogItems'
import { formatDisplayDate } from '@/lib/gatePasses'

function formatTime(value: string) {
  if (!value) return '—'
  return value
}

export function GatePassDocument({ gatePass }: { gatePass: GatePass }) {
  const catalogItems = useCatalogItems()
  return (
    <div className="outslip-document">
      <div className="outslip-head">
        <div className="outslip-company-wrap">
          <img src={logo} alt={`${companyInfo.name} logo`} className="outslip-logo" />
          <div>
            <div className="outslip-company-name">{companyInfo.name}</div>
            {companyInfo.addressLines.map((line) => (
              <div key={line} className="outslip-company-meta">
                {line}
              </div>
            ))}
            <div className="outslip-company-meta">Tel: {companyInfo.phone}</div>
            <div className="outslip-company-meta">Email: {companyInfo.email}</div>
          </div>
        </div>
      </div>

      <h1 className="outslip-title">GATE PASS</h1>

      <div className="outslip-reference-head">
        <div className="outslip-reference-left">
          <div className="outslip-reference-label">Released to:</div>
          <div className="outslip-reference-value outslip-reference-value--strong">
            {gatePass.customer || '—'}
          </div>
          <div className="outslip-reference-value">
            Destination: {gatePass.destination || '—'}
          </div>
        </div>
        <div className="outslip-reference-right">
          <div className="outslip-meta-row">
            <span>Date:</span>
            <span>{formatDisplayDate(gatePass.date)}</span>
          </div>
          <div className="outslip-meta-row">
            <span>Time Out:</span>
            <span>{formatTime(gatePass.timeOut)}</span>
          </div>
          <div className="outslip-meta-row">
            <span>Gate Pass No.:</span>
            <span>{gatePass.id}</span>
          </div>
          <TransactionBarcode value={gatePass.id} />
          <div className="outslip-meta-row">
            <span>Outslip No.:</span>
            <span>{gatePass.outslipId}</span>
          </div>
          <div className="outslip-meta-row">
            <span>PO No.:</span>
            <span>{gatePass.poId || '—'}</span>
          </div>
        </div>
      </div>

      <div className="outslip-reference-band">
        <span>Purpose:</span>
        <span>{gatePass.purpose || '—'}</span>
      </div>

      <div className="outslip-reference-band">
        <span>Vehicle:</span>
        <span>
          {gatePass.vehicle || '—'} | Plate No.: {gatePass.plateNo || '—'} | Driver:{' '}
          {gatePass.driverName || '—'}
        </span>
      </div>

      <table className="outslip-items-table">
        <thead>
          <tr>
            <th colSpan={6} className="outslip-section-header">
              Items to Leave Premises
            </th>
          </tr>
          <tr>
            <th>No.</th>
            <th>Item Description</th>
            <th>Brand</th>
            <th>Model</th>
            <th>Qty</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          {gatePass.items.map((item, index) => {
            const catalog = catalogBrandAndModel(catalogItems, item.itemCode)
            const brand = item.brand.trim() || catalog.brand || '—'
            const model = catalog.model || '—'
            return (
            <tr key={item.id}>
              <td>{index + 1}</td>
              <td>
                <div>{item.description}</div>
                <div className="outslip-item-code">{item.itemCode}</div>
              </td>
              <td>{brand}</td>
              <td>{model}</td>
              <td>{item.quantity}</td>
              <td>{item.unit}</td>
            </tr>
            )
          })}
        </tbody>
      </table>

      <div className="outslip-remarks">
        <div className="outslip-section-title">Remarks</div>
        <p>{gatePass.remarks || '—'}</p>
      </div>

      <div className="outslip-signatures">
        <div className="outslip-signature">
          <div className="outslip-signature-label">Prepared By:</div>
          <div className="outslip-signature-line" />
          <div className="outslip-signature-name">{gatePass.preparedBy || 'Name / Position'}</div>
        </div>
        <div className="outslip-signature">
          <div className="outslip-signature-label">Authorized By:</div>
          <div className="outslip-signature-line" />
          <div className="outslip-signature-name">{gatePass.authorizedBy || 'Name / Position'}</div>
        </div>
        <div className="outslip-signature">
          <div className="outslip-signature-label">Guard on Duty:</div>
          <div className="outslip-signature-line" />
          <div className="outslip-signature-name">{gatePass.guardOnDuty || 'Name / Position'}</div>
        </div>
        <div className="outslip-signature">
          <div className="outslip-signature-label">Driver:</div>
          <div className="outslip-signature-line" />
          <div className="outslip-signature-name">
            {gatePass.driverName || 'Signature Over Printed Name'}
          </div>
        </div>
      </div>
    </div>
  )
}
