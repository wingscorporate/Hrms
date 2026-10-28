import { createClient } from '@supabase/supabase-js';
import { validateSupabaseConfig } from './supabaseConfig';
export { validateSupabaseConfig } from './supabaseConfig';

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
