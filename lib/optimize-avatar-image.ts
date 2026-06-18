import sharp from 'sharp'

export const AVATAR_MAX_DIMENSION = 256
export const AVATAR_MAX_BYTES = 512 * 1024

async function encodeAvatarWebp(input: Buffer, quality: number): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer()
}

/** Resize and compress an avatar to WebP for storage in Tigris. */
export async function optimizeAvatarImage(input: Buffer): Promise<Buffer> {
  let quality = 80
  let buffer = await encodeAvatarWebp(input, quality)

  while (buffer.byteLength > AVATAR_MAX_BYTES && quality > 40) {
    quality -= 8
    buffer = await encodeAvatarWebp(input, quality)
  }

  if (buffer.byteLength > AVATAR_MAX_BYTES) {
    throw new Error('Image is too large. Try a smaller file.')
  }

  return buffer
}
