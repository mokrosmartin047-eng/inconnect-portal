'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export default function SessionTimeout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
      }, TIMEOUT_MS)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  }, [router, supabase])

  return null
}
