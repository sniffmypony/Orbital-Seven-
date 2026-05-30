import { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import ClassSlotSelector from './ClassSlotSelector'

type Tab = 'url' | 'search'

interface NusmodsImportPanelProps {
  onImported: () => void
}

interface ModuleInfo {
  moduleCode:  string
  title:       string
  semester:    number
  lessonTypes: Record<string, Array<{
    classNo: string; day: string; startTime: string; endTime: string; venue: string
  }>>
}

export default function NusmodsImportPanel({ onImported }: NusmodsImportPanelProps) {
  const { getToken } = useAuth()
  const [tab, setTab] = useState<Tab>('url')

  // ── URL import state ────────────────────────────────────────────────────────
  const [shareUrl,    setShareUrl]    = useState('')
  const [urlLoading,  setUrlLoading]  = useState(false)
  const [urlError,    setUrlError]    = useState('')

  // ── Manual search state ─────────────────────────────────────────────────────
  const [moduleCode,  setModuleCode]  = useState('')
  const [semester,    setSemester]    = useState('1')
  const [moduleInfo,  setModuleInfo]  = useState<ModuleInfo | null>(null)
  const [selected,    setSelected]    = useState<Record<string, string>>({})
  const [searchLoad,  setSearchLoad]  = useState(false)
  const [searchError, setSearchError] = useState('')
  const [saveLoad,    setSaveLoad]    = useState(false)

  // ── URL import ──────────────────────────────────────────────────────────────
  async function handleUrlImport() {
    if (!shareUrl.trim()) return
    setUrlLoading(true)
    setUrlError('')
    try {
      const token = await getToken()
      await api.post('/api/timetable/import', { shareUrl: shareUrl.trim() }, token ?? undefined)
      setShareUrl('')
      onImported()
    } catch (e) {
      setUrlError(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setUrlLoading(false)
    }
  }

  // ── Manual search ───────────────────────────────────────────────────────────
  async function handleSearch() {
    if (!moduleCode.trim()) return
    setSearchLoad(true)
    setSearchError('')
    setModuleInfo(null)
    setSelected({})
    try {
      const token = await getToken()
      const data  = await api.get<ModuleInfo>(
        `/api/nusmods/module/${moduleCode.trim().toUpperCase()}?semester=${semester}`,
        token ?? undefined
      )
      setModuleInfo(data)
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Module not found.')
    } finally {
      setSearchLoad(false)
    }
  }

  async function handleAddModule() {
    if (!moduleInfo) return
    // Build selections array from the selected map
    const selections = Object.entries(selected).map(([lessonType, classNo]) => ({ lessonType, classNo }))
    if (selections.length === 0) { setSearchError('Select at least one class slot.'); return }

    // Build a fake NUSMods share URL from the selections so we can reuse the import endpoint
    const params = Object.entries(selected)
      .map(([lt, cn]) => `${lt}:${cn}`)
      .join(',')
    const fakeUrl = `https://nusmods.com/timetable/sem-${semester}/share?${moduleInfo.moduleCode}=${params}`

    setSaveLoad(true)
    setSearchError('')
    try {
      const token = await getToken()
      await api.post('/api/timetable/import', { shareUrl: fakeUrl }, token ?? undefined)
      setModuleCode('')
      setModuleInfo(null)
      setSelected({})
      onImported()
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Failed to add module.')
    } finally {
      setSaveLoad(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {(['url', 'search'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-1.5 text-sm font-medium rounded-md transition-colors',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t === 'url' ? 'Paste NUSMods URL' : 'Search module'}
          </button>
        ))}
      </div>

      {/* URL tab */}
      {tab === 'url' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Go to <strong>nusmods.com</strong>, build your timetable, click{' '}
            <strong>Share</strong>, then paste the link below.
          </p>
          <textarea
            value={shareUrl}
            onChange={(e) => setShareUrl(e.target.value)}
            placeholder="https://nusmods.com/timetable/sem-1/share?CS2030S=LAB:05,..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          {urlError && <p className="text-sm text-red-600">{urlError}</p>}
          <Button onClick={handleUrlImport} loading={urlLoading} className="w-full">
            Import timetable
          </Button>
        </div>
      )}

      {/* Search tab */}
      {tab === 'search' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={moduleCode}
              onChange={(e) => setModuleCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Module code, e.g. CS2030S"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="1">Sem 1</option>
              <option value="2">Sem 2</option>
            </select>
            <Button onClick={handleSearch} loading={searchLoad} variant="secondary">
              Search
            </Button>
          </div>

          {searchError && <p className="text-sm text-red-600">{searchError}</p>}

          {moduleInfo && (
            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <div>
                <p className="font-semibold text-gray-900">{moduleInfo.moduleCode}</p>
                <p className="text-sm text-gray-500">{moduleInfo.title}</p>
              </div>

              <ClassSlotSelector
                lessonTypes={moduleInfo.lessonTypes}
                selected={selected}
                onChange={(lt, cn) => setSelected((prev) => ({ ...prev, [lt]: cn }))}
              />

              <Button
                onClick={handleAddModule}
                loading={saveLoad}
                className="w-full"
                disabled={Object.keys(selected).length === 0}
              >
                Add {moduleInfo.moduleCode} to timetable
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
