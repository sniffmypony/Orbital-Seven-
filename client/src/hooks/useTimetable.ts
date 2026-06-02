import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import type { TimetableBlock, BlockVisibility } from '@/types'

export type NewBlock =
  Omit<TimetableBlock, 'id' | 'userId' | 'createdAt' | 'visibility' | 'visibleTo' | 'note'>
  & { visibility?: BlockVisibility; visibleTo?: string[]; note?: string | null }

export function useTimetable() {
  const { getToken } = useAuth()
  const [blocks,  setBlocks]  = useState<TimetableBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchBlocks = useCallback(async () => {
    try {
      setError(null)
      const token = await getToken()
      const data  = await api.get<TimetableBlock[]>('/api/timetable', token ?? undefined)
      setBlocks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load timetable.')
    }
  }, [getToken])

  useEffect(() => {
    fetchBlocks().finally(() => setLoading(false))
  }, [fetchBlocks])

  const importFromUrl = useCallback(async (shareUrl: string) => {
    const token = await getToken()
    await api.post('/api/timetable/import', { shareUrl }, token ?? undefined)
    await fetchBlocks()
  }, [getToken, fetchBlocks])

  const addBlock = useCallback(async (block: NewBlock) => {
    const token = await getToken()
    await api.post('/api/timetable', block, token ?? undefined)
    await fetchBlocks()
  }, [getToken, fetchBlocks])

  const deleteBlock = useCallback(async (id: string) => {
    const token = await getToken()
    await api.delete(`/api/timetable/${id}`, token ?? undefined)
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }, [getToken])

  const deleteModule = useCallback(async (moduleCode: string) => {
    const token = await getToken()
    await api.delete(`/api/timetable/module/${moduleCode}`, token ?? undefined)
    setBlocks((prev) => prev.filter((b) => b.moduleCode !== moduleCode))
  }, [getToken])

  const editBlock = useCallback(async (
    id: string,
    updates: { day?: string; startTime?: string; endTime?: string; venue?: string | null; note?: string | null; color?: string; title?: string; visibility?: string; visibleTo?: string[] }
  ) => {
    const token = await getToken()
    await api.put(`/api/timetable/${id}`, updates, token ?? undefined)
    await fetchBlocks()
  }, [getToken, fetchBlocks])

  return { blocks, loading, error, importFromUrl, addBlock, deleteBlock, deleteModule, editBlock, refetch: fetchBlocks }
}
