import { useFriends } from '@/hooks/useFriends'
import FriendSearch from '@/components/friends/FriendSearch'
import FriendRequestList from '@/components/friends/FriendRequestList'
import FriendList from '@/components/friends/FriendList'
import BlockedList from '@/components/friends/BlockedList'

export default function FriendsPage() {
  const {
    friends, requests, blocked, loading, error,
    respond, removeFriend, blockUser, unblockUser, refetch,
  } = useFriends()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect with classmates and view their timetables.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <FriendSearch onChanged={refetch} />
      <FriendRequestList requests={requests} onRespond={respond} onBlock={blockUser} />
      <FriendList friends={friends} onRemove={removeFriend} />
      <BlockedList blocked={blocked} onUnblock={unblockUser} />
    </div>
  )
}
