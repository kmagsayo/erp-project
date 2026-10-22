import type { AccomplishmentReportImage } from '@/data/accomplishmentReports'
import type { ReportImage } from '@/lib/accomplishmentReportImages'

export interface ReportFormData {
  projectName: string
  location: string
  installationReportNo: string
  date: string
  remarks: string
  preparedBy: string
  preparedByPosition: string
  confirmedBy: string
}

export interface AccomplishmentReportViewModel {
  id: string
  projectName: string
  location: string
  installationReportNo: string
  date: string
  remarks: string
  preparedBy: string
  preparedByPosition: string
  confirmedByLabel: string
  images: AccomplishmentReportImage[]
}

export function toReportImage(image: AccomplishmentReportImage): ReportImage {
  return {
    id: image.id,
    src: image.src,
    alt: image.alt,
    name: image.alt,
  }
}

export function buildReportViewModel(
  id: string,
  form: ReportFormData,
  images: ReportImage[],
): AccomplishmentReportViewModel {
  return {
    id,
    projectName: form.projectName,
    location: form.location,
    installationReportNo: form.installationReportNo,
    date: form.date,
    remarks: '',
    preparedBy:
      form.preparedBy && form.preparedBy !== 'WEB ADMINISTRATOR'
        ? form.preparedBy
        : 'LARKE. G GELBOLINGO',
    preparedByPosition:
      form.preparedByPosition &&
      form.preparedByPosition !== 'Project Manager' &&
      form.preparedByPosition !== 'Name of Personnel'
        ? form.preparedByPosition
        : 'PERSONNEL',
    confirmedByLabel: 'SIGNATURE OF PRINTED NAME/POSITION',
    images: images.map((image) => ({
      id: image.id,
      src: image.src,
      alt: image.name?.replace(/\.[^.]+$/, '') || image.alt,
    })),
  }
}

export function handlePrint() {
  window.print()
}
