import 'server-only'

function readEnv(name: string): string | undefined {
  const value = process.env[name]
  if (!value) return undefined
  const trimmed = value.trim().replace(/^["']|["']$/g, '')
  return trimmed || undefined
}

export function getTigrisAccessKeyId(): string | undefined {
  return readEnv('TIGRIS_STORAGE_ACCESS_KEY_ID')
}

export function getTigrisSecretAccessKey(): string | undefined {
  return readEnv('TIGRIS_STORAGE_SECRET_ACCESS_KEY')
}

export function getTigrisEndpoint(): string | undefined {
  return readEnv('TIGRIS_STORAGE_ENDPOINT')
}

export function getTigrisBucketName(): string | undefined {
  return readEnv('TIGRIS_STORAGE_BUCKET')
}
