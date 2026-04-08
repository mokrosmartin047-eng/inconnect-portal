import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatWindow from '@/components/ChatWindow'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles(*)')
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-3rem)]">
      <div className="bg-white rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#282828]">Chat</h2>
          <p className="text-sm text-gray-400">Správy medzi účtovníčkou a klientom</p>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow currentUserId={user.id} initialMessages={messages || []} />
        </div>
      </div>
    </div>
  )
}
