import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import type { Friend, FriendRequest, BlockedUser } from '@/types'

export function useFriends() {
  const { getToken } = useAuth()
  const [friends,  setFriends]  = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [blocked,  setBlocked]  = useState<BlockedUser[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setError(null)
      const token = await getToken()
      const [friendList, requestList, blockedList] = await Promise.all([
        api.get<Friend[]>('/api/friends', token ?? undefined),
        api.get<FriendRequest[]>('/api/friends/requests', token ?? undefined),
        api.get<BlockedUser[]>('/api/friends/blocked', token ?? undefined),
      ])
      setFriends(friendList)
      setRequests(requestList)
      setBlocked(blockedList)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load friends.')
    }
  }, [getToken])

  useEffect(() => {
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  const sendRequest = useCallback(async (addresseeId: string) => {
    const token = await getToken()
    await api.post('/api/friends/request', { addresseeId }, token ?? undefined)
  }, [getToken])

  const respond = useCallback(async (friendshipId: string, action: 'accept' | 'reject') => {
    const token = await getToken()
    await api.patch(`/api/friends/${friendshipId}`, { action }, token ?? undefined)
    await fetchAll()
  }, [getToken, fetchAll])

  const removeFriend = useCallback(async (friendshipId: string) => {
    const token = await getToken()
    await api.delete(`/api/friends/${friendshipId}`, token ?? undefined)
    setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId))
  }, [getToken])

  const blockUser = useCallback(async (userId: string) => {
    const token = await getToken()
    await api.post('/api/friends/block', { userId }, token ?? undefined)
    await fetchAll()
  }, [getToken, fetchAll])

  const unblockUser = useCallback(async (userId: string) => {
    const token = await getToken()
    await api.delete(`/api/friends/block/${userId}`, token ?? undefined)
    await fetchAll()
  }, [getToken, fetchAll])

  return {
    friends, requests, blocked, loading, error,
    sendRequest, respond, removeFriend, blockUser, unblockUser, refetch: fetchAll,
  }
}
