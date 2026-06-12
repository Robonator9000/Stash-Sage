'use client'

import { useState } from 'react'

interface WelcomeModalProps {
  onComplete: (language: string) => void
}

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'pt', flag: '🇧🇷', name: 'Português' },
]

export function WelcomeModal({ onComplete }: WelcomeModalProps) {
  const [selected, setSelected] = useState('en')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl p-8 shadow-2xl bg-card border">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌿</div>
          <h1 className="text-2xl font-bold mb-2">Stash Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Choose your language to get started
          </p>
        </div>

        <div className="grid gap-3 mb-8">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all border-2 ${
                selected === lang.code
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent bg-muted/50 text-foreground hover:bg-muted'
              }`}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span className="font-semibold">{lang.name}</span>
              {selected === lang.code && (
                <div className="ml-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => onComplete(selected)}
          className="w-full py-3.5 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400"
        >
          Get Started
        </button>

        <p className="text-center text-xs mt-4 text-muted-foreground">
          You can change language anytime in Settings
        </p>
      </div>
    </div>
  )
}
