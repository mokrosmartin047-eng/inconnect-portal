import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SessionTimeout from '@/components/SessionTimeout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={profile?.full_name || user.email || 'User'}
        role={profile?.role || 'client'}
      />
      <main className="flex-1 p-6 overflow-auto bg-[#f7f8fa]">
        <SessionTimeout />
        {children}
      </main>
    </div>
  )
}
