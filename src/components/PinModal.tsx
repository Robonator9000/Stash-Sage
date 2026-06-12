'use client'

import { useState, useRef, useEffect } from 'react'
import { hashPin } from '@/lib/crypto'
import { Lock } from 'lucide-react'

interface PinModalProps {
  pinHash: string
  onSuccess: () => void
}

export function PinModal({ pinHash, onSuccess }: PinModalProps) {
  const [pinValue, setPinValue] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async () => {
    if (isVerifying) return
    setIsVerifying(true)
    try {
      const hash = await hashPin(pinValue)
      if (hash === pinHash) {
        onSuccess()
      } else {
        setError('Incorrect PIN')
        setPinValue('')
      }
    } catch {
      setError('Incorrect PIN')
      setPinValue('')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border-2 shadow-2xl p-6 bg-card border-border">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-primary/20">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Enter your PIN to unlock</h2>
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pinValue}
          onChange={(e) => {
            setPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))
            setError('')
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="• • • • • •"
          className="w-full px-4 py-4 rounded-xl border-2 text-center text-2xl tracking-[0.5em] font-mono outline-none mb-4 bg-muted border-border text-foreground focus:border-primary placeholder:text-muted-foreground/50"
        />

        {error && (
          <p className="text-sm font-medium text-center mb-4 text-destructive">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={pinValue.length < 4 || isVerifying}
          className={`w-full py-3 rounded-xl font-bold transition-all ${
            pinValue.length >= 4 && !isVerifying
              ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-400 hover:to-emerald-400'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isVerifying ? '...' : 'Unlock'}
        </button>
      </div>
    </div>
  )
}
