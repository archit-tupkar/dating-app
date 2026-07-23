'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { io, Socket } from 'socket.io-client'

type Message = {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export default function ChatPage() {
  const { user } = useUser()
  const params = useParams()
  const searchParams = useSearchParams()
  const matchId = params.matchId as string
  const otherName = searchParams.get('name') || 'Match'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadHistory() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (data) setMessages(data as Message[])
    }
    loadHistory()

    const socket = io()
    socketRef.current = socket

    socket.emit('join-room', matchId)

    socket.on('receive-message', (msg: Message) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.disconnect()
    }
  }, [matchId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !user) return

    const newMessage = {
      match_id: matchId,
      sender_id: user.id,
      content: input.trim(),
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message])
      socketRef.current?.emit('send-message', data)
      setInput('')
    }
  }

  return (
    <main className="min-h-screen bg-[#3B0A0A] flex flex-col">
      <div className="bg-[#FDF3E3] px-6 py-4 flex items-center gap-3 shadow-md">
        <a href="/matches" className="text-[#3B0A0A] text-xl">←</a>
        <h1 className="text-lg text-[#3B0A0A] font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
          {otherName}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] px-4 py-2 rounded-2xl ${
              m.sender_id === user?.id
                ? 'bg-[#F2A93B] text-[#3B0A0A] self-end'
                : 'bg-[#FDF3E3] text-[#3B0A0A] self-start'
            }`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-[#FDF3E3] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full border border-[#D4A017]/30 outline-none"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold"
        >
          Send
        </button>
      </form>
    </main>
  )
}