import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import type { GroupDetail, ChatMessage, GroupAvailability } from '@/types'

export function useGroupChat(groupId: string) {
  const { getToken } = useAuth()
  const [detail,   setDetail]   = useState<GroupDetail | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const load = useCallback(async () => {
    const token = await getToken()
    const [d, m] = await Promise.all([
      api.get<GroupDetail>(`/api/groups/${groupId}`, token ?? undefined),
      api.get<ChatMessage[]>(`/api/groups/${groupId}/messages`, token ?? undefined),
    ])
    setDetail(d)
    setMessages(m)
    await api.post(`/api/groups/${groupId}/read`, {}, token ?? undefined).catch(() => undefined)
  }, [getToken, groupId])

  useEffect(() => {
    let active = true
    load()
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : 'Failed to load chat.') })
      .finally(() => { if (active) setLoading(false) })
    const iv = setInterval(() => { load().catch(() => undefined) }, 4000)
    return () => { active = false; clearInterval(iv) }
  }, [load])

  const send = useCallback(async (text: string) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/messages`, { kind: 'text', text }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const sendMedia = useCallback(async (kind: 'image' | 'video', mediaUrl: string) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/messages`, { kind, mediaUrl }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const deleteMessage = useCallback(async (messageId: string) => {
    const token = await getToken()
    await api.delete(`/api/groups/${groupId}/messages/${messageId}`, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const createPoll = useCallback(async (question: string) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/polls`, { question }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const votePoll = useCallback(async (pollId: string, optionId: string) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/polls/${pollId}/vote`, { optionId }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const retractVote = useCallback(async (pollId: string) => {
    const token = await getToken()
    await api.delete(`/api/groups/${groupId}/polls/${pollId}/vote`, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const addPollOption = useCallback(async (pollId: string, label: string) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/polls/${pollId}/options`, { label }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const setMemberRole = useCallback(async (userId: string, role: 'admin' | 'member') => {
    const token = await getToken()
    await api.patch(`/api/groups/${groupId}/members/${userId}/role`, { role }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const setAllowMemberAdd = useCallback(async (allowMemberAdd: boolean) => {
    const token = await getToken()
    await api.patch(`/api/groups/${groupId}`, { allowMemberAdd }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const transferOwner = useCallback(async (userId: string) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/transfer-owner`, { userId }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const deleteGroup = useCallback(async () => {
    const token = await getToken()
    await api.delete(`/api/groups/${groupId}`, token ?? undefined)
  }, [getToken, groupId])

  const createEvent = useCallback(async (e: { title: string; day: string; startTime: string; endTime: string; venue: string }) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/events`, e, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const addEvent = useCallback(async (eventId: string, recurrence: 'once' | 'weeks' | 'never', weeks?: number) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/events/${eventId}/add`, { recurrence, weeks }, token ?? undefined)
  }, [getToken, groupId])

  const leave = useCallback(async (userId: string) => {
    const token = await getToken()
    await api.delete(`/api/groups/${groupId}/members/${userId}`, token ?? undefined)
  }, [getToken, groupId])

  const toggleMute = useCallback(async (muted: boolean) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/mute`, { muted }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const addMember = useCallback(async (userId: string) => {
    const token = await getToken()
    await api.post(`/api/groups/${groupId}/members`, { userId }, token ?? undefined)
    await load()
  }, [getToken, groupId, load])

  const addFriend = useCallback(async (userId: string) => {
    const token = await getToken()
    await api.post('/api/friends/request', { addresseeId: userId }, token ?? undefined)
    await load()
  }, [getToken, load])

  const fetchFreeTime = useCallback(async (): Promise<GroupAvailability> => {
    const token = await getToken()
    return api.get<GroupAvailability>(`/api/groups/${groupId}/freetime`, token ?? undefined)
  }, [getToken, groupId])

  return {
    detail, messages, loading, error,
    send, sendMedia, deleteMessage, createPoll, votePoll, retractVote, addPollOption, createEvent, addEvent,
    leave, toggleMute, addMember, addFriend, setMemberRole, setAllowMemberAdd,
    transferOwner, deleteGroup, fetchFreeTime, reload: load,
  }
}
