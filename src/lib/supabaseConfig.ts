export function validateSupabaseConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key) return 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.';
  try {
    if (new URL(url).protocol !== 'https:' && !url.startsWith('http://127.0.0.1:')) return 'Supabase URL must use HTTPS.';
  } catch { return 'Invalid Supabase project URL.'; }
  if (!key.startsWith('sb_publishable_')) return 'Use a Supabase publishable key (sb_publishable_…), never a secret or service-role key.';
  return '';
}
