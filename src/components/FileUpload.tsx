'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FileUploadProps {
  userId: string
}

const categories = [
  { value: 'invoice', label: 'Faktúra' },
  { value: 'contract', label: 'Zmluva' },
  { value: 'receipt', label: 'Doklad' },
  { value: 'other', label: 'Iné' },
]

export default function FileUpload({ userId }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [category, setCategory] = useState('other')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function uploadFile(file: File) {
    setUploading(true)

    const filePath = `${userId}/${Date.now()}_${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file)

    if (uploadError) {
      alert('Chyba pri nahrávaní: ' + uploadError.message)
      setUploading(false)
      return
    }

    await supabase.from('documents').insert({
      name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      category,
      uploaded_by: userId,
    })

    setSelectedFile(null)
    setCategory('other')
    setUploading(false)
    router.refresh()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) setSelectedFile(file)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-[#282828] mb-4">Nahrať dokument</h3>

      {!selectedFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            dragActive
              ? 'border-[#00B4D8] bg-[#00B4D8]/5'
              : 'border-gray-200 hover:border-[#00B4D8] hover:bg-gray-50'
          }`}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Pretiahnite súbor sem alebo <span className="text-[#00B4D8] font-medium">kliknite</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF, Excel, Word, obrázky (max 50 MB)</p>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm text-[#282828] truncate">{selectedFile.name}</span>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-red-500 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Kategória</label>
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

          <button
            onClick={() => uploadFile(selectedFile)}
            disabled={uploading}
            className="w-full bg-[#00B4D8] hover:bg-[#0096b7] text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Nahrávam...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Nahrať
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
