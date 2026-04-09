export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, MessageCircle, FileText, ShieldCheck, ShieldX } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'accountant') redirect('/dashboard')

  // Load all clients
  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('full_name', { ascending: true })

  // Get unread message counts and document counts per client
  const clientStats: Record<string, { unread: number; docs: number }> = {}
  if (clients) {
    for (const client of clients) {
      const [msgRes, docRes] = await Promise.all([
        supabase.from('messages').select('id', { count: 'exact' }).eq('client_id', client.id).eq('is_read', false).neq('sender_id', user.id),
        supabase.from('documents').select('id', { count: 'exact' }).eq('client_id', client.id),
      ])
      clientStats[client.id] = {
        unread: msgRes.count || 0,
        docs: docRes.count || 0,
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#282828]">Klienti</h1>
        <p className="text-gray-500 text-sm mt-1">{clients?.length || 0} klientov</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {!clients || clients.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Zatiaľ žiadni klienti</p>
        ) : (
          clients.map((client: any) => {
            const stats = clientStats[client.id] || { unread: 0, docs: 0 }
            return (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="w-11 h-11 rounded-full bg-[#00B4D8]/10 flex items-center justify-center text-[#00B4D8] text-lg font-bold shrink-0">
                  {client.full_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#282828]">{client.full_name}</p>
                    {client.gdpr_accepted_at ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <ShieldX className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{client.email}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {stats.unread > 0 ? (
                      <span className="text-[#00B4D8] font-semibold">{stats.unread} nových</span>
                    ) : (
                      <span>0</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{stats.docs}</span>
                  </div>
                  <span className="text-gray-300">{formatDate(client.created_at)}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
