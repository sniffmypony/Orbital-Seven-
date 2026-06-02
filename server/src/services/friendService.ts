import { and, eq, or } from 'drizzle-orm'
import { db } from '../db'
import { friendships, userBlocks } from '../db/schema'

export async function getFriendshipBetween(userA: string, userB: string) {
  const rows = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, userA), eq(friendships.addresseeId, userB)),
        and(eq(friendships.requesterId, userB), eq(friendships.addresseeId, userA))
      )
    )
    .limit(1)

  return rows[0] ?? null
}

export async function areFriends(userA: string, userB: string) {
  const friendship = await getFriendshipBetween(userA, userB)
  return !!friendship && friendship.status === 'accepted'
}

export async function getBlockedIds(blockerId: string): Promise<string[]> {
  const rows = await db
    .select({ blockedId: userBlocks.blockedId })
    .from(userBlocks)
    .where(eq(userBlocks.blockerId, blockerId))

  return rows.map((r) => r.blockedId)
}

export async function isBlockedBy(blockerId: string, blockedId: string): Promise<boolean> {
  const rows = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)))
    .limit(1)

  return rows.length > 0
}
