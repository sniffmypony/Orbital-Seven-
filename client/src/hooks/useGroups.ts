import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import type { GroupSummary } from '@/types'

export function useGroups() {
  const { getToken } = useAuth()
  const [groups,  setGroups]  = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const refetch = useCallback(async () => {
    try {
      setError(null)
      const token = await getToken()
      setGroups(await api.get<GroupSummary[]>('/api/groups', token ?? undefined))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load groups.')
    }
  }, [getToken])

  useEffect(() => {
    refetch().finally(() => setLoading(false))
    const iv = setInterval(() => { refetch().catch(() => undefined) }, 6000)
    return () => clearInterval(iv)
  }, [refetch])

  const createGroup = useCallback(async (name: string, avatarUrl: string, memberIds: string[]) => {
    const token = await getToken()
    const group = await api.post<{ id: string }>(
      '/api/groups',
      { name, avatarUrl: avatarUrl || undefined, memberIds },
      token ?? undefined
    )
    await refetch()
    return group
  }, [getToken, refetch])

  return { groups, loading, error, refetch, createGroup }
}
