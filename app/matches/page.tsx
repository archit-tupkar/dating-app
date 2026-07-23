'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

type MatchedProfile = {
  match_id: string
  clerk_user_id: string
  name: string
  photo_url: string
}

export default function Matches() {
  const { user } = useUser()
  const [matches, setMatches] = useState<MatchedProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMatches() {
      if (!user) return

      const { data: matchRows } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

      if (!matchRows || matchRows.length === 0) {
        setLoading(false)
        return
      }

      const otherIds = matchRows.map((m) =>
        m.user1_id === user.id ? m.user2_id : m.user1_id
      )

      const { data: profiles } = await supabase
        .from('profiles')
        .select('clerk_user_id, name, photo_url')
        .in('clerk_user_id', otherIds)

      const combined = matchRows.map((m) => {
        const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id
        const profile = profiles?.find((p) => p.clerk_user_id === otherId)
        return {
          match_id: m.id,
          clerk_user_id: otherId,
          name: profile?.name || 'Unknown',
          photo_url: profile?.photo_url || '',
        }
      })

      setMatches(combined)
      setLoading(false)
    }

    loadMatches()
  }, [user])

  return (
    <main className="min-h-screen bg-[#3B0A0A] px-6 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl text-[#FDF3E3]" style={{ fontFamily: 'var(--font-display)' }}>
            Your matches
          </h1>
          <UserButton />
        </div>

        {loading ? (
          <p className="text-[#FDF3E3]" style={{ fontFamily: 'var(--font-body)' }}>Loading...</p>
        ) : matches.length === 0 ? (
          <p className="text-[#F2A93B]" style={{ fontFamily: 'var(--font-body)' }}>
            No matches yet — go discover people first.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((m) => (
              <Link
                key={m.match_id}
                href={`/messages/${m.match_id}?with=${m.clerk_user_id}&name=${encodeURIComponent(m.name)}`}
                className="flex items-center gap-4 bg-[#FDF3E3] rounded-2xl p-3 hover:bg-[#FDF3E3]/90 transition-colors"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#D4A017]/20 flex-shrink-0">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="text-[#3B0A0A] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                  {m.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}