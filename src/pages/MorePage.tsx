import React from 'react'
import { useRouter } from '../routes/Router'

export const MorePage: React.FC = () => {
  const { navigate } = useRouter()

  return (
    <main className="w-full h-full min-h-dvh bg-[#1c1b22] flex flex-col items-center justify-center p-8 select-none">
      <button
        onClick={() => navigate('/?expanded=true')}
        className="fixed top-6 left-6 font-mono text-xs tracking-widest lowercase text-[var(--theme-primary)] hover:text-[var(--theme-highlight)] transition-colors cursor-pointer"
        aria-label="Return home"
      >
        ← home
      </button>
      <h1 className="text-sm font-mono tracking-widest lowercase text-[var(--theme-primary)]">
        more
      </h1>
    </main>
  )
}
