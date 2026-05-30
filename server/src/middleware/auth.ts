import { clerkMiddleware, getAuth } from '@clerk/express'
import { Request, Response, NextFunction } from 'express'

// Attaches Clerk auth state to every request.
// Does NOT reject unauthenticated requests on its own — use requireAuth() for that.
export const clerkAuth = clerkMiddleware()

// Route-level guard. Returns 401 if the request has no valid Clerk session.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
  next()
}

// Convenience helper: pull the Clerk userId from a verified request.
export function getClerkUserId(req: Request): string {
  const { userId } = getAuth(req)
  if (!userId) throw new Error('getClerkUserId called on unauthenticated request')
  return userId
}
