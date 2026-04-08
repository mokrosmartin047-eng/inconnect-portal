'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Prehľad', icon: LayoutDashboard },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageCircle },
  { href: '/dashboard/documents', label: 'Dokumenty', icon: FileText },
]

export default function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-[#282828] text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <Image src="/logo-white.png" alt="InConnect Účtovníctvo" width={180} height={50} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-[#00B4D8] text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#00B4D8] flex items-center justify-center text-sm font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-300 truncate">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
            title="Odhlásiť sa"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
