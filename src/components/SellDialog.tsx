'use client'

import { memo, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Package, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { Product } from '@/lib/store'
import { t } from '@/lib/translations'

interface SellDialogProps {
  product: Product
  lang: string
  currency: string
  onSell: (amount: number) => void
  onClose: () => void
}

const PORTION_SIZES = [
  { label: '0.5g', grams: 0.5 },
  { label: '1g', grams: 1 },
  { label: '2g', grams: 2 },
  { label: '3.5g (⅛ oz)', grams: 3.5 },
  { label: '5g', grams: 5 },
  { label: '7g (¼ oz)', grams: 7 },
  { label: '14g (½ oz)', grams: 14 },
  { label: '28g (1 oz)', grams: 28 },
  { label: '56g (2 oz)', grams: 56 },
  { label: '112g (¼ lb)', grams: 112 },
  { label: '224g (½ lb)', grams: 224 },
  { label: '453.6g (1 lb)', grams: 453.592 },
]

export const SellDialog = memo(function SellDialog({
  product, lang, currency, onSell, onClose,
}: SellDialogProps) {
  const [selectedPortion, setSelectedPortion] = useState<number | null>(null)
  const [customPortion, setCustomPortion] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [pricePerPortion, setPricePerPortion] = useState('')
  const [quickSellGrams, setQuickSellGrams] = useState('')
  const [quickSellPortions, setQuickSellPortions] = useState('')

  const portionGrams = selectedPortion ?? (parseFloat(customPortion) || 0)
  const numberOfPortions = portionGrams > 0 ? Math.floor(product.amount / portionGrams) : 0
  const portionPrice = parseFloat(pricePerPortion) || 0
  const totalSaleValue = numberOfPortions * portionPrice
  const profit = totalSaleValue - product.price

  const quickSellTotal = (parseFloat(quickSellGrams) || 0) * (parseInt(quickSellPortions) || 0)
  const canQuickSell = (parseFloat(quickSellGrams) || 0) > 0 && (parseInt(quickSellPortions) || 0) > 0 && quickSellTotal <= product.amount

  const handleSell = () => {
    const grams = parseFloat(quickSellGrams)
    const portions = parseInt(quickSellPortions) || 0
    const total = grams * portions
    if (grams > 0 && portions > 0 && total <= product.amount) {
      onSell(Math.round(total * 100) / 100)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <DollarSign className="size-4 inline mr-2 text-green-400" />
            {t('sell', lang)} {product.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t('amount', lang)}: {product.amount.toFixed(1)}g
            {product.price > 0 && <> &middot; {t('paid', lang)}: {currency}{product.price.toFixed(2)}</>}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div>
            <Label className="flex items-center gap-2">
              <Package className="size-4 text-primary" />
              {t('divideIntoPortions', lang)}
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PORTION_SIZES.map((p) => {
                const disabled = p.grams > product.amount
                return (
                  <Button
                    key={p.grams}
                    size="sm"
                    variant={selectedPortion === p.grams ? 'default' : 'outline'}
                    disabled={disabled}
                    onClick={() => { if (!disabled) { setSelectedPortion(p.grams); setCustomPortion(''); setShowCustom(false) } }}
                    className="text-xs"
                  >
                    {p.label}
                  </Button>
                )
              })}
              <Button
                size="sm"
                variant={showCustom ? 'default' : 'outline'}
                onClick={() => { setShowCustom(!showCustom); setSelectedPortion(null); setCustomPortion('') }}
                className="text-xs"
              >
                <Plus className="size-3 mr-1" />{t('custom', lang)}
              </Button>
            </div>
            {showCustom && (
              <div className="mt-2">
                <Input
                  type="number"
                  value={customPortion}
                  onChange={(e) => { setCustomPortion(e.target.value); setSelectedPortion(null) }}
                  placeholder={t('grams', lang)}
                  min="0"
                  step="0.1"
                />
              </div>
            )}
          </div>

          {portionGrams > 0 && (
            <div className="p-4 rounded-xl border bg-muted/50 space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="size-4 text-green-400" />
                {t('pricePerPortion', lang)}
              </Label>
              <Input
                type="number"
                value={pricePerPortion}
                onChange={(e) => setPricePerPortion(e.target.value)}
                placeholder={`${currency}0.00`}
                min="0"
                step="0.01"
              />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('portions', lang)}:</span>
                  <span className="font-bold">{numberOfPortions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('perPortion', lang)}:</span>
                  <span className="font-bold">{portionGrams.toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('saleValue', lang)}:</span>
                  <span className="font-bold">{currency}{totalSaleValue.toFixed(2)}</span>
                </div>
                {product.price > 0 && (
                  <div className="flex justify-between pt-1.5 border-t">
                    <span className="text-muted-foreground">{profit >= 0 ? t('profit', lang) : t('loss', lang)}:</span>
                    <span className={`font-bold flex items-center gap-1 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profit >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                      {profit >= 0 ? '+' : ''}{currency}{profit.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t('quickSell', lang)}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-xs text-muted-foreground">{t('gramsPerPortion', lang)}</span>
                <Input
                  type="number"
                  value={quickSellGrams}
                  onChange={(e) => setQuickSellGrams(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.1"
                  className="mt-1"
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">{t('numberOfPortions', lang)}</span>
                <Input
                  type="number"
                  value={quickSellPortions}
                  onChange={(e) => setQuickSellPortions(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('totalToSell', lang)}:</span>
                <span className="font-bold">{quickSellTotal.toFixed(1)}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('remainingAfter', lang)}:</span>
                <span className="font-bold">{Math.max(0, product.amount - quickSellTotal).toFixed(1)}g</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{t('cancel', lang)}</Button>
          <Button onClick={handleSell} disabled={!canQuickSell}>
            <DollarSign className="size-4 mr-1" />{t('sell', lang)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
