import { eq } from 'drizzle-orm'
import { createClerkClient } from '@clerk/backend'
import { db } from '../db'
import { users } from '../db/schema'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function getOrCreateDbUser(clerkId: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1)

  if (existing.length > 0) return existing[0]

  const clerkUser = await clerk.users.getUser(clerkId)

  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? ''

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    'Anonymous'

  const [newUser] = await db
    .insert(users)
    .values({ clerkId, email, displayName, avatarUrl: clerkUser.imageUrl })
    .returning()

  return newUser
}
