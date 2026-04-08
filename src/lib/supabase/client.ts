import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uearltroavkcaonqgccc.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlYXJsdHJvYXZrY2FvbnFnY2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1OTMyNzYsImV4cCI6MjA5MTE2OTI3Nn0.PneORE0BuHUUF_u5NdjobfjVhhSMd_iXYPX2ZELBEmM'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
