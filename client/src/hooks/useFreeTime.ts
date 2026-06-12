import { useCallback, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import type { FreeTimeResponse } from '@/types'

export function useFreeTime() {
  const { getToken } = useAuth()
  const [data,    setData]    = useState<FreeTimeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetchFreeTime = useCallback(async (friendIds: string[]) => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      const query = friendIds.length > 0 ? `?friendIds=${friendIds.join(',')}` : ''
      const res = await api.get<FreeTimeResponse>(`/api/freetime${query}`, token ?? undefined)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not compute free time.')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  return { data, loading, error, fetchFreeTime }
}
