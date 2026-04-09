'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, X, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { sanitizeFileName, getMonthOptions, formatFileSize } from '@/lib/utils'

interface FileUploadProps {
  userId: string
  clientId?: string
}

const categories = [
  { value: 'invoice', label: 'Faktúra' },
  { value: 'contract', label: 'Zmluva' },
  { value: 'receipt', label: 'Doklad' },
  { value: 'ticket', label: 'Bloček' },
  { value: 'other', label: 'Iné' },
]

export default function FileUpload({ userId, clientId }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [category, setCategory] = useState('other')
  const [month, setMonth] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const monthOptions = getMonthOptions()

  async function uploadFiles() {
    if (!month) {
      alert('Vyberte mesiac, do ktorého dokumenty patria')
      return
    }
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    const total = selectedFiles.length
    let uploaded = 0

    for (const file of selectedFiles) {
      const filePath = `${clientId || userId}/${Date.now()}_${sanitizeFileName(file.name)}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) {
        alert(`Chyba pri nahrávaní "${file.name}": ${uploadError.message}`)
        continue
      }

      await supabase.from('documents').insert({
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category,
        month,
        client_id: clientId || userId,
        uploaded_by: userId,
      })

      uploaded++
      setUploadProgress(Math.round((uploaded / total) * 100))
    }

    // Notify recipient (one notification for all files)
    const { data: uploaderProfile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', userId)
      .single()

    if (uploaderProfile) {
      const fileNames = selectedFiles.map(f => f.name).join(', ')
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'document',
          senderName: uploaderProfile.full_name,
          senderRole: uploaderProfile.role,
          clientId: clientId || userId,
          detail: `${uploaded} ${uploaded === 1 ? 'dokument' : uploaded < 5 ? 'dokumenty' : 'dokumentov'}: ${fileNames.substring(0, 150)}`,
        }),
      }).catch(() => {})
    }

    setSelectedFiles([])
    setCategory('other')
    setMonth('')
    setUploading(false)
    setUploadProgress(0)
    router.refresh()
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    setSelectedFiles(prev => [...prev, ...Array.from(files)])
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    addFiles(e.dataTransfer.files)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canUpload = selectedFiles.length > 0 && month && !uploading
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-[#282828] mb-4">Nahrať dokumenty</h3>

      {/* Drop zone — always visible */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition mb-4 ${
          dragActive
            ? 'border-[#00B4D8] bg-[#00B4D8]/5'
            : 'border-gray-200 hover:border-[#00B4D8] hover:bg-gray-50'
        }`}
      >
        <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Pretiahnite súbory sem alebo <span className="text-[#00B4D8] font-medium">kliknite</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, Excel, Word, obrázky — viac súborov naraz</p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          multiple
        />
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
            {selectedFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2">
                <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#282828] truncate">{file.name}</p>
                  <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            {selectedFiles.length} {selectedFiles.length === 1 ? 'súbor' : selectedFiles.length < 5 ? 'súbory' : 'súborov'} — celkom {formatFileSize(totalSize)}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Kategória *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#00B4D8] outline-none text-sm"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Mesiac *</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm ${
                  month ? 'border-gray-200 focus:border-[#00B4D8]' : 'border-red-300 bg-red-50/50'
                }`}
              >
                <option value="">Vyberte mesiac</option>
                {monthOptions.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!month && (
            <p className="text-xs text-red-500">Mesiac je povinný — vyberte, do ktorého mesiaca dokumenty patria</p>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#00B4D8] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <button
            onClick={uploadFiles}
            disabled={!canUpload}
            className="w-full bg-[#00B4D8] hover:bg-[#0096b7] text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Nahrávam... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Nahrať {selectedFiles.length} {selectedFiles.length === 1 ? 'súbor' : selectedFiles.length < 5 ? 'súbory' : 'súborov'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
