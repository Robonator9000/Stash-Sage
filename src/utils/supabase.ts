import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = !!(supabaseUrl && supabaseKey);

function buildClient(): SupabaseClient {
  if (isConfigured) return createClient(supabaseUrl!, supabaseKey!);
  const noop = async () => ({ data: null, error: null });
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
    },
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      upsert: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: null, error: null, single: async () => ({ data: null, error: null }) }),
      order: () => ({ data: null, error: null }),
      single: async () => ({ data: null, error: null }),
    }),
  } as unknown as SupabaseClient;
}

export const supabase = buildClient();