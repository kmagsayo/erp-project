export const IMAGES_PER_PAGE = 4

export function calculateTotalPages(imageCount: number): number {
  if (imageCount <= 0) return 1
  return Math.ceil(imageCount / IMAGES_PER_PAGE)
}

export function getImagesForPage<T>(images: T[], pageNumber: number): T[] {
  const start = (pageNumber - 1) * IMAGES_PER_PAGE
  return images.slice(start, start + IMAGES_PER_PAGE)
}

export function groupImagesIntoPages<T>(images: T[]): T[][] {
  const pageCount = calculateTotalPages(images.length)
  const pages: T[][] = []

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    pages.push(getImagesForPage(images, pageIndex + 1))
  }

  return pages
}

export function padImageSlots<T>(
  images: T[],
  size: number = IMAGES_PER_PAGE,
): Array<T | null> {
  const slots: Array<T | null> = images.slice(0, size)
  while (slots.length < size) {
    slots.push(null)
  }
  return slots
}

/** @deprecated Use calculateTotalPages */
export const pageCountForImages = calculateTotalPages
