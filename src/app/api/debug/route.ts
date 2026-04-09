import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'not logged in' })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: allDocs, error: allErr } = await supabase
    .from('documents')
    .select('id, name, client_id, uploaded_by, month')

  const { data: filteredDocs, error: filtErr } = await supabase
    .from('documents')
    .select('id, name, client_id, uploaded_by, month')
    .eq('client_id', user.id)

  return NextResponse.json({
    userId: user.id,
    role: profile?.role,
    allDocs: { count: allDocs?.length, data: allDocs, error: allErr },
    filteredDocs: { count: filteredDocs?.length, data: filteredDocs, error: filtErr },
  })
}
