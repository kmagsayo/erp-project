import { optimizeImageFile } from '@/lib/optimizeImage'

export interface ReportImage {
  id: string
  src: string
  alt: string
  name: string
}

export function revokeImagePreviews(images: ReportImage[]) {
  images.forEach((image) => {
    if (image.src.startsWith('blob:')) {
      URL.revokeObjectURL(image.src)
    }
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image.'))
    reader.readAsDataURL(blob)
  })
}

export async function createImagePreview(file: File): Promise<ReportImage> {
  const optimizedBlob = await optimizeImageFile(file)
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    src: await blobToDataUrl(optimizedBlob),
    alt: file.name.replace(/\.[^.]+$/, ''),
    name: file.name,
  }
}

export async function handleImageUpload(
  files: File[],
  currentImages: ReportImage[],
): Promise<ReportImage[]> {
  const added: ReportImage[] = []
  try {
    for (const file of files) {
      added.push(await createImagePreview(file))
    }
    return [...currentImages, ...added]
  } catch {
    revokeImagePreviews(added)
    throw new Error('One or more pictures could not be optimized.')
  }
}

export function removeImage(images: ReportImage[], id: string): ReportImage[] {
  const target = images.find((image) => image.id === id)
  if (target) revokeImagePreviews([target])
  return images.filter((image) => image.id !== id)
}

export function clearImages(images: ReportImage[]) {
  revokeImagePreviews(images)
}

export { optimizeImageFile as compressImage }
