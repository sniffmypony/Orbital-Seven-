// Vercel serverless entry point.
// Vercel looks for a default export from files inside api/.
// We re-export the Express app so it handles all incoming requests.
import app from '../src/index'

export default app
