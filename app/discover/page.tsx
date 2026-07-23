'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { UserButton } from '@clerk/nextjs'

type Profile = {
  id: string
  clerk_user_id: string
  name: string
  age: number
  bio: string
  gender: string
  interested_in: string
  location: string
  hobbies: string[]
  occupation: string
  photo_url: string
}

export default function Discover() {
  const { user } = useUser()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchName, setMatchName] = useState<string | null>(null)

  const loadProfiles = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const { data: swipedRows } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', user.id)

    const swipedIds = (swipedRows || []).map((r) => r.swiped_id)
    const excludeIds = [user.id, ...swipedIds]

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('clerk_user_id', 'in', `(${excludeIds.join(',')})`)

    if (!error && data) {
      setProfiles(data as Profile[])
      setCurrentIndex(0)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadProfiles()
}, [loadProfiles])

  async function handleSwipe(direction: 'like' | 'pass') {
    if (!user) return
    const target = profiles[currentIndex]
    if (!target) return

    await supabase.from('swipes').insert({
      swiper_id: user.id,
      swiped_id: target.clerk_user_id,
      direction,
    })

    if (direction === 'like') {
      const { data: theirSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', target.clerk_user_id)
        .eq('swiped_id', user.id)
        .eq('direction', 'like')
        .maybeSingle()

      if (theirSwipe) {
        const [user1_id, user2_id] = [user.id, target.clerk_user_id].sort()
        await supabase.from('matches').insert({ user1_id, user2_id })
        setMatchName(target.name)
      }
    }

    setCurrentIndex((i) => i + 1)
  }

  const current = profiles[currentIndex]

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#3B0A0A] flex flex-col items-center px-6 py-10">
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F2A93B]/15 blur-3xl" style={{ animation: 'float 9s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute -bottom-32 -right-16 w-[26rem] h-[26rem] rounded-full bg-[#D4A017]/10 blur-3xl" style={{ animation: 'float 11s ease-in-out infinite 1s' }} />

      <div className="w-full max-w-md flex justify-between items-center z-10 mb-6">
        <h1 className="text-2xl text-[#FDF3E3]" style={{ fontFamily: 'var(--font-display)' }}>
          Discover
        </h1>
        <UserButton />
      </div>

      {matchName && (
        <div
          className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center px-6"
          onClick={() => setMatchName(null)}
        >
          <div className="bg-[#FDF3E3] rounded-3xl p-8 text-center max-w-sm" style={{ animation: 'fadeInUp 0.4s ease-out both' }}>
            <h2 className="text-3xl text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              It&apos;s a match!
            </h2>
            <p className="text-[#3B0A0A]/70 mb-4" style={{ fontFamily: 'var(--font-body)' }}>
              You and {matchName} liked each other.
            </p>
            <button
              onClick={() => setMatchName(null)}
              className="px-6 py-2 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold"
            >
              Keep browsing
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-[#FDF3E3] z-10" style={{ fontFamily: 'var(--font-body)' }}>Loading profiles...</p>
      ) : current ? (
        <div
          className="relative z-10 bg-[#FDF3E3] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          style={{ animation: 'fadeInUp 0.4s ease-out both' }}
          key={current.id}
        >
          <div className="w-full h-96 bg-[#D4A017]/20">
            {current.photo_url ? (
              <img src={current.photo_url} alt={current.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#3B0A0A]/40">No photo</div>
            )}
          </div>

          <div className="p-6">
            <h2 className="text-2xl text-[#3B0A0A]" style={{ fontFamily: 'var(--font-display)' }}>
              {current.name}, {current.age}
            </h2>
            {current.location && (
              <p className="text-sm text-[#3B0A0A]/60 mb-2" style={{ fontFamily: 'var(--font-body)' }}>{current.location}</p>
            )}
            {current.occupation && (
              <p className="text-sm text-[#3B0A0A]/70 mb-2" style={{ fontFamily: 'var(--font-body)' }}>{current.occupation}</p>
            )}
            <p className="text-[#3B0A0A]/80 mb-3" style={{ fontFamily: 'var(--font-body)' }}>{current.bio}</p>
            {current.hobbies && current.hobbies.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {current.hobbies.map((h, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full bg-[#D4A017]/15 text-[#3B0A0A]/70">
                    {h}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-4 mt-2">
              <button
                onClick={() => handleSwipe('pass')}
                className="flex-1 py-3 rounded-full border-2 border-[#3B0A0A]/20 text-[#3B0A0A] font-semibold hover:bg-[#3B0A0A]/5 transition-colors"
              >
                Pass
              </button>
              <button
                onClick={() => handleSwipe('like')}
                className="flex-1 py-3 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold hover:bg-[#D4A017] transition-colors"
              >
                Like
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center z-10" style={{ fontFamily: 'var(--font-body)' }}>
          <p className="text-[#FDF3E3] text-lg mb-2">No more profiles right now.</p>
          <p className="text-[#F2A93B] text-sm">Check back later.</p>
        </div>
      )}
    </main>
  )
}