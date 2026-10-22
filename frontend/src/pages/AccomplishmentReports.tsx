import { AccomplishmentReport } from '@/components/documents/AccomplishmentReport'
import { PicturesModal } from '@/components/documents/accomplishment/PicturesModal'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLink,
  TableRow,
} from '@/components/ui/table'
import type { AccomplishmentReportData } from '@/data/accomplishmentReports'
import type { DeliveryReceipt } from '@/data/erpTypes'
import { useErp } from '@/data/erpStore'
import {
  buildReportViewModel,
  toReportImage,
  type ReportFormData,
} from '@/lib/accomplishmentReport'
import {
  clearImages,
  handleImageUpload,
  removeImage,
  type ReportImage,
} from '@/lib/accomplishmentReportImages'
import {
  loadAccomplishmentReports,
  syncAccomplishmentReportsFromDeliveryReceipts,
  updateAccomplishmentReport,
} from '@/lib/accomplishmentReports'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

function formFromReport(
  report: AccomplishmentReportData | undefined,
  linkedReceipt?: DeliveryReceipt,
): ReportFormData {
  if (!report) {
    return {
      projectName: '',
      location: '',
      installationReportNo: '',
      date: '',
      remarks: '',
      preparedBy: '',
      preparedByPosition: '',
      confirmedBy: 'Signature of Printed Name / Position',
    }
  }

  return {
    projectName: linkedReceipt?.project || report.projectName,
    location: linkedReceipt?.destination || report.location,
    installationReportNo: report.installationReportNo,
    date: report.date,
    remarks: '',
    preparedBy: report.preparedBy,
    preparedByPosition: report.preparedByPosition,
    confirmedBy: report.confirmedByLabel,
  }
}

function imagesFromReport(report: AccomplishmentReportData | undefined): ReportImage[] {
  if (!report) return []
  return report.images.map(toReportImage)
}

export function AccomplishmentReportsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { deliveryReceipts } = useErp()
  const [reports, setReports] = useState<AccomplishmentReportData[]>(() =>
    loadAccomplishmentReports(),
  )
  const [selectedId, setSelectedId] = useState(reports[0]?.id ?? '')
  const [images, setImages] = useState<ReportImage[]>(() =>
    imagesFromReport(reports.find((row) => row.id === reports[0]?.id)),
  )
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [picturesOpen, setPicturesOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)

  const selectedReport = useMemo(
    () => reports.find((row) => row.id === selectedId),
    [reports, selectedId],
  )
  const linkedReceipt = deliveryReceipts.find(
    (row) => row.id === (params.get('dr') || selectedReport?.deliveryReceiptId),
  )

  useEffect(() => {
    const next = syncAccomplishmentReportsFromDeliveryReceipts(deliveryReceipts)
    setReports((current) => {
      if (
        current.length === next.length &&
        current.every((row, index) => row.id === next[index]?.id)
      ) {
        return current
      }
      return next
    })

    const receiptId = params.get('dr')
    if (!receiptId) {
      setSelectedId((current) => current || next[0]?.id || '')
      return
    }

    const fromQuery = next.find((row) => row.deliveryReceiptId === receiptId) ?? next[0]
    if (!fromQuery) return
    setSelectedId(fromQuery.id)
    setImages(imagesFromReport(fromQuery))
    setPicturesOpen(true)
    navigate('/accomplishments', { replace: true })
  }, [deliveryReceipts, navigate, params])

  const form = useMemo(
    () => formFromReport(selectedReport, linkedReceipt),
    [selectedReport, linkedReceipt],
  )

  const reportViewModel = useMemo(
    () => buildReportViewModel(selectedId, form, images),
    [selectedId, form, images],
  )

  function handleSelectReport(id: string) {
    if (id !== selectedId) {
      clearImages(images)
      setUploadError(null)
      setSelectedId(id)
      setImages(imagesFromReport(reports.find((row) => row.id === id)))
    }
    setPicturesOpen(true)
  }

  async function onUpload(files: File[]) {
    setIsOptimizing(true)
    setUploadError(null)
    try {
      const next = await handleImageUpload(files, images)
      setImages(next)
      if (selectedId) {
        setReports(
          updateAccomplishmentReport(selectedId, {
            images: next.map((image) => ({
              id: image.id,
              src: image.src,
              alt: image.alt,
            })),
          }),
        )
      }
    } catch {
      setUploadError(
        'One or more pictures could not be optimized. Please try a JPG or PNG photo.',
      )
    } finally {
      setIsOptimizing(false)
    }
  }

  function onRemoveImage(id: string) {
    setImages((current) => {
      const next = removeImage(current, id)
      if (selectedId) {
        setReports(
          updateAccomplishmentReport(selectedId, {
            images: next.map((image) => ({
              id: image.id,
              src: image.src,
              alt: image.alt,
            })),
          }),
        )
      }
      return next
    })
  }

  function handlePrint() {
    setPrintOpen(true)
    window.setTimeout(() => window.print(), 50)
  }

  useEffect(() => {
    function handleAfterPrint() {
      setPrintOpen(false)
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  return (
    <div>
      <div className="no-print">
        <PageHeader title="Accomplishment Reports" />

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Report No.</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Pictures</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-text-secondary">
                  No accomplishment reports yet. Create one from a Delivery Receipt.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => {
                const isSelected = report.id === selectedId
                const count = isSelected ? images.length : report.images.length

                return (
                  <TableRow
                    key={report.id}
                    className={isSelected ? 'bg-maroon-light hover:bg-maroon-light' : undefined}
                  >
                    <TableCell>
                      <TableLink onClick={() => handleSelectReport(report.id)}>
                        {report.id}
                      </TableLink>
                    </TableCell>
                    <TableCell>{report.projectName}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{count}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {picturesOpen ? (
          <PicturesModal
            reportId={selectedId}
            images={images}
            isOptimizing={isOptimizing}
            uploadError={uploadError}
            onClose={() => setPicturesOpen(false)}
            onUpload={onUpload}
            onRemoveImage={onRemoveImage}
            onPrint={handlePrint}
          />
        ) : null}
      </div>

      <div className="report-print-root">
        {printOpen && selectedId ? <AccomplishmentReport report={reportViewModel} /> : null}
      </div>
    </div>
  )
}
