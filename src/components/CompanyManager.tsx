'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Plus, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Company } from '@/types'

interface CompanyManagerProps {
  userId: string
  companies: Company[]
}

export default function CompanyManager({ userId, companies }: CompanyManagerProps) {
  const [name, setName] = useState('')
  const [ico, setIco] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setAdding(true)
    await supabase.from('companies').insert({
      client_id: userId,
      name: name.trim(),
      ico: ico.trim() || null,
    })

    setName('')
    setIco('')
    setShowForm(false)
    setAdding(false)
    router.refresh()
  }

  async function handleDelete(company: Company) {
    if (!confirm(`Naozaj chcete zmazať firmu "${company.name}"?`)) return
    await supabase.from('companies').delete().eq('id', company.id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#282828]">Moje firmy</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#00B4D8] hover:text-[#0096b7] transition"
          >
            <Plus className="w-4 h-4" />
            Pridať firmu
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Názov firmy *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="napr. AMIS Logistic s.r.o."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#00B4D8] outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">IČO</label>
            <input
              type="text"
              value={ico}
              onChange={(e) => setIco(e.target.value)}
              placeholder="nepovinné"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#00B4D8] outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!name.trim() || adding}
              className="flex items-center gap-2 bg-[#00B4D8] hover:bg-[#0096b7] text-white font-medium px-4 py-2 rounded-xl text-sm transition disabled:opacity-40"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Pridať
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setName(''); setIco('') }}
              className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition"
            >
              Zrušiť
            </button>
          </div>
        </form>
      )}

      {/* Company list */}
      {companies.length === 0 ? (
        <div className="text-center py-6">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Zatiaľ žiadne firmy</p>
          <p className="text-xs text-gray-400 mt-1">Pridajte firmu aby ste mohli nahrávať dokumenty</p>
        </div>
      ) : (
        <div className="space-y-2">
          {companies.map((company) => (
            <div
              key={company.id}
              className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl"
            >
              <Building2 className="w-5 h-5 text-[#00B4D8] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#282828]">{company.name}</p>
                {company.ico && (
                  <p className="text-xs text-gray-400">IČO: {company.ico}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(company)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                title="Zmazať"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
