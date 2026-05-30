import { useState } from 'react'
import { useTimetable } from '@/hooks/useTimetable'
import type { TimetableBlock } from '@/types'
import TimetableGrid from '@/components/timetable/TimetableGrid'
import NusmodsImportPanel from '@/components/timetable/NusmodsImportPanel'
import CustomBlockForm from '@/components/timetable/CustomBlockForm'
import EditBlockForm from '@/components/timetable/EditBlockForm'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { getAcademicLabel, formatFullDate } from '@/lib/academicCalendar'

export default function TimetablePage() {
  const { blocks, loading, error, addBlock, deleteBlock, deleteModule, editBlock, refetch } = useTimetable()
  const [showCustom,   setShowCustom]   = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null)

  const today        = new Date()
  const fullDate     = formatFullDate(today)
  const academicWeek = getAcademicLabel(today)

  const modules = Array.from(
    new Map(
      blocks
        .filter((b) => b.moduleCode)
        .map((b) => [b.moduleCode, { code: b.moduleCode!, color: b.color }])
    ).values()
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Import from NUSMods or add your own blocks.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowCustom(true)}>
          + Custom block
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      
      <NusmodsImportPanel onImported={refetch} />

      
      {modules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {modules.map(({ code, color }) => (
            <div
              key={code}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {code}
              <button
                onClick={() => deleteModule(code)}
                className="opacity-70 hover:opacity-100 text-xs leading-none"
                title={`Remove ${code}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{fullDate}</span>
        {academicWeek ? (
          <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-0.5 rounded-full">
            {academicWeek}
          </span>
        ) : (
          <span className="text-sm text-gray-400 bg-gray-100 px-3 py-0.5 rounded-full">
            Vacation / Orientation
          </span>
        )}
      </div>

      
      {blocks.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 flex items-center justify-center h-64">
          <p className="text-gray-400 text-sm">
            No blocks yet. Import your NUSMods timetable or add a custom block.
          </p>
        </div>
      ) : (
        <TimetableGrid
          blocks={blocks}
          onDelete={deleteBlock}
          onEdit={setEditingBlock}
        />
      )}

      
      <Modal
        open={showCustom}
        onClose={() => setShowCustom(false)}
        title="Add custom block"
      >
        <CustomBlockForm
          onSubmit={async (block) => {
            await addBlock(block)
            setShowCustom(false)
          }}
          onCancel={() => setShowCustom(false)}
        />
      </Modal>

      
      <Modal
        open={!!editingBlock}
        onClose={() => setEditingBlock(null)}
        title="Edit block"
      >
        {editingBlock && (
          <EditBlockForm
            block={editingBlock}
            onSave={async (updates) => {
              await editBlock(editingBlock.id, updates)
              setEditingBlock(null)
            }}
            onCancel={() => setEditingBlock(null)}
          />
        )}
      </Modal>
    </div>
  )
}
