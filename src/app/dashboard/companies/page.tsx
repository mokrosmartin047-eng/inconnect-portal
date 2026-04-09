export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompanyManager from '@/components/CompanyManager'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'accountant') redirect('/dashboard/clients')

  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('client_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#282828]">Firmy</h1>
        <p className="text-gray-500 text-sm mt-1">Spravujte firmy pre ktoré nahráte dokumenty</p>
      </div>

      <CompanyManager userId={user.id} companies={companies || []} />
    </div>
  )
}
