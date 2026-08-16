import { useState, useRef } from 'react';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { useSettings } from '../utils/useSettings';
import type { MarketplaceListing, Product, PriceOption, ContactEntry } from '../types';
import { CONTACT_PLATFORMS, MARKETPLACE_CATEGORIES } from '../types';
import { uploadListingImages } from '../utils/supabase';
import { t } from '../utils/translations';
import { Modal, Group, Stack, TextInput, Textarea, NumberInput, Select, Button, ActionIcon, Paper, Divider, Box, Text, ScrollArea, Image } from '@mantine/core';
import { IconCamera, IconTag, IconCurrencyDollar, IconPlus, IconTrash, IconX, IconScale } from '@tabler/icons-react';

interface CreateListingModalProps {
  isDark: boolean;
  lang: string;
  products: Product[];
  currentUserId: string;
  initial?: MarketplaceListing;
  onSubmit: (data: Partial<MarketplaceListing>) => Promise<void>;
  onClose: () => void;
}

export function CreateListingModal({ isDark, lang, products, currentUserId, initial, onSubmit, onClose }: CreateListingModalProps) {
  const { settings } = useSettings();
  const { isVisible, handleClose } = useModalAnimation(onClose);
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial?.price?.toString() || '');
  const [priceOptions, setPriceOptions] = useState<PriceOption[]>(initial?.price_options || []);
  const [category, setCategory] = useState(initial?.category || '');
  const defaultContact = settings.profile?.contacts?.[0];
  const initialContacts = initial?.contacts?.length
    ? initial.contacts
    : initial?.contact_platform
      ? [{ platform: initial.contact_platform, value: initial.contact_value }]
      : defaultContact
        ? [{ platform: defaultContact.platform, value: defaultContact.value }]
        : [{ platform: 'email', value: '' }];
  const [contacts, setContacts] = useState<ContactEntry[]>(initialContacts);
  const [linkedProductId, setLinkedProductId] = useState(initial?.product_id || '');
  const [existingImages, setExistingImages] = useState<string[]>(initial?.images || (initial?.image_url ? [initial.image_url] : []));
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const linkedProduct = products.find(p => p.id === linkedProductId);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...newImageFiles, ...files];
    setNewImageFiles(newFiles);
    const previews = files.map(f => URL.createObjectURL(f));
    setNewImagePreviews(prev => [...prev, ...previews]);
    e.target.value = '';
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  function removeExistingImage(index: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !price.trim()) return;
    setSubmitting(true);
    try {
      let allImages = [...existingImages];
      if (newImageFiles.length > 0) {
        const uploaded = await uploadListingImages(currentUserId, newImageFiles);
        allImages = [...allImages, ...uploaded];
      }
      newImagePreviews.forEach(p => URL.revokeObjectURL(p));
      const finalPriceOptions = priceOptions.length > 0 ? priceOptions : undefined;
      const validContacts = contacts.filter(c => c.platform && c.value.trim());
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        price: priceOptions.length > 0 ? priceOptions[0].price : parseFloat(price),
        price_options: finalPriceOptions,
        category: category || undefined,
        contact_platform: validContacts[0]?.platform || 'email',
        contact_value: validContacts[0]?.value.trim() || '',
        contacts: validContacts,
        product_id: linkedProductId || undefined,
        product_name: linkedProduct?.name || undefined,
        image_url: allImages[0] || undefined,
        images: allImages.length > 0 ? allImages : undefined,
      });
      handleClose();
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting && !!title.trim() && contacts.some(c => c.value.trim()) && (priceOptions.length === 0 ? !!price.trim() : !priceOptions.some(o => !o.amount || !o.price));

  const dimColor = isDark ? 'var(--mantine-color-slate-4)' : 'var(--mantine-color-gray-6)';

  return (
    <Modal
      opened={isVisible}
      onClose={handleClose}
      size="lg"
      centered
      radius="lg"
      closeOnEscape={false}
      aria-label={initial ? t('editListing', lang) : t('createListing', lang)}
      styles={{ content: { display: 'flex', flexDirection: 'column', maxHeight: '90vh' }, body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Text fw={700} size="lg" p="lg" pb="sm">{initial ? t('editListing', lang) : t('createListing', lang)}</Text>
        <Box p="lg" pt="xs" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          <Stack gap="md">
            <Box>
              <Text fw={500} size="xs" mb={6}>{t('listingImage', lang)}</Text>
              <Group gap={6} align="flex-start">
                {existingImages.map((url, i) => (
                  <Box key={`e-${i}`} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden' }}>
                    <Image src={url} alt="" w={64} h={64} fit="cover" />
                    <ActionIcon size="xs" radius="xl" color="red" onClick={() => removeExistingImage(i)} aria-label="Remove image" style={{ position: 'absolute', top: 2, right: 2 }}>
                      <IconX size={12} />
                    </ActionIcon>
                  </Box>
                ))}
                {newImagePreviews.map((preview, i) => (
                  <Box key={`n-${i}`} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden' }}>
                    <Image src={preview} alt="" w={64} h={64} fit="cover" />
                    <ActionIcon size="sm" radius="sm" color="red" onClick={() => removeNewImage(i)} aria-label="Remove image" style={{ position: 'absolute', top: 2, right: 2 }}>
                      <IconX size={12} />
                    </ActionIcon>
                  </Box>
                ))}
                {(existingImages.length + newImagePreviews.length) < 9 && (
                  <Button
                    variant="default"
                    w={64} h={64} p={0}
                    style={{ borderStyle: 'dashed', color: dimColor, flexDirection: 'column', gap: 2 }}
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Upload image"
                  >
                    <IconCamera size={16} />
                    <Text size="8" style={{ fontSize: 8 }}>{t('uploadPicture', lang)}</Text>
                  </Button>
                )}
              </Group>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
            </Box>

            <TextInput
              id="listing-title"
              name="title"
              value={title}
              onChange={e => setTitle(e.currentTarget.value)}
              label={t('listingTitle', lang)}
              required
            />

            <Textarea
              id="listing-desc"
              name="description"
              value={description}
              onChange={e => setDescription(e.currentTarget.value)}
              label={t('listingDescription', lang)}
              minRows={2}
            />

            <Box>
              <Text fw={500} size="xs" mb={6}>Pricing</Text>

              {priceOptions.length === 0 ? (
                <NumberInput
                  id="listing-price"
                  name="price"
                  value={price === '' ? '' : parseFloat(price)}
                  onChange={(v) => setPrice(v === '' ? '' : String(typeof v === 'number' ? v : parseFloat(v) || 0))}
                  required
                  min={0} step={0.01} decimalScale={2}
                  mb="sm"
                  leftSection={<IconCurrencyDollar size={14} />}
                />
              ) : (
                <Stack gap={6} mb="sm">
                  {priceOptions.map((opt, i) => (
                    <Group key={i} gap={6} align="center">
                      <NumberInput
                        flex={1}
                        value={opt.amount || ''}
                        onChange={(v) => {
                          const newOpts = [...priceOptions];
                          newOpts[i] = { ...newOpts[i], amount: typeof v === 'number' ? v : parseFloat(v) || 0 };
                          setPriceOptions(newOpts);
                        }}
                        placeholder="Amount"
                        min={0} step={0.1}
                        size="xs"
                        leftSection={<IconScale size={14} />}
                        rightSection={<Text size="xs" c="dimmed">g</Text>}
                      />
                      <NumberInput
                        flex={1.5}
                        value={opt.price || ''}
                        onChange={(v) => {
                          const newOpts = [...priceOptions];
                          newOpts[i] = { ...newOpts[i], price: typeof v === 'number' ? v : parseFloat(v) || 0 };
                          setPriceOptions(newOpts);
                        }}
                        placeholder="Price"
                        min={0} step={0.01}
                        size="xs"
                        leftSection={<IconCurrencyDollar size={14} />}
                      />
                      <ActionIcon variant="subtle" color="red" onClick={() => setPriceOptions(prev => prev.filter((_, j) => j !== i))} aria-label="Remove weight option">
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              )}

              <Group gap="sm">
                {priceOptions.length > 0 && (
                  <Button variant="subtle" size="xs" p={0} autoContrast onClick={() => setPriceOptions([])} styles={{ root: { color: dimColor, height: 'auto' } }}>
                    Use single price
                  </Button>
                )}
                <Button
                  size="xs" variant="light" color="cyan" leftSection={<IconPlus size={14} />}
                  onClick={() => setPriceOptions(prev => [...prev, { amount: 0, price: 0 }])}
                  styles={{ root: { height: 'auto', padding: '6px 10px' } }}
                >
                  Add weight
                </Button>
              </Group>
            </Box>

            <Select
              id="listing-category"
              name="category"
              value={category || null}
              onChange={(v) => setCategory(v || '')}
              label={t('listingCategory', lang)}
              placeholder={`${t('listingCategory', lang)}...`}
              data={MARKETPLACE_CATEGORIES}
              searchable
              clearable
              nothingFoundMessage="No options"
            />

            <Box>
              <Text fw={500} size="xs" mb={6}>{t('contactInfo', lang)}</Text>
              <Stack gap={6}>
                {contacts.map((contact, i) => (
                  <Group key={i} gap={6} align="center">
                    <Select
                      value={contact.platform}
                      onChange={(v) => {
                        if (!v) return;
                        const next = [...contacts];
                        next[i] = { ...next[i], platform: v };
                        setContacts(next);
                      }}
                      data={CONTACT_PLATFORMS}
                      size="xs"
                      style={{ width: 110, flexShrink: 0 }}
                    />
                    <TextInput
                      flex={1}
                      value={contact.value}
                      onChange={e => {
                        const next = [...contacts];
                        next[i] = { ...next[i], value: e.currentTarget.value };
                        setContacts(next);
                      }}
                      placeholder={contact.platform === 'email' ? 'user@example.com' : contact.platform === 'phone' ? '+1 555 0000' : '@username'}
                      size="xs"
                    />
                    {contacts.length > 1 && (
                      <ActionIcon size="md" variant="subtle" color="red" onClick={() => setContacts(prev => prev.filter((_, j) => j !== i))} aria-label="Remove contact">
                        <IconTrash size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}
              </Stack>
              {contacts.length < 5 && (
                <Button
                  size="xs" mt={6} variant="light" color="cyan" leftSection={<IconPlus size={14} />}
                  onClick={() => setContacts(prev => [...prev, { platform: 'email', value: '' }])}
                  style={{ height: 'auto', padding: '6px 10px' }}
                >
                  Add contact
                </Button>
              )}
            </Box>

            <Box>
              <Text fw={500} size="xs" mb={6}>{t('linkProduct', lang)}</Text>
              {linkedProduct ? (
                <Paper withBorder radius="md" bg={isDark ? 'var(--mantine-color-slate-8)' : undefined} p="xs" px="sm">
                  <Group gap="sm">
                    <IconTag size={14} style={{ color: dimColor, flexShrink: 0 }} />
                    <Text size="sm" fw={500} flex={1}>{linkedProduct.name}</Text>
                    <Button
                      variant="subtle" size="xs" p={0} color="red"
                      onClick={() => { setLinkedProductId(''); setShowProductPicker(false); }}
                      style={{ height: 'auto' }}
                    >
                      {t('removeProduct', lang)}
                    </Button>
                  </Group>
                </Paper>
              ) : (
                <Box>
                  <Button
                    variant="default" fullWidth
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    styles={{ root: { color: dimColor, justifyContent: 'flex-start' } }}
                  >
                    {t('linkProduct', lang)}...
                  </Button>
                  {showProductPicker && (
                    <ScrollArea.Autosize mah={144} style={{ marginTop: 6, border: `1px solid var(--mantine-color-default-border)`, borderRadius: 8 }}>
                      <Stack gap={0}>
                        {products.map(p => (
                          <Button
                            key={p.id}
                            variant="subtle" h="auto" p="xs" px="sm" fullWidth
                            onClick={() => { setLinkedProductId(p.id); setShowProductPicker(false); }}
                            style={{ justifyContent: 'flex-start', fontWeight: 400 }}
                          >
                            {p.name}
                          </Button>
                        ))}
                      </Stack>
                    </ScrollArea.Autosize>
                  )}
                </Box>
              )}
            </Box>

            <Divider />

            <Button
              type="submit"
              fullWidth
              size="md"
              loading={submitting}
              disabled={!canSubmit}
              className="bg-gradient-to-r from-cyan-700 to-emerald-700"
              styles={{ root: { boxShadow: '0 10px 20px rgba(0,0,0,0.35)' } }}
            >
              {submitting ? '...' : initial ? t('editListing', lang) : t('createListing', lang)}
            </Button>
          </Stack>
        </Box>
      </form>
    </Modal>
  );
}