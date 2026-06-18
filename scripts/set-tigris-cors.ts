/**
 * Aplica CORS al bucket de Tigris (la consola a veces no lo persiste).
 * Run: bun run tigris:set-cors
 */
import { setBucketCors } from '@tigrisdata/storage'

function readEnv(name: string): string | undefined {
  const value = process.env[name]
  if (!value) return undefined
  const trimmed = value.trim().replace(/^["']|["']$/g, '')
  return trimmed || undefined
}

function requireEnv(name: string): string {
  const value = readEnv(name)
  if (!value) {
    throw new Error(`Set ${name} in .env`)
  }
  return value
}

const bucket = requireEnv('TIGRIS_STORAGE_BUCKET')

const origins = [
  'http://localhost:3000',
  'http://localhost:3001',
  readEnv('BETTER_AUTH_URL'),
].filter((value): value is string => Boolean(value))

const uniqueOrigins = Array.from(new Set(origins))

async function main() {
  const result = await setBucketCors(bucket, {
    override: true,
    rules: [
      {
        allowedOrigins: uniqueOrigins,
        allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        allowedHeaders: '*',
        exposeHeaders: ['ETag', 'Content-Length'],
        maxAge: 86_400,
      },
    ],
  })

  if (result.error) {
    console.error('Failed to set CORS:', result.error.message)
    process.exit(1)
  }

  console.log(`CORS applied to bucket "${bucket}" for origins:`)
  for (const origin of uniqueOrigins) {
    console.log(`  - ${origin}`)
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
