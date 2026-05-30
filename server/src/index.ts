import * as dotenv from 'dotenv'
import path from 'path'

// ── Load env FIRST ─────────────────────────────────────────────────────────
// These calls must appear before *any* other module is required, because
// TypeScript hoists all `import` statements to the top of the compiled file
// as `require()` calls. Converting subsequent imports to inline require()
// calls below keeps them at their correct lexical position so they run after
// dotenv has already populated process.env.
dotenv.config({ path: path.resolve(__dirname, '../../.env') })  // repo root
dotenv.config({ path: path.resolve(__dirname, '../.env') })      // server/ fallback

// ── Framework & middleware (safe to require before env in current code) ────
import express from 'express'
import cors from 'cors'
import { clerkAuth } from './middleware/auth'
import { errorHandler } from './middleware/error'

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  })
)

app.use(express.json())

// Clerk JWT verification on every request.
// Individual routes use requireAuth() to enforce authentication.
app.use(clerkAuth)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes ────────────────────────────────────────────────────────────────────
// Use require() here (not `import`) so these modules are loaded *after*
// dotenv.config() has run above, not hoisted to the top of the file.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const timetableRouter = require('./routes/timetable').default
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nusmodsRouter   = require('./routes/nusmods').default
app.use('/api/timetable', timetableRouter)
app.use('/api/nusmods',   nusmodsRouter)

// M2: import friendsRouter from './routes/friends'
//     import groupsRouter  from './routes/groups'
//     app.use('/api/friends', friendsRouter)
//     app.use('/api/groups',  groupsRouter)
//
// M3: import freeTimeRouter from './routes/freeTime'
//     app.use('/api/free-time', freeTimeRouter)
//
// M4: import eventsRouter from './routes/events'
//     app.use('/api/events', eventsRouter)
//
// M5: import feedRouter from './routes/feed'
//     app.use('/api/feed', feedRouter)
//
// M6: import settingsRouter from './routes/settings'
//     app.use('/api/settings', settingsRouter)

app.use(errorHandler)

// Start the server for local development.
// Vercel uses api/index.ts and does not call listen().
if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT ?? 3001)
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

export default app
