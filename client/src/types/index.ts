

export type Day =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'

export type TimetableSource = 'nusmods' | 'custom'

export type BlockVisibility = 'private' | 'friends' | 'only' | 'except'

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'

export type GroupType = 'study' | 'project' | 'social'

export type Visibility = 'public' | 'friends' | 'private'

export interface User {
  id: string
  clerkId: string
  email: string
  displayName: string
  avatarUrl: string | null
  createdAt: string
}

export interface TimetableBlock {
  id: string
  userId: string
  moduleCode: string | null
  lessonType: string | null
  classNo: string | null
  title: string
  day: Day
  startTime: string
  endTime: string
  weeks: number[]
  venue: string | null
  note: string | null
  source: TimetableSource
  color: string
  visibility: BlockVisibility
  visibleTo: string[]
  createdAt: string
}

export interface Friendship {
  id: string
  requesterId: string
  addresseeId: string
  status: FriendshipStatus
  createdAt: string
}

export type FriendRelationship = 'none' | 'friends' | 'incoming' | 'outgoing' | 'blocked'

export interface FriendUser {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
}

export interface Friend {
  friendshipId: string
  status: FriendshipStatus
  user: FriendUser
}

export interface FriendRequest {
  friendshipId: string
  createdAt: string
  user: FriendUser
}

export interface BlockedUser {
  blockId: string
  createdAt: string
  user: FriendUser
}

export interface UserSearchResult extends FriendUser {
  relationship: FriendRelationship
}

export interface FriendTimetable {
  user: FriendUser
  blocks: TimetableBlock[]
}

export interface Group {
  id: string
  name: string
  description: string | null
  type: GroupType
  createdById: string
  createdAt: string
}

export interface FreeSlot {
  day: Day
  startTime: string
  endTime: string
}

export interface FreeTimeParticipant {
  id: string
  displayName: string
  avatarUrl: string | null
  isSelf: boolean
}

export interface FreeTimeWindow {
  start: string
  end: string
}

export interface FreeTimeResponse {
  participants: FreeTimeParticipant[]
  days: Record<string, FreeTimeWindow[]>
}

export interface GroupUser {
  id: string
  displayName: string
  avatarUrl: string | null
}

export interface GroupSummary {
  id: string
  name: string
  avatarUrl: string | null
  memberCount: number
  muted: boolean
  unread: number
  lastMessage: { kind: string; text: string | null; createdAt: string } | null
}

export type GroupFriendship = 'self' | 'friends' | 'pending' | 'none'

export interface GroupMember {
  user: GroupUser
  role: string
  isSelf: boolean
  friendship: GroupFriendship
}

export interface GroupDetail {
  group: { id: string; name: string; avatarUrl: string | null }
  members: GroupMember[]
  myRole: string
  muted: boolean
}

export interface PollOption {
  choice: string
  voters: string[]
}

export interface MessagePoll {
  id: string
  question: string
  options: PollOption[]
  myVote: string | null
}

export interface NotificationCounts {
  friendRequests: number
  groupsUnread: number
}

export interface MessageEvent {
  id: string
  title: string
  day: string
  startTime: string
  endTime: string
  venue: string | null
}

export interface ChatMessage {
  id: string
  kind: 'text' | 'image' | 'video' | 'poll' | 'event'
  text: string | null
  mediaUrl: string | null
  createdAt: string
  sender: GroupUser
  readBy: string[]
  mine: boolean
  poll?: MessagePoll
  event?: MessageEvent
}

export interface GroupAvailabilitySlot {
  day: string
  start: string
  end: string
  freeCount: number
  totalCount: number
  busyNames: string[]
}

export interface GroupAvailability {
  totalCount: number
  everyoneFree: GroupAvailabilitySlot[]
  bestSlots: GroupAvailabilitySlot[]
}

export interface Event {
  id: string
  title: string
  description: string | null
  createdById: string
  groupId: string | null
  createdAt: string
}

export interface EventSlot {
  id: string
  eventId: string
  startDatetime: string
  endDatetime: string
}

export interface FeedPost {
  id: string
  userId: string
  content: string
  createdAt: string
}

export interface PrivacySettings {
  userId: string
  timetableVisibility: Visibility
  freeTimeVisibility: Visibility
  feedVisibility: Visibility
}

export interface Profile {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  major: string | null
  defaultBlockVisibility: 'private' | 'friends'
}

export interface FailedImport {
  moduleCode: string
  lessonType: string
  lessonLabel: string
  classNo: string
  reason: 'not_found' | 'no_match'
  color: string
}

export interface ImportResult {
  created: TimetableBlock[]
  imported: number
  failed: FailedImport[]
  academicYear: string
}

export interface ApiError {
  message: string
}
