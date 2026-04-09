export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatWindow from '@/components/ChatWindow'
import FileUpload from '@/components/FileUpload'
import DocumentList from '@/components/DocumentList'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Check admin role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'accountant') redirect('/dashboard')

  // Get client profile
  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clientId)
    .single()

  if (!client) redirect('/dashboard/clients')

  // Load messages for this client
  const { data: messages } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  // Load documents for this client
  const { data: documents } = await supabase
    .from('documents')
    .select('*, uploader:profiles!documents_uploaded_by_fkey(full_name)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/clients"
          className="p-2 rounded-xl hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#00B4D8]/10 flex items-center justify-center text-[#00B4D8] text-lg font-bold">
            {client.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#282828]">{client.full_name}</h1>
            <p className="text-sm text-gray-400">{client.email}</p>
          </div>
        </div>
        {client.gdpr_accepted_at ? (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium ml-auto">GDPR OK</span>
        ) : (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-100 text-red-600 font-medium ml-auto">Bez GDPR súhlasu</span>
        )}
      </div>

      {/* Two column layout: Chat + Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat */}
        <div className="bg-white rounded-2xl border border-gray-100 h-[600px] flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-[#282828] text-sm">Chat</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatWindow
              currentUserId={user.id}
              clientId={clientId}
              initialMessages={messages || []}
            />
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <FileUpload userId={user.id} clientId={clientId} />
          <DocumentList documents={documents || []} currentUserId={user.id} />
        </div>
      </div>
    </div>
  )
}
