'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, Trash2, Filter } from 'lucide-react'
import { formatDate, formatFileSize, getCategoryLabel, getCategoryColor } from '@/lib/utils'
import type { Document } from '@/types'
import { useRouter } from 'next/navigation'

interface DocumentListProps {
  documents: Document[]
  currentUserId: string
}

const categoryFilters = [
  { value: 'all', label: 'Všetky' },
  { value: 'invoice', label: 'Faktúry' },
  { value: 'contract', label: 'Zmluvy' },
  { value: 'receipt', label: 'Doklady' },
  { value: 'other', label: 'Iné' },
]

export default function DocumentList({ documents, currentUserId }: DocumentListProps) {
  const [filter, setFilter] = useState('all')
  const supabase = createClient()
  const router = useRouter()

  const filtered = filter === 'all'
    ? documents
    : documents.filter((d) => d.category === filter)

  async function handleDownload(doc: Document) {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`Naozaj chcete zmazať "${doc.name}"?`)) return

    await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      {/* Header + filters */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#282828]">Dokumenty</h3>
          <span className="text-sm text-gray-400">{filtered.length} súborov</span>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {categoryFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filter === f.value
                  ? 'bg-[#00B4D8] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Žiadne dokumenty</p>
        ) : (
          filtered.map((doc) => (
            <div key={doc.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#282828] truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCategoryColor(doc.category)}`}>
                    {getCategoryLabel(doc.category)}
                  </span>
                  <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
                  <span className="text-xs text-gray-400">&middot;</span>
                  <span className="text-xs text-gray-400">{formatDate(doc.created_at)}</span>
                  <span className="text-xs text-gray-400">&middot;</span>
                  <span className="text-xs text-gray-400">{(doc.uploader as any)?.full_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 text-gray-400 hover:text-[#00B4D8] hover:bg-[#00B4D8]/10 rounded-lg transition"
                  title="Stiahnuť"
                >
                  <Download className="w-4 h-4" />
                </button>
                {doc.uploaded_by === currentUserId && (
                  <button
                    onClick={() => handleDelete(doc)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Zmazať"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
