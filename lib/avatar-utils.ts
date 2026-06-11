const MAX_DIMENSION = 256
const MAX_BYTES = 500_000
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function isAcceptedAvatarType(type: string): type is (typeof ACCEPTED_TYPES)[number] {
  return (ACCEPTED_TYPES as readonly string[]).includes(type)
}

export async function compressImageFile(file: File): Promise<string> {
  if (!isAcceptedAvatarType(file.type)) {
    throw new Error('Unsupported format. Use JPG, PNG, or WebP.')
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process the image.')

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  let quality = 0.88
  let dataUrl = canvas.toDataURL('image/webp', quality)

  while (dataUrl.length > MAX_BYTES * 1.37 && quality > 0.4) {
    quality -= 0.08
    dataUrl = canvas.toDataURL('image/webp', quality)
  }

  if (dataUrl.length > MAX_BYTES * 1.37) {
    throw new Error('Image is too large. Try a smaller file.')
  }

  return dataUrl
}
