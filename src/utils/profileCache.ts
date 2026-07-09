import { supabase } from './supabase';

export interface ProfileLite {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

const cache = new Map<string, ProfileLite>();

function normalize(p: {
  user_id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}): ProfileLite {
  return {
    user_id: p.user_id,
    username: p.username || p.display_name?.toLowerCase().replace(/\s+/g, '_') || 'user',
    display_name: p.display_name || p.username || 'User',
    avatar_url: p.avatar_url ?? undefined,
  };
}

/**
 * Batch-fetch profiles by user_id, served from an in-memory cache so repeated
 * enrichment (feed pages, quote posts, realtime, marketplace) never re-queries
 * the same author. Returns a Map keyed by user_id containing every requested id
 * that resolved.
 */
export async function getProfiles(userIds: string[]): Promise<Map<string, ProfileLite>> {
  const needed = Array.from(new Set(userIds.filter(Boolean)));
  const result = new Map<string, ProfileLite>();
  const missing = needed.filter((id) => !cache.has(id));

  if (missing.length) {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', missing);
    for (const p of (data as any[]) ?? []) {
      cache.set(p.user_id, normalize(p));
    }
  }

  for (const id of needed) {
    const c = cache.get(id);
    if (c) result.set(id, c);
  }
  return result;
}

export async function getProfile(userId: string): Promise<ProfileLite | undefined> {
  if (!userId) return undefined;
  const map = await getProfiles([userId]);
  return map.get(userId);
}

export function getCachedProfile(userId: string): ProfileLite | undefined {
  return cache.get(userId);
}

export function primeProfile(p: ProfileLite): void {
  cache.set(p.user_id, p);
}

export function clearProfileCache(): void {
  cache.clear();
}
