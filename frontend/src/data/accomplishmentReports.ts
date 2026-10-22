export interface CompanyInfo {
  name: string
  addressLines: string[]
  phone: string
  email: string
  vatTin: string
}

export interface AccomplishmentReportImage {
  id: string
  src: string
  alt: string
}

export interface AccomplishmentReportData {
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
  deliveryReceiptId?: string
}

export const companyInfo: CompanyInfo = {
  name: 'RESPONSIVCODE TECHNOLOGY SOLUTIONS',
  addressLines: [
    'RM301-E3 MEDALLE BLDG., FUENTE OSMEÑA, CAPITOL SITE, CEBU CITY 6000',
  ],
  phone: '09175734911',
  email: 'info@responsivcode.com',
  vatTin: '252-890-526-000',
}

export const accomplishmentReports: AccomplishmentReportData[] = []
