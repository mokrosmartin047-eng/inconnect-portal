import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uearltroavkcaonqgccc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlYXJsdHJvYXZrY2FvbnFnY2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1OTMyNzYsImV4cCI6MjA5MTE2OTI3Nn0.PneORE0BuHUUF_u5NdjobfjVhhSMd_iXYPX2ZELBEmM'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const pathname = request.nextUrl.pathname
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — redirect to login (except public pages)
  if (!user && !pathname.startsWith('/auth') && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Logged in on login page — redirect to dashboard
  if (user && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // GDPR check for clients — must accept before using dashboard
  if (user && pathname.startsWith('/dashboard')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, gdpr_accepted_at')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'client' && !profile.gdpr_accepted_at) {
      const url = request.nextUrl.clone()
      url.pathname = '/gdpr'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
