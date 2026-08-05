import { useState, useEffect } from 'react';
import type { Product } from '../types';
import { supabase } from '../utils/supabase';
import { t } from '../utils/translations';
import { IconChevronLeft, IconStar, IconScale, IconFlask2, IconNote, IconCalendar, IconTag } from '@tabler/icons-react';
import { Paper, Group, Stack, Text, Badge, Loader, Box, UnstyledButton } from '@mantine/core';

interface ProductViewProps {
  productId: string;
  onClose: () => void;
  isDark: boolean;
  lang: string;
}

export function ProductView({ productId, onClose, isDark, lang }: ProductViewProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    supabase.from('products').select('*').eq('id', productId).single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError(true);
        } else {
          const pictures: string[] = data.pictures || (data.picture ? [data.picture] : []);
          setProduct({
            id: data.id,
            name: data.name || '',
            strain: data.strain || '',
            type: data.type || '',
            thc: data.thc || 0,
            cbd: data.cbd || 0,
            amount: data.amount || 0,
            price: data.price || 0,
            picture: data.picture || '',
            pictures,
            notes: data.notes || '',
            rating: data.rating || 0,
            brand: data.brand || '',
            tags: data.tags || '',
            effects: data.effects || '',
            consumptionCount: data.consumptionCount || 0,
            lastConsumed: data.lastconsumed ? new Date(data.lastconsumed) : undefined,
            purchasedAt: data.purchasedAt ? new Date(data.purchasedAt) : undefined,
            createdAt: new Date(data.createdat),
            updatedAt: new Date(data.updatedat),
            favorite: data.favorite || false,
          });
        }
        setLoading(false);
      });
  }, [productId]);

  const allImages = product?.pictures?.filter(Boolean) || (product?.picture ? [product.picture] : []);

  const mutedText = isDark ? 'var(--mantine-color-dark-3)' : 'var(--mantine-color-gray-5)';
  const primaryText = isDark ? 'var(--mantine-color-dark-0)' : 'var(--mantine-color-gray-9)';
  const statBg = isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-0)';

  return (
    <Box style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column' }} onClick={onClose}>
      <Box onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, maxWidth: 768, width: '100%', margin: '0 auto' }}>
        <Group justify="space-between" px="md" py="sm" style={{ flexShrink: 0 }}>
          <UnstyledButton type="button" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
            <IconChevronLeft size={20} />
            <Text size="sm" fw={500}>{t('back', lang)}</Text>
          </UnstyledButton>
        </Group>

        <Box style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
          {loading ? (
            <Group justify="center" align="center" style={{ height: 192 }}>
              <Loader color="cyan" />
            </Group>
          ) : error ? (
            <Text ta="center" py="xl" size="sm" c={mutedText}>
              {t('noProductsFound', lang)}
            </Text>
          ) : product ? (
            <Paper
              radius="lg"
              style={{ overflow: 'hidden', background: isDark ? '#0a0a0a' : '#fff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'var(--mantine-color-gray-2)'}` }}
            >
              {allImages.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
                  {allImages.map((img, i) => (
                    <div key={i} style={{ gridColumn: i === 0 && allImages.length === 1 ? '1 / -1' : undefined, aspectRatio: '16/9' }}>
                      <img src={img} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}

              <Stack p="md" gap="md">
                <div>
                  <Text fw={700} size="xl" c={primaryText}>{product.name}</Text>
                  {product.brand && (
                    <Text size="sm" style={{ marginTop: 2 }} c={mutedText}>{product.brand}</Text>
                  )}
                </div>

                <Group gap={8} wrap="wrap">
                  {product.type && (
                    <Badge size="lg" variant="light" color="cyan" radius="sm">{product.type}</Badge>
                  )}
                  {product.strain && product.strain !== product.name && (
                    <Badge size="lg" variant="light" color="gray" radius="sm">{product.strain}</Badge>
                  )}
                </Group>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  {product.thc > 0 && (
                    <Paper p="md" radius="md" withBorder style={{ background: statBg }}>
                      <Text size="xs" c="dimmed">THC</Text>
                      <Text fw={700} size="lg" c={isDark ? 'var(--mantine-color-orange-4)' : 'var(--mantine-color-orange-6)'}>{product.thc}%</Text>
                    </Paper>
                  )}
                  {product.cbd > 0 && (
                    <Paper p="md" radius="md" withBorder style={{ background: statBg }}>
                      <Text size="xs" c="dimmed">CBD</Text>
                      <Text fw={700} size="lg" c={isDark ? 'var(--mantine-color-blue-4)' : 'var(--mantine-color-blue-6)'}>{product.cbd}%</Text>
                    </Paper>
                  )}
<Paper p="md" radius="md" withBorder style={{ background: statBg }}>
                    <Text size="xs" c="dimmed">Amount</Text>
                    <Group gap={6}>
                      <IconScale size={16} />
                      <Text fw={700} size="lg" c={primaryText}>{product.amount}g</Text>
                    </Group>
                  </Paper>
                  {product.price > 0 && (
                    <Paper p="md" radius="md" withBorder style={{ background: statBg }}>
                      <Text size="xs" c="dimmed">Price</Text>
                      <Text fw={700} size="lg" c={isDark ? 'var(--mantine-color-emerald-6)' : 'var(--mantine-color-emerald-6)'}>${product.price.toFixed(2)}</Text>
                    </Paper>
                  )}
                </div>

                {product.rating > 0 && (
                  <Group gap={6}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <IconStar key={i} size={16} color={i < Math.round(product.rating) ? 'var(--mantine-color-amber-6)' : (isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-3)')} style={i < Math.round(product.rating) ? { fill: 'var(--mantine-color-amber-5)' } : undefined} />
                    ))}
                    <Text size="sm" ml={4} c={mutedText}>{product.rating.toFixed(1)}</Text>
                  </Group>
                )}

                {product.tags && (
                  <div>
                    <Text size="xs" fw={600} tt="uppercase" style={{ letterSpacing: '0.05em', marginBottom: 6 }} c={isDark ? 'var(--mantine-color-dark-3)' : 'var(--mantine-color-gray-4)'}>
                      <Group gap={4}><IconTag size={12} /> Tags</Group>
                    </Text>
                    <Group gap={6} wrap="wrap">
                      {product.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <Badge key={tag} variant="light" color="cyan" radius="sm">{tag}</Badge>
                      ))}
                    </Group>
                  </div>
                )}

                {product.effects && (
                  <Group align="flex-start" gap={8}>
                    <IconFlask2 size={16} style={{ marginTop: 2, flexShrink: 0, color: mutedText }} />
                    <Text size="sm" c={isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-6)'}>{product.effects}</Text>
                  </Group>
                )}

                {product.notes && (
                  <Group align="flex-start" gap={8}>
                    <IconNote size={16} style={{ marginTop: 2, flexShrink: 0, color: mutedText }} />
                    <Text size="sm" style={{ lineHeight: 1.6 }} c={isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-6)'}>{product.notes}</Text>
                  </Group>
                )}

                {product.purchasedAt && (
                  <Group align="center" gap={8}>
                    <IconCalendar size={16} style={{ flexShrink: 0, color: mutedText }} />
                    <Text size="sm" c={isDark ? 'var(--mantine-color-dark-2)' : 'var(--mantine-color-gray-6)'}>
                      Purchased {new Date(product.purchasedAt).toLocaleDateString()}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}