import { AccomplishmentReport } from '@/components/documents/AccomplishmentReport'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableLink,
  TableRow,
} from '@/components/ui/table'
import {
  accomplishmentReports,
  type AccomplishmentReportData,
  type AccomplishmentReportImage,
} from '@/data/accomplishmentReports'
import { optimizeImageFile } from '@/lib/optimizeImage'
import { IMAGES_PER_PAGE, pageCountForImages } from '@/lib/reportPages'
import { Printer, Upload } from 'lucide-react'
import { useMemo, useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useErp } from '@/data/erpStore'

const statusLabel = {
  approved: 'Approved',
  pending: 'Pending',
  draft: 'Draft',
} as const

export function AccomplishmentReportsPage() {
  const [params] = useSearchParams()
  const { deliveryReceipts } = useErp()
  const linkedReceipt = deliveryReceipts.find((row) => row.id === params.get('dr'))
  const [selectedId, setSelectedId] = useState(accomplishmentReports[0].id)
  const [uploadedImages, setUploadedImages] = useState<AccomplishmentReportImage[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const selectedReport = accomplishmentReports.find((report) => report.id === selectedId)

  const previewReport: AccomplishmentReportData | undefined = useMemo(() => {
    if (!selectedReport) return undefined
    return {
      ...selectedReport,
      projectName: linkedReceipt?.project ?? selectedReport.projectName,
      location: linkedReceipt?.destination ?? selectedReport.location,
      remarks: linkedReceipt
        ? `From ${linkedReceipt.id} / ${linkedReceipt.outslipId} / ${linkedReceipt.poId}. Customer: ${linkedReceipt.customer}.`
        : selectedReport.remarks,
      images: [...selectedReport.images, ...uploadedImages],
    }
  }, [selectedReport, uploadedImages, linkedReceipt])

  const imageCount = previewReport?.images.length ?? 0
  const pageCount = pageCountForImages(imageCount)

  function revokeUploaded(images: AccomplishmentReportImage[]) {
    images.forEach((image) => {
      if (image.src.startsWith('blob:')) {
        URL.revokeObjectURL(image.src)
      }
    })
  }

  function handleSelectReport(id: string) {
    setUploadedImages((current) => {
      revokeUploaded(current)
      return []
    })
    setUploadError(null)
    setSelectedId(id)
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    setIsOptimizing(true)
    setUploadError(null)

    try {
      const optimizedImages: AccomplishmentReportImage[] = []

      try {
        for (const [index, file] of files.entries()) {
          const optimizedBlob = await optimizeImageFile(file)
          optimizedImages.push({
            id: `upload-${Date.now()}-${index}`,
            src: URL.createObjectURL(optimizedBlob),
            alt: file.name.replace(/\.[^.]+$/, ''),
          })
        }

        setUploadedImages((current) => [...current, ...optimizedImages])
      } catch {
        revokeUploaded(optimizedImages)
        throw new Error('optimize-failed')
      }
    } catch {
      setUploadError(
        'One or more pictures could not be optimized. Please try a JPG or PNG photo.',
      )
    } finally {
      setIsOptimizing(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Accomplishment Reports"
          description="Photos are resized before use, then placed in a 2×2 grid (maximum 4 per page)."
          action={
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </Button>
          }
        />

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Report No.</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Pictures</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accomplishmentReports.map((report) => {
              const isSelected = report.id === selectedId
              const count =
                report.id === selectedId
                  ? imageCount
                  : report.images.length

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
                  <TableCell>
                    <Badge variant={report.status}>{statusLabel[report.status]}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {previewReport && (
          <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              Previewing {previewReport.id}: {imageCount} picture
              {imageCount === 1 ? '' : 's'} across {pageCount} page
              {pageCount === 1 ? '' : 's'} (maximum {IMAGES_PER_PAGE} pictures per
              page).
              {isOptimizing ? ' Optimizing selected photos…' : ''}
            </p>
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-maroon bg-surface px-4 py-2 text-sm font-medium text-maroon hover:bg-maroon-light ${
                isOptimizing ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <Upload className="h-4 w-4" />
              {isOptimizing ? 'Optimizing…' : 'Upload pictures'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={isOptimizing}
                onChange={handleUpload}
              />
            </label>
          </div>
        )}
        {uploadError && (
          <p className="mb-4 text-sm text-error-text">{uploadError}</p>
        )}
      </div>

      {previewReport && (
        <div className="report-preview-frame">
          <AccomplishmentReport report={previewReport} />
        </div>
      )}
    </div>
  )
}
