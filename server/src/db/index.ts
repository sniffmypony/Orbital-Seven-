// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: dotenv MUST be loaded before reading process.env.DATABASE_URL.
//
// TypeScript compiles every top-level `import` statement to a `require()` call
// that is hoisted to the very top of the compiled bundle — even imports that
// appear *after* code in the source file. That means this module can be
// required before server/src/index.ts has had a chance to call dotenv.config().
// Loading dotenv here (as the first code that runs after all requires) is the
// only reliable way to guarantee the env is present when we read DATABASE_URL.
// ─────────────────────────────────────────────────────────────────────────────
import * as dotenv from 'dotenv'
import * as nodePath from 'path'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// __dirname = server/src/db  →  ../../.. = repo root
dotenv.config({ path: nodePath.resolve(__dirname, '../../../.env') })
dotenv.config({ path: nodePath.resolve(__dirname, '../../.env') }) // server/.env fallback

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set.\n' +
    'Make sure a .env file exists at the repo root with DATABASE_URL set to your ' +
    'Supabase PgBouncer connection string (port 6543).'
  )
}

// ── Debug: print target at startup so connection problems are obvious ─────────
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

// Pass connectionString directly so pg's own URL parser handles percent-
// encoded characters (e.g. %21 → !). We always enable SSL because Supabase
// requires it regardless of which pooler port is used.
const pool = new Pool({
  connectionString,
  // Keep max at 1 per serverless function instance.
  // Supabase PgBouncer (port 6543) multiplexes these across a shared pool.
  max: 1,
  ssl: { rejectUnauthorized: false },
})

// Verify the connection is reachable at startup so issues appear in the
// server log immediately rather than only on the first real request.
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
