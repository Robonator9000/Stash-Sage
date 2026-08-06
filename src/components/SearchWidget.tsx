import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useDebounce } from '../hooks/useDebounce';
import { Box, Button, Group, Stack, Text, TextInput, Avatar, Loader, Paper } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

interface SearchResult {
  type: 'user' | 'post';
  id: string;
  label: string;
  sublabel?: string;
  avatar_url?: string;
  user_id?: string;
}

interface SearchWidgetProps {
  isDark: boolean;
  onViewProfile?: (userId: string) => void;
  onViewPost?: (postId: string) => void;
}

export function SearchWidget({ isDark, onViewProfile, onViewPost }: SearchWidgetProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return; }
    setSearching(true);
    const [usersRes, postsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, username, avatar_url')
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(5),
      supabase.from('posts').select('id, content, user_id').ilike('content', `%${q}%`).order('created_at', { ascending: false }).limit(5),
    ]);
    const items: SearchResult[] = [];
    for (const u of (usersRes.data || [])) {
      items.push({ type: 'user', id: u.user_id, label: u.display_name || u.username, sublabel: `@${u.username}`, avatar_url: u.avatar_url, user_id: u.user_id });
    }
    for (const p of (postsRes.data || [])) {
      items.push({ type: 'post', id: p.id, label: p.content.slice(0, 80), sublabel: 'Post', user_id: p.user_id });
    }
    setResults(items.slice(0, 8));
    setOpen(items.length > 0);
    setSearching(false);
  }, []);

  useEffect(() => { doSearch(debouncedQuery); }, [debouncedQuery, doSearch]);

  function handleSelect(item: SearchResult) {
    setOpen(false);
    setQuery('');
    if (item.type === 'user') onViewProfile?.(item.id);
    else onViewPost?.(item.id);
  }

  const fieldBg = isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-1)';
  const fieldBorder = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';
  const fieldColor = isDark ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-gray-8)';
  const placeholderColor = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-4)';
  const dropdownBg = isDark ? 'var(--mantine-color-dark-6)' : '#fff';
  const dropdownBorder = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';
  const hoverBg = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-0)';
  const labelColor = isDark ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-gray-8)';
  const mutedColor = isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)';
  const gradient = 'linear-gradient(135deg, var(--mantine-color-cyan-5), var(--mantine-color-emerald-5))';

  return (
    <Box ref={ref} style={{ position: 'relative', width: '100%' }}>
      <TextInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Stash Tracker"
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        leftSection={<IconSearch size={16} />}
        rightSection={searching ? <Loader size={14} /> : null}
        radius="md"
        styles={{
          root: { width: '100%' },
          input: {
            background: fieldBg,
            border: `1px solid ${fieldBorder}`,
            color: fieldColor,
            '::placeholder': { color: placeholderColor },
          },
        }}
      />
      {open && (
        <Paper
          p="xs"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            zIndex: 20,
            overflow: 'hidden',
            background: dropdownBg,
            border: `1px solid ${dropdownBorder}`,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            borderRadius: 'var(--mantine-radius-md)',
          }}
        >
          <Stack gap={2}>
            {results.map(item => (
              <Button
                key={`${item.type}-${item.id}`}
                fullWidth
                variant="subtle"
                onClick={() => handleSelect(item)}
                style={{ height: 'auto', justifyContent: 'flex-start', padding: '6px 8px' }}
                styles={{
                  label: { width: '100%', justifyContent: 'flex-start' },
                  root: { '&:hover': { background: hoverBg } },
                }}
              >
                <Group gap="sm" wrap="nowrap" style={{ width: '100%' }}>
                  {item.type === 'user' ? (
                    <Avatar
                      radius="sm"
                      size={28}
                      src={item.avatar_url}
                      color="cyan"
                      style={{ background: item.avatar_url ? 'transparent' : gradient, color: '#fff', fontWeight: 700, fontSize: 12 }}
                    >
                      {(item.label[0] || '?').toUpperCase()}
                    </Avatar>
                  ) : (
                    <Avatar radius="sm" size={28} style={{ background: hoverBg }}>
                      <IconSearch size={14} style={{ color: mutedColor }} />
                    </Avatar>
                  )}
                  <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate style={{ color: labelColor }}>
                      {item.label}
                    </Text>
                    <Text size="xs" truncate style={{ color: mutedColor }}>
                      {item.sublabel}
                    </Text>
                  </Stack>
                </Group>
              </Button>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}