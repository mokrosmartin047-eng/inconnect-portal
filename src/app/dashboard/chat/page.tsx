import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatWindow from '@/components/ChatWindow'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // This page is only for clients — admin accesses chat via /dashboard/clients/[id]
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'accountant') redirect('/dashboard/clients')

  // Client sees their own messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles(*)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-3rem)]">
      <div className="bg-white rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#282828]">Chat</h2>
          <p className="text-sm text-gray-400">Komunikácia s vašou účtovníčkou</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatWindow currentUserId={user.id} clientId={user.id} initialMessages={messages || []} />
        </div>
      </div>
    </div>
  )
}
