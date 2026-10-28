import { useEffect, useRef, useState } from 'react';
import { emptyData, loadData, loadProfile, changesBetween, saveChanges, type HRMSData, type DatabaseSession, type VersionMap } from '../lib/hrmsDatabase';
import { requireSupabase, supabase, supabaseConfigError } from '../lib/supabase';

export function useDatabaseStore() {
  const [data, setData] = useState(emptyData);
  const [session, setSession] = useState<DatabaseSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const state = useRef(data);
  const versions = useRef<VersionMap>({});
  const draft = useRef<HRMSData | null>(null);
  const locked = useRef(false);
  const generation = useRef(0);
  const authUserId = useRef<string | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const install = (next: HRMSData) => { state.current = next; setData(next); };
  const fail = (error: unknown) => setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'The database request failed. Please try again.' });

  async function establish(userId: string | null) {
    const epoch = ++generation.current;
    authUserId.current = userId;
    install(emptyData()); setSession(null); versions.current = {}; setLoading(true);
    if (!userId) { setLoading(false); return; }
    try {
      const nextSession = await loadProfile(userId);
      const result = await loadData(nextSession.companyId);
      if (epoch !== generation.current) return;
      versions.current = result.versions; install(result.data); setSession(nextSession); setMessage(null);
    } catch (error) { if (epoch === generation.current) fail(error); }
    finally { if (epoch === generation.current) setLoading(false); }
  }

  useEffect(() => {
    if (!supabase) { fail(new Error(supabaseConfigError)); setLoading(false); return; }
    let disposed = false;
    let observed = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      observed = true;
      const id = next?.user.id ?? null;
      if (event === 'TOKEN_REFRESHED' && id === authUserId.current) return;
      if (event === 'SIGNED_IN' && id === authUserId.current && sessionRef.current) return;
      // Never await another Supabase call inside its auth event lock.
      window.setTimeout(() => { if (!disposed) void establish(id); }, 0);
    });
    void supabase.auth.getSession().then(({ data: auth, error }) => {
      if (disposed || observed) return;
      if (error) { fail(error); setLoading(false); }
      else void establish(auth.session?.user.id ?? null);
    });
    return () => { disposed = true; generation.current++; subscription.unsubscribe(); };
  }, []);

  async function refresh() {
    const active = sessionRef.current;
    if (!active || locked.current) return;
    const epoch = generation.current;
    try {
      const profile = await loadProfile(active.user.id);
      if (JSON.stringify(profile) !== JSON.stringify(active)) { await establish(active.user.id); return; }
      const result = await loadData(active.companyId);
      if (epoch === generation.current && !locked.current) { versions.current = result.versions; install(result.data); }
    } catch (error) {
      if (epoch === generation.current) { install(emptyData()); setSession(null); fail(error); }
    }
  }

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), 60000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, []);

  function setter<K extends keyof HRMSData>(key: K) {
    return (value: HRMSData[K] | ((previous: HRMSData[K]) => HRMSData[K])) => {
      if (!draft.current) throw new Error('Database writes must be performed inside a transaction.');
      draft.current[key] = typeof value === 'function' ? (value as (previous: HRMSData[K]) => HRMSData[K])(draft.current[key]) : value;
    };
  }

  function action<A extends unknown[], R>(fn: (...args: A) => R) {
    return async (...args: A): Promise<R extends void ? boolean : R | null> => {
      if (!sessionRef.current || locked.current) { fail(new Error('Wait for the current operation to finish, then try again.')); return null as any; }
      locked.current = true; setSaving(true); setMessage(null);
      const epoch = generation.current;
      try {
        draft.current = structuredClone(state.current);
        const result = fn(...args);
        const next = draft.current;
        const changes = changesBetween(state.current, next, sessionRef.current.companyId, versions.current);
        const removedFiles = state.current.documents.filter(doc => doc.fileUrl && !next.documents.some(remaining => remaining.id === doc.id)).map(doc => doc.fileUrl!);
        draft.current = null;
        if (!changes.length) return false as any;
        await saveChanges(sessionRef.current.companyId, changes);
        if (epoch !== generation.current) return null as any;
        changes.forEach(change => {
          const key = `${change.table}/${change.id}`;
          if (change.operation === 'delete') delete versions.current[key];
          else versions.current[key] = (change.revision ?? 0) + 1;
        });
        install(next);
        setMessage({ kind: 'success', text: 'Changes saved successfully.' });
        if (removedFiles.length) {
          try {
            const cleanup = await requireSupabase().storage.from('hrms-documents').remove(removedFiles);
            if (cleanup.error) throw cleanup.error;
          } catch { setMessage({ kind: 'error', text: 'Records were deleted, but removing stored files failed. Ask your administrator to clean up orphan files in Supabase Storage.' }); }
        }
        // Refresh server-generated audit rows and any server-side calculated values.
        try {
          const fresh = await loadData(sessionRef.current.companyId);
          if (epoch === generation.current) { versions.current = fresh.versions; install(fresh.data); }
        } catch { if (epoch === generation.current) setMessage({ kind: 'error', text: 'Changes were saved, but refreshing records failed. Refresh the page to reload them.' }); }
        return (result === undefined ? true : result) as any;
      } catch (error) {
        if (epoch === generation.current) fail(error);
        return null as any;
      } finally { draft.current = null; locked.current = false; setSaving(false); }
    };
  }

  async function authenticate(email: string, password: string): Promise<boolean> {
    try {
      const { data: auth, error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      // Validate provisioning before telling the existing form authentication succeeded.
      await loadProfile(auth.user.id);
      return true;
    } catch (error) {
      fail(error);
      if (supabase) await supabase.auth.signOut({ scope: 'local' });
      return false;
    }
  }

  async function logout() {
    if (locked.current) { fail(new Error('Wait until saving finishes before logging out.')); return; }
    try {
      const { error } = await requireSupabase().auth.signOut({ scope: 'local' });
      if (error) throw error;
      await establish(null);
    } catch (error) { fail(error); }
  }

  return { data, currentUser: session?.user ?? null, companyId: session?.companyId, loading, saving, message,
    dismissMessage: () => setMessage(null), fail, setter, action, authenticate, logout };
}
