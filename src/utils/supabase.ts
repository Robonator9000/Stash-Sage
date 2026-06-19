import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = !!(supabaseUrl && supabaseKey);

function buildClient(): SupabaseClient {
  if (isConfigured) return createClient(supabaseUrl!, supabaseKey!);
  const noop = async () => ({ data: null, error: null });
  const noopData = { data: null, error: null };

  function buildQuery(): any {
    const resolved = Promise.resolve(noopData);
    const q: any = {
      then: (onfulfilled: any, onrejected: any) => resolved.then(onfulfilled, onrejected),
      catch: (onrejected: any) => resolved.catch(onrejected),
      finally: (onfinally: any) => resolved.finally(onfinally),
    };
    const methods = [
      'select', 'insert', 'upsert', 'delete', 'update',
      'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike',
      'is', 'in', 'not', 'or', 'contains', 'order', 'range',
      'limit', 'textSearch', 'match', 'filter', 'abortSignal',
    ];
    for (const m of methods) q[m] = () => q;
    q.single = noop;
    q.maybeSingle = noop;
    return q;
  }

  return {
    auth: {
      onAuthStateChange: (_: any) => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: noop,
      signUp: noop,
      signOut: async () => ({ error: null }),
      updateUser: async () => ({ data: { user: null }, error: null }),
      resetPasswordForEmail: noop,
    },
    rpc: () => ({ data: null, error: null }),
    from: buildQuery,
  } as unknown as SupabaseClient;
}

export const supabase = buildClient();

export async function uploadListingImages(userId: string, files: File[]): Promise<string[]> {
  if (!isConfigured || files.length === 0) return [];
  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.split('.').pop() || 'webp';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${userId}/${fileName}`;
    const { error } = await supabase.storage.from('listing-images').upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) continue;
    const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(filePath);
    urls.push(publicUrl);
  }
  return urls;
}

export async function deleteStorageImages(urls: string[]): Promise<void> {
  if (!isConfigured || urls.length === 0) return;
  const paths: string[] = [];
  for (const url of urls) {
    const parts = url.split('/listing-images/');
    if (parts.length === 2) paths.push(parts[1]);
  }
  if (paths.length === 0) return;
  await supabase.storage.from('listing-images').remove(paths);
}