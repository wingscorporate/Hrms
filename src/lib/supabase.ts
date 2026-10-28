import { createClient } from '@supabase/supabase-js';

export function validateSupabaseConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key) return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.';
  try {
    if (new URL(url).protocol !== 'https:' && !url.startsWith('http://127.0.0.1:')) return 'Supabase URL must use HTTPS.';
  } catch { return 'Invalid Supabase project URL.'; }
  if (!key.startsWith('sb_publishable_')) return 'Use a Supabase publishable key (sb_publishable_…), never a secret or service-role key.';
  return '';
}

const url = import.meta.env?.VITE_SUPABASE_URL;
const key = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabaseConfigError = validateSupabaseConfig(url, key);
export const supabase = supabaseConfigError ? null : createClient(url!, key!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export function requireSupabase() {
  if (!supabase) throw new Error(supabaseConfigError);
  return supabase;
}
