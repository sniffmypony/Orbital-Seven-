

import * as dotenv from 'dotenv'
import * as nodePath from 'path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

dotenv.config({ path: nodePath.resolve(__dirname, '../../../.env') })
dotenv.config({ path: nodePath.resolve(__dirname, '../../.env') })

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set.\n' +
    'Make sure a .env file exists at the repo root with DATABASE_URL set to your ' +
    'Supabase PgBouncer connection string (port 6543).'
  )
}

try {
  const u = new URL(connectionString)
  const masked =
    u.password.length > 2
      ? '*'.repeat(u.password.length - 2) + u.password.slice(-2)
      : '**'
  console.log(
    `[db] connecting → ${u.hostname}:${u.port}` +
    `  user=${decodeURIComponent(u.username)}` +
    `  pw=${masked}` +
    `  db=${u.pathname.slice(1)}`
  )
} catch {
  console.log('[db] DATABASE_URL is set but could not be parsed as a URL')
}

const pool = new Pool({
  connectionString,

  max: 1,
  ssl: { rejectUnauthorized: false },
})

pool
  .query('SELECT 1')
  .then(() => console.log('[db] ✓ Supabase connection OK'))
  .catch((err: Error) =>
    console.error(
      '[db] ✗ Supabase connection FAILED:', err.message, '\n' +
      '  → Check: 1) Supabase project is Active (not Paused) at supabase.com\n' +
      '  → Check: 2) DATABASE_URL password is correct\n' +
      '  → Check: 3) Network/firewall is not blocking port 6543'
    )
  )

export const db = drizzle(pool, { schema })
export type Db = typeof db
