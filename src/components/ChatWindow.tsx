'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Paperclip, Loader2, FileIcon, RefreshCw } from 'lucide-react'
import { formatTime, sanitizeFileName } from '@/lib/utils'
import type { Message } from '@/types'

interface ChatWindowProps {
  currentUserId: string
  clientId: string
  initialMessages: Message[]
}

export default function ChatWindow({ currentUserId, clientId, initialMessages }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabaseRef = useRef(createClient())

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabaseRef.current
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(*)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })

      if (data) {
        setMessages(data)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [clientId])

  // Mark unread messages as read on mount
  useEffect(() => {
    supabaseRef.current
      .from('messages')
      .update({ is_read: true })
      .eq('client_id', clientId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false)
      .then(() => {})
  }, [currentUserId, clientId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const msgContent = newMessage.trim()
    setNewMessage('')

    // Insert message
    const { data: inserted } = await supabaseRef.current.from('messages').insert({
      sender_id: currentUserId,
      client_id: clientId,
      content: msgContent,
    }).select('*, sender:profiles!messages_sender_id_fkey(*)').single()

    if (inserted) {
      setMessages((prev) => [...prev, inserted])
    }

    // Notify recipient (fire and forget)
    const { data: senderProfile } = await supabaseRef.current
      .from('profiles')
      .select('full_name, role')
      .eq('id', currentUserId)
      .single()

    if (senderProfile) {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          senderName: senderProfile.full_name,
          senderRole: senderProfile.role,
          clientId,
          detail: msgContent.substring(0, 100),
        }),
      }).catch(() => {})
    }

    setSending(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const filePath = `chat/${clientId}/${Date.now()}_${sanitizeFileName(file.name)}`

    const { error: uploadError } = await supabaseRef.current.storage
      .from('documents')
      .upload(filePath, file)

    if (!uploadError) {
      const { data: urlData } = supabaseRef.current.storage
        .from('documents')
        .getPublicUrl(filePath)

      const { data: inserted } = await supabaseRef.current.from('messages').insert({
        sender_id: currentUserId,
        client_id: clientId,
        content: `Súbor: ${file.name}`,
        file_url: urlData.publicUrl,
        file_name: file.name,
      }).select('*, sender:profiles!messages_sender_id_fkey(*)').single()

      if (inserted) {
        setMessages((prev) => [...prev, inserted])
      }
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Zatiaľ žiadne správy. Napíšte prvú!</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%]`}>
                {!isMine && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">
                    {(msg.sender as any)?.full_name || 'Neznámy'}
                  </p>
                )}
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-[#00B4D8] text-white rounded-br-md'
                      : 'bg-white border border-gray-100 text-[#282828] rounded-bl-md'
                  }`}
                >
                  {msg.file_url ? (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 ${isMine ? 'text-white hover:text-white/80' : 'text-[#00B4D8] hover:underline'}`}
                    >
                      <FileIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{msg.file_name || 'Súbor'}</span>
                    </a>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white p-4">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2.5 text-gray-400 hover:text-[#00B4D8] hover:bg-[#00B4D8]/10 rounded-xl transition"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napíšte správu..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#00B4D8] focus:ring-2 focus:ring-[#00B4D8]/20 outline-none transition text-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-[#00B4D8] hover:bg-[#0096b7] text-white rounded-xl transition disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
