'use client'

import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Clock, Play, Pause, RotateCcw, Calculator, ArrowRight, X } from 'lucide-react'
import { Product } from '@/lib/store'
import { t } from '@/lib/translations'

interface SessionDialogProps {
  product: Product
  lang: string
  initialAmount: number
  people: number
  showTimerMs: boolean
  defaultHitTimer: number
  defaultGramsPerBowl: number
  rotationEnabled: boolean
  onFinish: (amountUsed: number, session: { hitsCount: number; people: number; notes: string; bowlsPerPerson: number; personHits: number[]; rotationEnabled: boolean }) => void
  onClose: () => void
}

export const SessionDialog = memo(function SessionDialog({
  product, lang, initialAmount, people, showTimerMs, defaultHitTimer, defaultGramsPerBowl, rotationEnabled, onFinish, onClose,
}: SessionDialogProps) {
  const [hitsCount, setHitsCount] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(defaultHitTimer)
  const [timerMs, setTimerMs] = useState(0)
  const [customTimerDuration, setCustomTimerDuration] = useState(defaultHitTimer)
  const [sessionNotes, setSessionNotes] = useState('')
  const [gramsPerBowl, setGramsPerBowl] = useState(defaultGramsPerBowl)
  const [showCalculator, setShowCalculator] = useState(false)
  const [currentPerson, setCurrentPerson] = useState(0)
  const [personHits, setPersonHits] = useState<number[]>(() => new Array(people).fill(0))

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsRef = useRef(timerSeconds)
  const msRef = useRef(timerMs)
  const customDurationRef = useRef(customTimerDuration)
  const handleHitRef = useRef<() => void>(() => {})

  secondsRef.current = timerSeconds
  msRef.current = timerMs
  customDurationRef.current = customTimerDuration

  useEffect(() => {
    setPersonHits(new Array(people).fill(0))
    setCurrentPerson(0)
  }, [people])

  const handleHit = useCallback(() => {
    setHitsCount((prev) => prev + 1)
    setPersonHits((prev) => {
      const next = [...prev]
      next[currentPerson] = (next[currentPerson] || 0) + 1
      return next
    })
    setCurrentPerson((p) => (p + 1) % people)
  }, [currentPerson, people])

  handleHitRef.current = handleHit

  useEffect(() => {
    if (!isTimerRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    const ms = showTimerMs ? 100 : 1000

    timerRef.current = setInterval(() => {
      if (showTimerMs) {
        setTimerMs((prev) => {
          const next = prev - ms
          return next <= 0 ? next + 1000 : next
        })
      }
      setTimerSeconds((prev) => {
        const next = prev - 1
        if (next <= 0) {
          setIsTimerRunning(false)
          handleHitRef.current()
          setTimerSeconds(customDurationRef.current)
          setTimerMs(0)
          return customDurationRef.current
        }
        return next
      })
    }, ms)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isTimerRunning, showTimerMs])

  const gramsPerPerson = people > 0 ? initialAmount / people : 0
  const bowlsPerPerson = gramsPerPerson / gramsPerBowl

  const handleFinish = () => {
    onFinish(initialAmount, {
      hitsCount,
      people,
      notes: sessionNotes,
      bowlsPerPerson: Math.round(bowlsPerPerson * 10) / 10,
      personHits,
      rotationEnabled,
    })
    onClose()
  }

  const resetTimer = () => {
    setTimerSeconds(customTimerDuration)
    setTimerMs(0)
    setIsTimerRunning(false)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('session', lang)}
            <span className="text-sm font-normal text-muted-foreground ml-2">{product.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* People & Stats */}
          <div className="p-3 rounded-xl bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-primary" />
                <span className="font-medium">{people} {people === 1 ? t('person', lang) : t('people', lang)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('hits', lang)}:</span>
                <span className="font-bold w-8 text-center">{hitsCount}</span>
              </div>
            </div>

            {rotationEnabled && (
              <>
                <div className="flex gap-1.5">
                  {Array.from({ length: people }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPerson(i)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        i === currentPerson
                          ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg scale-105'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      P{i + 1}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  {personHits.map((hits, i) => (
                    <div key={i} className="flex-1 text-center text-xs py-1 rounded-md bg-primary/10 text-primary">
                      {hits}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleHit}
                  className="w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <ArrowRight className="size-4" />
                  {t('nextHit', lang)} &mdash; P{(currentPerson % people) + 1}
                </button>
              </>
            )}

            {!rotationEnabled && (
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => setHitsCount(Math.max(0, hitsCount - 1))}>-</Button>
                <Button size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => setHitsCount(hitsCount + 1)}>+</Button>
              </div>
            )}
          </div>

          {/* Bowl Calculator */}
          <div className="rounded-xl border overflow-hidden">
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calculator className="size-5 text-green-400" />
                <span className="font-medium">{t('bowlCalculator', lang)}</span>
              </div>
              <span className="text-lg font-bold text-green-400">{bowlsPerPerson.toFixed(1)} {t('bowlsPerPerson', lang)}</span>
            </button>

            {showCalculator && (
              <div className="p-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('gramsPerBowl', lang)}</span>
                  <Input
                    type="number"
                    min="0.01"
                    max="5"
                    step="0.05"
                    value={gramsPerBowl}
                    onChange={(e) => setGramsPerBowl(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-20 text-center text-sm font-bold h-8"
                  />
                </div>
                <div className="p-3 rounded-lg bg-muted/50 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('amount', lang)}:</span>
                    <span className="font-bold">{initialAmount.toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('people', lang)}:</span>
                    <span className="font-bold">{people}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('gramsPerPerson', lang)}:</span>
                      <span className="font-bold text-primary">{gramsPerPerson.toFixed(2)}g</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('totalBowls', lang)}:</span>
                    <span className="font-bold">{(initialAmount / gramsPerBowl).toFixed(1)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{t('bowlsPerPerson', lang)}:</span>
                      <span className="text-xl font-bold text-green-400">{bowlsPerPerson.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="p-4 rounded-xl border bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-amber-400" />
                <span className="font-medium">{t('hitTimer', lang)}</span>
              </div>
              <div className="flex items-center gap-2">
                {!isTimerRunning && (
                  <div className="flex items-center gap-1 mr-2">
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 rounded text-xs" onClick={() => setCustomTimerDuration(Math.max(1, customTimerDuration - 5))}>-</Button>
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={customTimerDuration}
                      onChange={(e) => setCustomTimerDuration(parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-xs font-bold h-6"
                    />
                    <span className="text-xs text-muted-foreground">s</span>
                    <Button size="sm" variant="outline" className="h-6 w-6 p-0 rounded text-xs" onClick={() => setCustomTimerDuration(customTimerDuration + 5)}>+</Button>
                  </div>
                )}
                <div className={`text-2xl font-mono font-bold ${timerSeconds <= 3 ? 'text-red-400' : ''}`}>
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  {showTimerMs && <span className="text-sm opacity-60">.{Math.floor(timerMs / 100)}</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isTimerRunning ? (
                <Button
                  onClick={() => { setTimerSeconds(customTimerDuration); setTimerMs(0); setIsTimerRunning(true) }}
                  className="flex-1"
                  variant="outline"
                >
                  <Play className="size-4 mr-1" />{t('start', lang)}
                </Button>
              ) : (
                <Button
                  onClick={() => setIsTimerRunning(false)}
                  className="flex-1"
                  variant="outline"
                >
                  <Pause className="size-4 mr-1" />{t('pause', lang)}
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={resetTimer}><RotateCcw className="size-4" /></Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>{t('sessionNotes', lang)}</Label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder={t('sessionNotesPlaceholder', lang)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 transition-colors resize-none bg-background border-input text-foreground placeholder:text-muted-foreground/50 focus:border-primary outline-none mt-2"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t('cancel', lang)}</Button>
          <Button onClick={handleFinish}>{t('finishSession', lang)}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
