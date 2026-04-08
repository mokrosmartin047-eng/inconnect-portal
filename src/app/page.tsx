'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogIn, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Login error:', error.message, error.status)
      setError(error.message || 'Nesprávne prihlasovacie údaje')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#282828] relative items-center justify-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#00B4D8]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[#00B4D8]/5 rounded-full blur-3xl" />

        <div className="relative z-10 px-16 text-center">
          <Image src="/logo-white.png" alt="InConnect Účtovníctvo" width={320} height={90} priority className="mx-auto" />
          <div className="mt-8 space-y-3">
            <p className="text-white/80 text-lg font-light">Klientský portál</p>
            <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
              Bezpečná komunikácia a zdieľanie dokumentov medzi účtovníkom a klientom na jednom mieste.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-[#f7f8fa] px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src="/logo.png" alt="InConnect Účtovníctvo" width={240} height={68} priority />
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#282828]">Vitajte späť</h2>
              <p className="text-gray-400 text-sm mt-1">Prihláste sa do svojho účtu</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 outline-none transition text-[#282828] bg-gray-50/50"
                  placeholder="vas@email.sk"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Heslo
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 outline-none transition text-[#282828] bg-gray-50/50"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00B4D8] hover:bg-[#0096b7] text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-[#00B4D8]/25"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            InConnect Účtovníctvo &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
