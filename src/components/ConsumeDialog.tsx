'use client'

import { memo, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Flame, Users, Minus, Plus } from 'lucide-react'
import { Product } from '@/lib/store'
import { t } from '@/lib/translations'

interface ConsumeDialogProps {
  product: Product
  lang: string
  onConsume: (amount: number, startSession: boolean, people: number) => void
  onClose: () => void
}

const QUICK_AMOUNTS = [0.1, 0.25, 0.5, 1, 2]

export const ConsumeDialog = memo(function ConsumeDialog({
  product, lang, onConsume, onClose,
}: ConsumeDialogProps) {
  const [amount, setAmount] = useState(0.5)
  const [startSession, setStartSession] = useState(false)
  const [people, setPeople] = useState(2)

  const handleSubmit = () => {
    if (amount <= 0) return
    onConsume(amount, startSession, people)
  }

  const adjustAmount = (delta: number) => {
    setAmount(prev => Math.max(0.01, Math.round((prev + delta) * 100) / 100))
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <Flame className="size-4 inline mr-2 text-teal-400" />
            {t('consume', lang)} {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>{t('amount', lang)} ({t('grams', lang)})</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl shrink-0" onClick={() => adjustAmount(-0.1)}>
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                min="0"
                step="0.1"
                className="text-center font-bold text-lg h-10"
              />
              <Button size="icon" className="h-10 w-10 rounded-xl shrink-0" onClick={() => adjustAmount(0.1)}>
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              {QUICK_AMOUNTS.map((amt) => (
                <Button key={amt} size="sm" variant="outline" className="flex-1 text-xs" onClick={() => adjustAmount(amt)}>
                  +{amt}g
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-primary" />
              <div>
                <span className="font-medium text-sm">{t('session', lang)}</span>
                <p className="text-xs text-muted-foreground">{t('sessionDefaults', lang)}</p>
              </div>
            </div>
            <Switch checked={startSession} onCheckedChange={setStartSession} />
          </div>

          {startSession && (
            <div>
              <Label><Users className="size-4 inline mr-1" />{t('people', lang)}</Label>
              <div className="flex items-center gap-2 mt-2">
                <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl" onClick={() => setPeople(Math.max(1, people - 1))}>
                  <Minus className="size-4" />
                </Button>
                <span className="flex-1 text-center text-xl font-bold">{people}</span>
                <Button size="icon" className="h-10 w-10 rounded-xl" onClick={() => setPeople(people + 1)}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('amount', lang)}:</span>
              <span className="font-bold">{Math.max(0, product.amount - amount).toFixed(1)}g</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t('cancel', lang)}</Button>
          <Button onClick={handleSubmit} disabled={amount <= 0}>
            {startSession ? t('session', lang) : t('consume', lang)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
