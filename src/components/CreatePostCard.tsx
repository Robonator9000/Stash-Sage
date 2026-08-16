import { useState, useRef, useEffect } from 'react';
import type { Product } from '../types';
import { t } from '../utils/translations';
import { MAX_UPLOAD_MB } from '../utils/supabase';
import { showToast } from './Toast';
import { Paper, Text, Group, Textarea, Button, Avatar, ActionIcon, Loader, UnstyledButton, Box } from '@mantine/core';
import { IconPhoto, IconLink, IconBuildingStore, IconX } from '@tabler/icons-react';

interface CreatePostCardProps {
  isDark: boolean;
  lang: string;
  displayName: string;
  currentUserId: string;
  products: Product[];
  avatarUrl?: string;
  onSubmit: (content: string, productId?: string, productName?: string, imageFiles?: File[]) => Promise<void>;
  onViewProfile?: (userId: string) => void;
}

const MAX_CHARS = 500;
const MAX_IMAGES = 4;

const avatarGradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';

export function CreatePostCard({ isDark, lang, displayName, currentUserId, products, avatarUrl, onSubmit, onViewProfile }: CreatePostCardProps) {
  const [content, setContent] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [content]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowProductPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    return () => { imagePreviews.forEach(u => URL.revokeObjectURL(u)); };
  }, [imagePreviews]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    if (toAdd.length === 0) return;
    const accepted = toAdd.filter(f => {
      if (f.type.startsWith('image/')) return true;
      showToast({ id: 'img-type', title: '', body: t('invalidImageType', lang) });
      return false;
    }).filter(f => {
      if (f.size <= MAX_UPLOAD_MB * 1024 * 1024) return true;
      showToast({ id: 'img-size', title: '', body: t('fileTooLarge', lang).replace('{n}', String(MAX_UPLOAD_MB)) });
      return false;
    });
    if (accepted.length === 0) { if (fileInputRef.current) fileInputRef.current.value = ''; return; }
    const newFiles = [...imageFiles, ...accepted];
    const newPreviews = [...imagePreviews, ...accepted.map(f => URL.createObjectURL(f))];
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed, selectedProduct?.id, selectedProduct?.name, imageFiles.length > 0 ? imageFiles : undefined);
      setContent('');
      setSelectedProduct(null);
      imagePreviews.forEach(u => URL.revokeObjectURL(u));
      setImageFiles([]);
      setImagePreviews([]);
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = MAX_CHARS - content.length;
  const isValid = content.trim().length > 0;

  const mutedColor = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';

  return (
    <Paper p="md" radius="md" withBorder style={{ background: isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <UnstyledButton onClick={() => onViewProfile?.(currentUserId)} style={{ flexShrink: 0 }}>
          <Avatar size={36} radius="md" src={avatarUrl} style={{ backgroundImage: avatarGradient }}>
            {(displayName[0] || '?').toUpperCase()}
          </Avatar>
        </UnstyledButton>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <UnstyledButton onClick={() => onViewProfile?.(currentUserId)}>
            <Text size="sm" fw={600} mb={2} className="hover:underline" style={{ color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)' }}>
              {displayName}
            </Text>
          </UnstyledButton>
          <Textarea
            ref={textareaRef}
            id="post-content"
            name="post-content"
            aria-label="Post content"
            value={content}
            onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
            placeholder={t('postPlaceholder', lang)}
            minRows={1}
            maxLength={MAX_CHARS}
            variant="unstyled"
            style={{ background: 'transparent' }}
          />

          {selectedProduct && (
            <Group gap={6} mt="xs" align="center" style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 'var(--mantine-radius-md)', fontSize: 12, fontWeight: 500, background: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-cyan-1)', color: isDark ? 'var(--mantine-color-cyan-4)' : 'var(--mantine-color-cyan-7)' }}>
              <IconBuildingStore size={14} />
              <Text size="xs" fw={500}>{selectedProduct.name}</Text>
              <UnstyledButton onClick={() => setSelectedProduct(null)} aria-label="Remove linked product" style={{ marginLeft: 4 }}>
                <IconX size={12} />
              </UnstyledButton>
            </Group>
          )}

          {imagePreviews.length > 0 && (
            <Group gap="sm" mt="xs" wrap="wrap">
              {imagePreviews.map((url, i) => (
                <Box key={i} pos="relative" w={64} h={64} style={{ overflow: 'hidden', borderRadius: 'var(--mantine-radius-md)' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <ActionIcon
                    variant="transparent"
                    onClick={() => removeImage(i)}
                    aria-label={`Remove image ${i + 1}`}
                    size={20}
                    radius="xl"
                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: 'white' }}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Box>
              ))}
            </Group>
          )}

          <Group justify="space-between" mt="sm" pt="sm" style={{ borderTop: `1px solid ${isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)'}` }}>
            <Group gap={4}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <UnstyledButton
                onClick={() => fileInputRef.current?.click()}
                aria-label="Add images"
                disabled={imageFiles.length >= MAX_IMAGES}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 'var(--mantine-radius-md)',
                  fontSize: 12, fontWeight: 500, color: imageFiles.length >= MAX_IMAGES ? (isDark ? 'var(--mantine-color-gray-7)' : 'var(--mantine-color-gray-4)') : mutedColor,
                  cursor: imageFiles.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
                }}
              >
                <IconPhoto size={16} />
                {t('addImages', lang)}
                {imageFiles.length > 0 && (
                  <Text size="xs" c="dimmed">{imageFiles.length}/{MAX_IMAGES}</Text>
                )}
              </UnstyledButton>

              <Box ref={pickerRef} style={{ position: 'relative' }}>
                <UnstyledButton
                  onClick={() => setShowProductPicker(!showProductPicker)}
                  aria-label="Toggle product picker"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 'var(--mantine-radius-md)', fontSize: 12, fontWeight: 500, color: mutedColor }}
                >
                  <IconLink size={16} />
                  {t('linkProduct', lang)}
                </UnstyledButton>

                {showProductPicker && products.length > 0 && (
                  <Box
                    style={{
                      position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, width: 224, maxHeight: 192,
                      overflowY: 'auto', borderRadius: 'var(--mantine-radius-md)', boxShadow: 'var(--mantine-shadow-lg)',
                      background: isDark ? 'var(--mantine-color-dark-7)' : 'white',
                      border: `1px solid ${isDark ? 'var(--mantine-color-gray-8)' : 'var(--mantine-color-gray-2)'}`,
                      zIndex: 10,
                    }}
                  >
                    {products.map(p => (
                      <UnstyledButton
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); setShowProductPicker(false); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 14,
                          background: selectedProduct?.id === p.id ? (isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-1)') : 'transparent',
                          color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-gray-8)',
                        }}
                      >
                        <Text fw={500} size="sm" component="span">{p.name}</Text>
                        <Text size="xs" c="dimmed" component="span" ml="sm">{p.strain}</Text>
                      </UnstyledButton>
                    ))}
                  </Box>
                )}
              </Box>
            </Group>

            <Group gap="sm" align="center">
              <Text size="xs" style={{ color: remaining < 50 ? 'var(--mantine-color-orange-6)' : mutedColor }}>
                {remaining}
              </Text>
              <Button
                variant="gradient"
                gradient={{ from: 'cyan.7', to: 'emerald.7' }}
                onClick={handleSubmit}
                disabled={!isValid || submitting}
              >
                {submitting ? <Loader size={16} /> : t('postButton', lang)}
              </Button>
            </Group>
          </Group>
        </Box>
      </Group>
    </Paper>
  );
}