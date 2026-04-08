'use client'

import { MessageCircle, FileText, Clock, CheckCircle2 } from 'lucide-react'

interface StatsProps {
  unreadMessages: number
  totalDocuments: number
  recentDocuments: number
  readMessages: number
}

export default function DashboardStats({
  unreadMessages,
  totalDocuments,
  recentDocuments,
  readMessages,
}: StatsProps) {
  const cards = [
    {
      label: 'Neprečítané správy',
      value: unreadMessages,
      icon: MessageCircle,
      color: 'text-[#00B4D8]',
      bg: 'bg-[#00B4D8]/10',
    },
    {
      label: 'Dokumenty celkom',
      value: totalDocuments,
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Nové (7 dní)',
      value: recentDocuments,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Prečítané správy',
      value: readMessages,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4"
        >
          <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#282828]">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
