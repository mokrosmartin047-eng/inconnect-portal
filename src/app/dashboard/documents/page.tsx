import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import DocumentList from '@/components/DocumentList'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // This page is only for clients — admin accesses docs via /dashboard/clients/[id]
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'accountant') redirect('/dashboard/clients')

  // Client sees their own documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*, uploader:profiles(full_name)')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#282828]">Dokumenty</h1>
        <p className="text-gray-500 text-sm mt-1">Vaše zdieľané súbory</p>
      </div>

      <FileUpload userId={user.id} clientId={user.id} />
      <DocumentList documents={documents || []} currentUserId={user.id} />
    </div>
  )
}
