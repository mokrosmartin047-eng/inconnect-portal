'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function GdprPage() {
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAccept() {
    if (!accepted) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('profiles')
      .update({ gdpr_accepted_at: new Date().toISOString() })
      .eq('id', user.id)

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] px-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="InConnect Účtovníctvo" width={220} height={62} priority />
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-black/5 border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#00B4D8]/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#00B4D8]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#282828]">Ochrana osobných údajov</h1>
              <p className="text-sm text-gray-400">Pred používaním portálu je potrebný váš súhlas</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 mb-6 max-h-80 overflow-y-auto text-sm text-gray-600 space-y-4">
            <h3 className="font-semibold text-[#282828]">1. Správca osobných údajov</h3>
            <p>
              Správcom vašich osobných údajov je spoločnosť InConnect Účtovníctvo.
              Vaše údaje spracúvame za účelom poskytovania účtovných služieb a
              vzájomnej komunikácie prostredníctvom tohto klientského portálu.
            </p>

            <h3 className="font-semibold text-[#282828]">2. Účel spracovania</h3>
            <p>
              Vaše osobné údaje (meno, email) a dokumenty (faktúry, zmluvy, doklady, bločky)
              spracúvame výlučne za účelom:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Poskytovania účtovných a poradenských služieb</li>
              <li>Bezpečnej komunikácie medzi vami a vašou účtovníčkou</li>
              <li>Zdieľania a archivácie účtovných dokumentov</li>
            </ul>

            <h3 className="font-semibold text-[#282828]">3. Uchovávanie údajov</h3>
            <p>
              Vaše údaje uchovávame po dobu trvania zmluvného vzťahu a následne
              po dobu vyžadovanú zákonom o účtovníctve (10 rokov pre účtovné doklady).
              Údaje sú uložené na zabezpečených serveroch v rámci Európskej únie (Stockholm, Švédsko).
            </p>

            <h3 className="font-semibold text-[#282828]">4. Vaše práva</h3>
            <p>Máte právo na:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Prístup k vašim osobným údajom</li>
              <li>Opravu nesprávnych údajov</li>
              <li>Vymazanie údajov (s výnimkou zákonnej povinnosti uchovávania)</li>
              <li>Prenositeľnosť údajov</li>
              <li>Odvolanie súhlasu kedykoľvek</li>
            </ul>

            <h3 className="font-semibold text-[#282828]">5. Bezpečnosť</h3>
            <p>
              Komunikácia je šifrovaná (HTTPS/TLS). Prístup k údajom je chránený
              autentifikáciou a autorizáciou na úrovni databázy. K vašim údajom
              má prístup výlučne váš účtovník a vy.
            </p>

            <h3 className="font-semibold text-[#282828]">6. Podmienky používania portálu</h3>
            <p>
              Portál slúži výlučne na komunikáciu a zdieľanie dokumentov súvisiacich
              s účtovnými službami. Je zakázané nahrávať obsah, ktorý nesúvisí s účelom
              portálu. Za správnosť nahraných dokumentov zodpovedá používateľ.
            </p>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-[#00B4D8] focus:ring-[#00B4D8]"
            />
            <span className="text-sm text-gray-600">
              Prečítal/a som si a <strong>súhlasím s podmienkami spracovania osobných údajov</strong> a
              podmienkami používania klientského portálu InConnect Účtovníctvo.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!accepted || loading}
            className="w-full bg-[#00B4D8] hover:bg-[#0096b7] text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-[#00B4D8]/25"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
            {loading ? 'Spracovávam...' : 'Súhlasím a pokračujem'}
          </button>
        </div>
      </div>
    </div>
  )
}
