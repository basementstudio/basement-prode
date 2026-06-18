import 'server-only'

import { putObject } from '@better-upload/server/helpers'
import { buildAvatarPublicUrl } from '@/lib/avatar-url'
import { optimizeAvatarImage } from '@/lib/optimize-avatar-image'
import { getTigrisClient, requireTigrisBucketName } from '@/lib/tigris-client'

export async function uploadOptimizedAvatar(userId: string, input: Buffer): Promise<string> {
  const body = await optimizeAvatarImage(input)
  const key = `avatars/${userId}.webp`
  const bucket = requireTigrisBucketName()
  const client = getTigrisClient()

  await putObject(client, {
    bucket,
    key,
    body,
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000, immutable',
  })

  return buildAvatarPublicUrl(key)
}
