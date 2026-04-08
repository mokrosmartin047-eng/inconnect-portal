import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardStats from '@/components/DashboardStats'
import Link from 'next/link'
import { MessageCircle, Upload, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Stats
  const [messagesRes, docsRes, recentDocsRes, readRes] = await Promise.all([
    supabase.from('messages').select('id', { count: 'exact' }).eq('is_read', false).neq('sender_id', user.id),
    supabase.from('documents').select('id', { count: 'exact' }),
    supabase.from('documents').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('messages').select('id', { count: 'exact' }).eq('is_read', true),
  ])

  // Recent documents
  const { data: recentDocuments } = await supabase
    .from('documents')
    .select('*, uploader:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Recent messages
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('*, sender:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#282828]">Prehľad</h1>
        <p className="text-gray-500 text-sm mt-1">Vitajte v klientskom portáli InConnect</p>
      </div>

      <DashboardStats
        unreadMessages={messagesRes.count || 0}
        totalDocuments={docsRes.count || 0}
        recentDocuments={recentDocsRes.count || 0}
        readMessages={readRes.count || 0}
      />

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link
          href="/dashboard/chat"
          className="flex items-center gap-2 bg-[#00B4D8] hover:bg-[#0096b7] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <MessageCircle className="w-4 h-4" />
          Otvoriť chat
        </Link>
        <Link
          href="/dashboard/documents"
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-[#282828] border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <Upload className="w-4 h-4" />
          Nahrať dokument
        </Link>
      </div>

      {/* Recent activity grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent messages */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#282828]">Posledné správy</h3>
            <Link href="/dashboard/chat" className="text-[#00B4D8] text-sm hover:underline">
              Zobraziť všetky
            </Link>
          </div>
          {recentMessages && recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((msg: any) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00B4D8]/10 flex items-center justify-center text-[#00B4D8] text-xs font-bold shrink-0">
                    {msg.sender?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#282828]">
                        {msg.sender?.full_name || 'Neznámy'}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(msg.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Zatiaľ žiadne správy</p>
          )}
        </div>

        {/* Recent documents */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#282828]">Posledné dokumenty</h3>
            <Link href="/dashboard/documents" className="text-[#00B4D8] text-sm hover:underline">
              Zobraziť všetky
            </Link>
          </div>
          {recentDocuments && recentDocuments.length > 0 ? (
            <div className="space-y-3">
              {recentDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#282828] truncate">{doc.name}</p>
                    <p className="text-xs text-gray-400">
                      {doc.uploader?.full_name} &middot; {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Zatiaľ žiadne dokumenty</p>
          )}
        </div>
      </div>
    </div>
  )
}
