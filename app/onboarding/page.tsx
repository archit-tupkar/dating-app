'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('')
  const [interestedIn, setInterestedIn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    const { error } = await supabase.from('profiles').insert({
      clerk_user_id: user.id,
      name,
      age: parseInt(age),
      bio,
      gender,
      interested_in: interestedIn,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/')
  }

  return (
    <main className="min-h-screen bg-[#3B0A0A] flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="bg-[#FDF3E3] rounded-2xl p-8 w-full max-w-md flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Tell us about you
        </h1>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="px-4 py-2 rounded-lg border border-[#D4A017]/40 bg-white"
        />

        <input
          type="number"
          placeholder="Your age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
          min="18"
          className="px-4 py-2 rounded-lg border border-[#D4A017]/40 bg-white"
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          required
          className="px-4 py-2 rounded-lg border border-[#D4A017]/40 bg-white"
        >
          <option value="">I am a...</option>
          <option value="man">Man</option>
          <option value="woman">Woman</option>
          <option value="other">Other</option>
        </select>

        <select
          value={interestedIn}
          onChange={(e) => setInterestedIn(e.target.value)}
          required
          className="px-4 py-2 rounded-lg border border-[#D4A017]/40 bg-white"
        >
          <option value="">Interested in...</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="everyone">Everyone</option>
        </select>

        <textarea
          placeholder="A little about yourself"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          required
          rows={3}
          className="px-4 py-2 rounded-lg border border-[#D4A017]/40 bg-white"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold hover:bg-[#F2A93B]/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Create profile'}
        </button>
      </form>
    </main>
  )
}