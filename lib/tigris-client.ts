import 'server-only'

import { tigris } from '@better-upload/server/clients'
import {
  getTigrisAccessKeyId,
  getTigrisBucketName,
  getTigrisEndpoint,
  getTigrisSecretAccessKey,
} from '@/lib/tigris-config'

type TigrisClient = ReturnType<typeof tigris>

let cachedClient: TigrisClient | null = null

export function getTigrisClient(): TigrisClient {
  if (cachedClient) return cachedClient

  const accessKeyId = getTigrisAccessKeyId()
  const secretAccessKey = getTigrisSecretAccessKey()

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing Tigris credentials. Set TIGRIS_STORAGE_ACCESS_KEY_ID and TIGRIS_STORAGE_SECRET_ACCESS_KEY.',
    )
  }

  const endpoint = getTigrisEndpoint()
  if (!endpoint) {
    throw new Error('Set TIGRIS_STORAGE_ENDPOINT for avatar uploads.')
  }

  cachedClient = tigris({
    accessKeyId,
    secretAccessKey,
    endpoint,
  })

  return cachedClient
}

export function requireTigrisBucketName(): string {
  const bucketName = getTigrisBucketName()
  if (!bucketName) {
    throw new Error('Set TIGRIS_STORAGE_BUCKET for avatar uploads.')
  }
  return bucketName
}
