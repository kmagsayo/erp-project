import type { DeliveryReceipt, GatePass, Outslip } from '@/data/erpTypes'
import type { PurchaseOrder } from '@/data/purchaseOrderTypes'

export interface AppNotification {
  id: string
  title: string
  message: string
  link?: string
}

export function buildNotifications(
  purchaseOrders: PurchaseOrder[],
  outslips: Outslip[],
  deliveryReceipts: DeliveryReceipt[],
  gatePasses: GatePass[] = [],
): AppNotification[] {
  const items: AppNotification[] = []

  purchaseOrders.forEach((po) => {
    if (po.status === 'approved' && !po.outslipId) {
      items.push({
        id: `po-outslip-${po.id}`,
        title: 'Create Outslip',
        message: `Approved ${po.poNo} is ready for Create Outslip.`,
        link: '/purchase-orders',
      })
    }
  })

  outslips.forEach((outslip) => {
    if (outslip.status !== 'released' && outslip.status !== 'cancelled') {
      items.push({
        id: `outslip-release-${outslip.id}`,
        title: 'Release Outslip',
        message: `Release ${outslip.id} to post inventory records.`,
        link: '/outslips',
      })
    }
  })

  outslips.forEach((outslip) => {
    if (outslip.status !== 'released') return

    const gatePass = gatePasses.find(
      (row) => row.outslipId === outslip.id && row.status === 'approved',
    )
    if (!gatePass) {
      items.push({
        id: `gp-create-${outslip.id}`,
        title: 'Create Gate Pass',
        message: `Create a Gate Pass so items on ${outslip.id} can leave the premises.`,
        link: `/gate-passes?from=${encodeURIComponent(outslip.id)}`,
      })
      return
    }

    const hasReceipt = deliveryReceipts.some((receipt) => receipt.outslipId === outslip.id)
    if (!hasReceipt) {
      items.push({
        id: `dr-create-${outslip.id}`,
        title: 'Create Delivery Receipt',
        message: `Create Delivery Receipt after Gate Pass ${gatePass.id}.`,
        link: `/delivery-receipts?from=${encodeURIComponent(outslip.id)}`,
      })
    }
  })

  return items
}
