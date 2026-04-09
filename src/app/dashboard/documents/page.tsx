export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FileUpload from '@/components/FileUpload'
import DocumentList from '@/components/DocumentList'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'accountant') redirect('/dashboard/clients')

  const [docsRes, companiesRes] = await Promise.all([
    supabase
      .from('documents')
      .select('*, uploader:profiles!documents_uploaded_by_fkey(full_name), company:companies(name)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('companies')
      .select('*')
      .eq('client_id', user.id)
      .order('name', { ascending: true }),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#282828]">Dokumenty</h1>
        <p className="text-gray-500 text-sm mt-1">Vaše zdieľané súbory</p>
      </div>

      <FileUpload userId={user.id} clientId={user.id} companies={companiesRes.data || []} />
      <DocumentList documents={docsRes.data || []} currentUserId={user.id} companies={companiesRes.data || []} />
    </div>
  )
}
