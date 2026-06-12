'use client'

import { memo, useState, useRef, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Leaf, Upload, Camera, Star, Heart, Plus, ChevronDown, X } from 'lucide-react'
import { Product } from '@/lib/store'
import { t } from '@/lib/translations'
import { gramsToOz } from '@/lib/convert'

interface ProductDialogProps {
  product: Product | null
  lang: string
  favoriteBrands: string[]
  recentBrands: string[]
  onSave: (data: Partial<Product> & { name: string }) => void
  onDelete?: () => void
  onClose: () => void
}

const TYPE_COLORS: Record<string, string> = {
  indica: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  sativa: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  hybrid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

export const ProductDialog = memo(function ProductDialog({
  product, lang, favoriteBrands, recentBrands, onSave, onDelete, onClose,
}: ProductDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const brandDropdownRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState(product?.name || '')
  const [strain, setStrain] = useState(product?.strain || '')
  const [type, setType] = useState(product?.type || 'hybrid')
  const [showCustomType, setShowCustomType] = useState(false)
  const [thc, setThc] = useState(product?.thc ?? 0)
  const [cbd, setCbd] = useState(product?.cbd ?? 0)
  const [amount, setAmount] = useState(product?.amount ?? 0)
  const [price, setPrice] = useState(product?.price ?? 0)
  const [picture, setPicture] = useState(product?.picture || '')
  const [notes, setNotes] = useState(product?.notes || '')
  const [rating, setRating] = useState(product?.rating ?? 0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [brand, setBrand] = useState(product?.brand || '')
  const [tags, setTags] = useState(product?.tags || '')
  const [effects, setEffects] = useState(product?.effects || '')
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false)
  const [brandSearchQuery, setBrandSearchQuery] = useState('')
  const [showOz, setShowOz] = useState(false)

  const POPULAR_BRANDS = [
    'Cookies', 'Runtz', 'Connected', 'Gelato', 'Blue Dream',
    'OG Kush', 'Sour Diesel', 'Purple Haze', 'Wedding Cake',
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPicture(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleBrandSelect = (selectedBrand: string) => {
    setBrand(selectedBrand)
    setIsBrandDropdownOpen(false)
    setBrandSearchQuery('')
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      strain: strain || name.trim(),
      type,
      thc,
      cbd,
      amount,
      price,
      picture: picture || null,
      notes,
      rating,
      brand: brand || null,
      tags,
      effects,
    })
  }

  const allBrands = [...new Set([...favoriteBrands, ...recentBrands, ...POPULAR_BRANDS])]
  const filteredBrands = allBrands.filter((b) =>
    b.toLowerCase().includes(brandSearchQuery.toLowerCase())
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <Leaf className="size-4 inline mr-2 text-muted-foreground/30" />
            {product ? t('editProduct', lang) : t('addProduct', lang)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {picture ? (
                <div className="w-20 h-20 rounded-xl overflow-hidden border">
                  <img src={picture} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/50"
                >
                  <Camera className="size-8 text-muted-foreground/50" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureUpload} className="hidden" />
            </div>
            <div className="flex-1">
              <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4 mr-2" />
                {picture ? t('changePicture', lang) : t('uploadPicture', lang)}
              </Button>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label>{t('strainName', lang)} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('strainNamePlaceholder', lang)}
              className="mt-1.5"
            />
          </div>

          {/* Strain */}
          <div>
            <Label>Strain</Label>
            <Input
              value={strain}
              onChange={(e) => setStrain(e.target.value)}
              placeholder={t('strainNamePlaceholder', lang)}
              className="mt-1.5"
            />
          </div>

          {/* Brand Dropdown */}
          <div ref={brandDropdownRef}>
            <Label>{t('brandDispensary', lang)}</Label>
            <div className="relative mt-1.5">
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="w-full px-4 py-3 rounded-xl border-2 transition-colors text-left flex items-center justify-between bg-background border-input text-foreground outline-none hover:border-primary/50"
              >
                <span className={brand ? '' : 'text-muted-foreground'}>
                  {brand || t('selectBrand', lang)}
                </span>
                <ChevronDown className={`size-4 transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBrandDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border-2 shadow-xl z-10 max-h-60 overflow-y-auto bg-popover border-border">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      value={brandSearchQuery}
                      onChange={(e) => setBrandSearchQuery(e.target.value)}
                      placeholder={t('searchBrands', lang)}
                      className="h-9 text-sm"
                    />
                  </div>

                  {filteredBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => handleBrandSelect(b)}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors hover:bg-accent ${
                        brand === b ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <span>{b}</span>
                      <div className="flex items-center gap-1">
                        {favoriteBrands.includes(b) && (
                          <Heart className="size-3 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                    </button>
                  ))}

                  {brandSearchQuery && !filteredBrands.some(b => b.toLowerCase() === brandSearchQuery.toLowerCase()) && (
                    <button
                      onClick={() => handleBrandSelect(brandSearchQuery)}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 text-primary hover:bg-accent"
                    >
                      <Plus className="size-4" />
                      {t('addBrand', lang).replace('{query}', brandSearchQuery)}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Type */}
          <div>
            <Label>{t('strainType', lang)}</Label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {(['indica', 'sativa', 'hybrid'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setType(t); setShowCustomType(false) }}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border-2 capitalize ${
                    type === t && !showCustomType
                      ? (TYPE_COLORS[t] || '') + ' border-current'
                      : 'bg-muted border-input text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => { setShowCustomType(!showCustomType); if (!showCustomType) setType('') }}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all border-2 flex items-center justify-center gap-1 ${
                  showCustomType ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted border-input text-muted-foreground hover:border-primary/50'
                }`}
              >
                <Plus className="size-3.5" /><span>{t('custom', lang)}</span>
              </button>
            </div>
            {showCustomType && (
              <Input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder={t('customStrainPlaceholder', lang)}
                className="mt-2"
              />
            )}
          </div>

          {/* THC & CBD */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('thcPercent', lang)}</Label>
              <Input type="number" step="0.1" min="0" max="100" value={thc} onChange={(e) => setThc(parseFloat(e.target.value) || 0)} placeholder="0.0" className="mt-1.5" />
            </div>
            <div>
              <Label>{t('cbdPercent', lang)}</Label>
              <Input type="number" step="0.1" min="0" max="100" value={cbd} onChange={(e) => setCbd(parseFloat(e.target.value) || 0)} placeholder="0.0" className="mt-1.5" />
            </div>
          </div>

          {/* Amount & Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1">{t('amountGrams', lang)} <button type="button" onClick={() => setShowOz(!showOz)} className="text-xs text-muted-foreground hover:text-primary">{showOz ? 'g' : 'oz'}</button></Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={showOz ? parseFloat(gramsToOz(amount)) : amount}
                onChange={(e) => setAmount(showOz ? parseFloat(e.target.value) * 28.3495 : (parseFloat(e.target.value) || 0))}
                placeholder={t('amountPlaceholder', lang)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>{t('priceLabel', lang)}</Label>
              <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} placeholder="0.00" className="mt-1.5" />
            </div>
          </div>

          {/* Rating */}
          <div>
            <Label>{t('rating', lang)}</Label>
            <div className="flex items-center gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const fillPercent = (hoveredStar || rating) >= star ? 100 : (hoveredStar || rating) >= star - 0.5 ? 50 : 0
                return (
                  <div key={star} className="relative flex">
                    <button type="button" onClick={() => setRating(star - 0.5)} onMouseEnter={() => setHoveredStar(star - 0.5)} onMouseLeave={() => setHoveredStar(0)} className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-pointer" />
                    <button type="button" onClick={() => setRating(star)} onMouseEnter={() => setHoveredStar(star)} onMouseLeave={() => setHoveredStar(0)} className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-pointer" />
                    <div className="relative w-7 h-7 pointer-events-none">
                      <Star className="size-7 absolute inset-0 text-muted-foreground/30" />
                      <div className="absolute inset-0 overflow-hidden transition-all" style={{ width: `${fillPercent}%` }}>
                        <Star className="size-7 text-amber-400 fill-amber-400" />
                      </div>
                    </div>
                  </div>
                )
              })}
              {(hoveredStar || rating) > 0 && (
                <span className="ml-2 text-sm font-medium text-muted-foreground">{(hoveredStar || rating)}/5</span>
              )}
            </div>
          </div>

          {/* Tags & Effects */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{t('tags', lang)}</Label>
              <Input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., fruity, pine" className="mt-1.5" />
            </div>
            <div>
              <Label>{t('effects', lang)}</Label>
              <Input type="text" value={effects} onChange={(e) => setEffects(e.target.value)} placeholder="e.g., relaxed, happy" className="mt-1.5" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>{t('notesLabel', lang)}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('notesPlaceholder', lang)} rows={3} className="mt-1.5" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          {product && onDelete && (
            <Button variant="destructive" onClick={onDelete}>{t('delete', lang)}</Button>
          )}
          <Button variant="outline" onClick={onClose}>{t('cancel', lang)}</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {product ? t('save', lang) : t('addProduct', lang)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
