/**
 * Migra avatares base64 en user_profiles → URLs en Tigris.
 *
 * Uso (producción):
 *   DATABASE_URL="postgresql://..." \
 *   TIGRIS_STORAGE_ACCESS_KEY_ID=... \
 *   TIGRIS_STORAGE_SECRET_ACCESS_KEY=... \
 *   TIGRIS_STORAGE_BUCKET=basemen-prode \
 *   TIGRIS_STORAGE_ENDPOINT=https://t3.storage.dev \
 *   bun run avatars:migrate-tigris
 *
 * Dry-run (no escribe nada):
 *   bun run avatars:migrate-tigris -- --dry-run
 */
import { putObject } from '@better-upload/server/helpers'
import { tigris } from '@better-upload/server/clients'
import { optimizeAvatarImage } from '@/lib/optimize-avatar-image'
import { Pool } from 'pg'

const dryRun = process.argv.includes('--dry-run')

function readEnv(name: string): string {
  const value = process.env[name]?.trim().replace(/^["']|["']$/g, '')
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

function parseDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl)
  if (!match) {
    throw new Error('Invalid data URL format')
  }

  return {
    contentType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], 'base64'),
  }
}

function buildAvatarPublicUrl(bucket: string, objectKey: string, endpoint?: string): string {
  const host = new URL(endpoint ?? 'https://t3.storage.dev').host
  const key = objectKey.replace(/^\//, '')

  if (host.includes('t3.storage.dev')) {
    return `https://${bucket}.t3.tigrisfiles.io/${key}`
  }

  return `https://${bucket}.fly.storage.tigris.dev/${key}`
}

async function main() {
  const databaseUrl = readEnv('DATABASE_URL')
  const bucket = readEnv('TIGRIS_STORAGE_BUCKET')
  const endpoint = readEnv('TIGRIS_STORAGE_ENDPOINT')

  const client = tigris({
    accessKeyId: readEnv('TIGRIS_STORAGE_ACCESS_KEY_ID'),
    secretAccessKey: readEnv('TIGRIS_STORAGE_SECRET_ACCESS_KEY'),
    endpoint,
  })

  const pool = new Pool({ connectionString: databaseUrl })

  const { rows } = await pool.query<{ userId: string; avatarUrl: string }>(`
    SELECT "userId", "avatarUrl"
    FROM user_profiles
    WHERE "avatarUrl" LIKE 'data:image/%'
    ORDER BY "userId"
  `)

  if (rows.length === 0) {
    console.log('No legacy base64 avatars found.')
    await pool.end()
    return
  }

  console.log(`Found ${rows.length} profile(s) with base64 avatars.${dryRun ? ' (dry-run)' : ''}`)

  let migrated = 0
  let failed = 0

  for (const row of rows) {
    const label = row.userId

    try {
      const { buffer } = parseDataUrl(row.avatarUrl)
      const optimized = await optimizeAvatarImage(buffer)
      const key = `avatars/${row.userId}.webp`
      const publicUrl = buildAvatarPublicUrl(bucket, key, endpoint)

      console.log(
        `→ ${label}: ${(buffer.byteLength / 1024).toFixed(1)} KB → ${(optimized.byteLength / 1024).toFixed(1)} KB WebP → ${publicUrl}`,
      )

      if (!dryRun) {
        await putObject(client, {
          bucket,
          key,
          body: optimized,
          contentType: 'image/webp',
          cacheControl: 'public, max-age=31536000, immutable',
        })

        await pool.query(
          `UPDATE user_profiles SET "avatarUrl" = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
          [publicUrl, row.userId],
        )
      }

      migrated++
    } catch (error) {
      failed++
      const message = error instanceof Error ? error.message : String(error)
      console.error(`✗ ${label}: ${message}`)
    }
  }

  await pool.end()

  console.log('')
  console.log(`Done. migrated=${migrated} failed=${failed}${dryRun ? ' (dry-run, no changes written)' : ''}`)
  if (failed > 0) process.exit(1)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
