import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import type { NotificationCounts } from '@/types'

export function useNotifications() {
  const { getToken } = useAuth()
  const [counts, setCounts] = useState<NotificationCounts>({ friendRequests: 0, groupsUnread: 0 })

  const refetch = useCallback(async () => {
    const token = await getToken()
    const data = await api
      .get<NotificationCounts>('/api/notifications', token ?? undefined)
      .catch(() => null)
    if (data) setCounts(data)
  }, [getToken])

  useEffect(() => {
    refetch()
    const iv = setInterval(refetch, 10000)
    return () => clearInterval(iv)
  }, [refetch])

  return counts
}
