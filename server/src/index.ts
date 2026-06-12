import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

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

app.use(express.json({ limit: '25mb' }))

app.use(clerkAuth)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const timetableRouter = require('./routes/timetable').default
const nusmodsRouter   = require('./routes/nusmods').default
const friendsRouter   = require('./routes/friends').default
const profileRouter   = require('./routes/profile').default
const freetimeRouter  = require('./routes/freetime').default
const groupsRouter    = require('./routes/groups').default
app.use('/api/timetable', timetableRouter)
app.use('/api/nusmods',   nusmodsRouter)
app.use('/api/friends',   friendsRouter)
app.use('/api/profile',   profileRouter)
app.use('/api/freetime',  freetimeRouter)
app.use('/api/groups',    groupsRouter)

app.use(errorHandler)

if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT ?? 3001)
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}

export default app
