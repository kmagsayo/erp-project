export const IMAGES_PER_PAGE = 4

export function pageCountForImages(imageCount: number): number {
  if (imageCount <= 0) return 1
  return Math.ceil(imageCount / IMAGES_PER_PAGE)
}

export function groupImagesIntoPages<T>(images: T[]): T[][] {
  const pageCount = pageCountForImages(images.length)
  const pages: T[][] = []

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const start = pageIndex * IMAGES_PER_PAGE
    const end = start + IMAGES_PER_PAGE
    pages.push(images.slice(start, end))
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
