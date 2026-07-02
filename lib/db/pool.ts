import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import { neon, neonConfig, Pool as NeonPool } from '@neondatabase/serverless'
import { Pool as PgPool } from 'pg'
import ws from 'ws'
import * as schema from './schema'

function isNeonDatabase(url: string | undefined): boolean {
  if (!url) return false
  try {
    const hostname = new URL(url.replace(/^postgres:/, 'postgresql:')).hostname
    return hostname.includes('neon.tech')
  } catch {
    return false
  }
}

const connectionString = process.env.DATABASE_URL
const useNeonDriver = isNeonDatabase(connectionString)
const isServerless = Boolean(process.env.VERCEL)

function createPgPool(): PgPool {
  return new PgPool({
    connectionString,
    max: isServerless ? 1 : 10,
    idleTimeoutMillis: isServerless ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: isServerless,
  })
}

function createNeonPool(): NeonPool {
  neonConfig.webSocketConstructor = ws
  return new NeonPool({ connectionString: connectionString! })
}

const pgPool = useNeonDriver ? null : createPgPool()

/** Pool para Better Auth y scripts CLI (pg local o WebSocket Neon). */
export const pool: PgPool | NeonPool = useNeonDriver ? createNeonPool() : pgPool!

/** Cliente Drizzle: HTTP sin conexión persistente en Neon; pg en local. */
export const db = useNeonDriver
  ? drizzleNeonHttp({ client: neon(connectionString!), schema })
  : drizzlePg(pgPool!, { schema })
