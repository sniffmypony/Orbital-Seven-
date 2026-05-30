import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'
import path from 'path'

// Load from repo root .env (where DATABASE_URL_DIRECT lives)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const url = process.env.DATABASE_URL_DIRECT
if (!url) {
  throw new Error('DATABASE_URL_DIRECT is required for drizzle-kit. Set it in your root .env file.')
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Always use the direct connection (port 5432) for migrations.
    // PgBouncer (port 6543) does not support DDL statements.
    url,
  },
})
