import { clerkMiddleware, getAuth } from '@clerk/express'
import { Request, Response, NextFunction } from 'express'

export const clerkAuth = clerkMiddleware()

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }
  next()
}

export function getClerkUserId(req: Request): string {
  const { userId } = getAuth(req)
  if (!userId) throw new Error('getClerkUserId called on unauthenticated request')
  return userId
}
