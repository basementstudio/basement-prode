import { getTigrisBucketName, getTigrisEndpoint } from '@/lib/tigris-config'

const LEGACY_DATA_URL_PREFIX = 'data:image/'

/** Public HTTPS URL for an object stored in Tigris. */
export function buildAvatarPublicUrl(objectKey: string): string {
  const bucket = getTigrisBucketName()
  if (!bucket) {
    throw new Error('Set TIGRIS_STORAGE_BUCKET for avatar uploads.')
  }

  const endpoint = getTigrisEndpoint() ?? 'https://t3.storage.dev'
  const host = new URL(endpoint).host

  if (host.includes('t3.storage.dev')) {
    return `https://${bucket}.t3.tigrisfiles.io/${objectKey.replace(/^\//, '')}`
  }

  return `https://${bucket}.fly.storage.tigris.dev/${objectKey.replace(/^\//, '')}`
}

export function isLegacyAvatarDataUrl(value: string): boolean {
  return value.startsWith(LEGACY_DATA_URL_PREFIX)
}

export function isRemoteAvatarUrl(value: string): boolean {
  return value.startsWith('https://')
}

export function isValidStoredAvatarUrl(value: string): boolean {
  if (!value.trim()) return false
  if (isLegacyAvatarDataUrl(value)) {
    return value.length <= 700_000
  }
  if (isRemoteAvatarUrl(value)) {
    return value.length <= 2_048
  }
  return false
}
