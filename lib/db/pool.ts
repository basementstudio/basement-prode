import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const isServerless = Boolean(process.env.VERCEL)

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 5_000 : 30_000,
  connectionTimeoutMillis: 10_000,
  allowExitOnIdle: isServerless,
})

export const db = drizzle(pool, { schema })
