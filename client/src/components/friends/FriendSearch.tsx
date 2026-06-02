import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import FriendAvatar from './FriendAvatar'
import type { UserSearchResult, FriendRelationship } from '@/types'

interface FriendSearchProps {
  onChanged: () => void
}

const RELATIONSHIP_LABEL: Record<Exclude<FriendRelationship, 'none'>, string> = {
  friends:  'Friends',
  outgoing: 'Requested',
  incoming: 'Wants to add you',
  blocked:  'Blocked',
}

export default function FriendSearch({ onChanged }: FriendSearchProps) {
  const { getToken } = useAuth()
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<UserSearchResult[]>([])
  const [loading,   setLoading]   = useState(false)
  const [searched,  setSearched]  = useState(false)
  const [error,     setError]     = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const token = await getToken()
      const data = await api.get<UserSearchResult[]>(
        `/api/friends/search?q=${encodeURIComponent(query.trim())}`,
        token ?? undefined
      )
      setResults(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(id: string) {
    setPendingId(id)
    setError('')
    try {
      const token = await getToken()
      await api.post('/api/friends/request', { addresseeId: id }, token ?? undefined)
      setResults((prev) => prev.map((r) => (r.id === id ? { ...r, relationship: 'outgoing' } : r)))
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send request.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-3">Find people</h2>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by name or email"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button onClick={handleSearch} loading={loading}>
          Search
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-sm text-gray-400 mt-4">No users matched your search.</p>
      )}

      {results.length > 0 && (
        <ul className="mt-4 space-y-2">
          {results.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2">
              <FriendAvatar user={r} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{r.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{r.email}</p>
              </div>
              {r.relationship === 'none' ? (
                <Button
                  size="sm"
                  onClick={() => handleAdd(r.id)}
                  loading={pendingId === r.id}
                >
                  Add friend
                </Button>
              ) : (
                <span className="text-xs font-medium text-gray-400 px-3 py-1.5">
                  {RELATIONSHIP_LABEL[r.relationship]}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
