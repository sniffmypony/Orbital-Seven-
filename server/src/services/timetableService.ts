import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../db'
import { timetableBlocks, timetableBlockVisibility } from '../db/schema'
import { isBlockedBy } from './friendService'

type BlockRow = typeof timetableBlocks.$inferSelect

export async function getVisibleBlocks(ownerId: string, viewerId: string): Promise<BlockRow[]> {
  const all = await db
    .select()
    .from(timetableBlocks)
    .where(eq(timetableBlocks.userId, ownerId))

  if (ownerId === viewerId) return all

  const overrideCandidates = all
    .filter((b) => b.visibility === 'only' || b.visibility === 'except')
    .map((b) => b.id)

  const overrideBlockIds = new Set<string>()
  if (overrideCandidates.length > 0) {
    const rows = await db
      .select({ blockId: timetableBlockVisibility.blockId })
      .from(timetableBlockVisibility)
      .where(
        and(
          inArray(timetableBlockVisibility.blockId, overrideCandidates),
          eq(timetableBlockVisibility.userId, viewerId)
        )
      )
    for (const r of rows) overrideBlockIds.add(r.blockId)
  }

  return all.filter((b) => {
    switch (b.visibility) {
      case 'public':
      case 'friends':
        return true
      case 'only':
        return overrideBlockIds.has(b.id)
      case 'except':
        return !overrideBlockIds.has(b.id)
      default:
        return false
    }
  })
}

export async function getProfileBlocks(ownerId: string): Promise<BlockRow[]> {
  const all = await db
    .select()
    .from(timetableBlocks)
    .where(eq(timetableBlocks.userId, ownerId))

  return all.filter((b) => b.profileVisible && b.visibility === 'friends')
}

export async function getViewableBlocks(ownerId: string, viewerId: string, isFriend: boolean): Promise<BlockRow[]> {
  if (ownerId === viewerId) return getVisibleBlocks(ownerId, viewerId)
  if (await isBlockedBy(ownerId, viewerId)) return []
  if (isFriend) return getVisibleBlocks(ownerId, viewerId)
  return getProfileBlocks(ownerId)
}
