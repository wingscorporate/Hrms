import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { validateSupabaseConfig } from './lib/supabaseConfig';
import { recoveryLinkState, recoveryRedirectUrl, validateNewPassword } from './lib/passwordRecovery';
import wingsLogo from './assets/images/wingslogo.png';
import './index.css';

const initialLink = recoveryLinkState(window.location.hash, window.location.search);
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const configError = validateSupabaseConfig(url, key);
// Separate, memory-only recovery session. Never replace the main app's session,
// save recovery tokens, or send them to logs/analytics. GitHub Pages serves this
// real HTML file directly, so no server route or SPA fallback is needed.
const client = configError ? null : createClient(url!, key!, { auth: {
  storageKey: 'wings-hrms-password-recovery', persistSession: false, autoRefreshToken: false,
  detectSessionInUrl: initialLink.hasRecoverySession && !initialLink.hasError, flowType: 'implicit',
} });

function Recovery() {
  const [mode, setMode] = useState<'request' | 'validating' | 'reset' | 'success'>(initialLink.hasRecoverySession ? 'validating' : 'request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState(configError || (initialLink.hasError ? 'This recovery link is invalid or expired. Request a new email below.' : ''));
  const [identity, setIdentity] = useState<{ id: string; profile: string } | null>(null);

  useEffect(() => {
    let disposed = false;
    async function initialize() {
      if (!client || !initialLink.hasRecoverySession || initialLink.hasError) {
        window.history.replaceState(null, '', window.location.pathname);
        if (initialLink.hasError) setMode('request');
        return;
      }
      try {
        const session = await client.auth.getSession(); // Wait for SDK URL processing.
        if (session.error || !session.data.session) throw new Error('Invalid recovery session');
        const verified = await client.auth.getUser();
        if (verified.error || !verified.data.user) throw new Error('Recovery identity could not be verified');
        const profile = await client.from('user_profiles').select('id,role,company_id,employee_id,is_active').eq('id', verified.data.user.id).single();
        if (profile.error || !profile.data?.is_active) throw new Error('No active HRMS profile');
        if (!disposed) {
          setIdentity({ id: verified.data.user.id, profile: JSON.stringify(profile.data) });
          setMode('reset');
        }
      } catch {
        if (!disposed) { setError('This recovery link could not be verified. Request a fresh email, or contact your administrator.'); setMode('request'); }
        await client.auth.signOut({ scope: 'local' });
      } finally {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
    void initialize();
    return () => { disposed = true; };
  }, []);

  async function requestEmail(event: React.FormEvent) {
    event.preventDefault(); if (!client || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo: recoveryRedirectUrl });
      if (result.error) throw result.error;
      setNotice('If this address has an account, a password-reset email has been requested. Check your inbox and spam folder.');
    } catch { setError('The email request failed. Wait before trying again; check your connection and the Supabase email/redirect settings.'); }
    finally { setBusy(false); }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault(); if (!client || !identity || busy) return;
    const invalid = validateNewPassword(password, confirmation);
    if (invalid) { setError(invalid); return; }
    setBusy(true); setError('');
    let updated = false;
    try {
      const verified = await client.auth.getUser();
      if (verified.error || verified.data.user?.id !== identity.id) throw new Error('Recovery identity changed');
      // Password-only update of this authenticated identity; no Auth admin API,
      // profile update, business table write, new account, or role change.
      const result = await client.auth.updateUser({ password });
      if (result.error) throw result.error;
      updated = true;
      if (result.data.user?.id !== identity.id) throw new Error('Unexpected identity');
      const profile = await client.from('user_profiles').select('id,role,company_id,employee_id,is_active').eq('id', identity.id).single();
      if (profile.error || JSON.stringify(profile.data) !== identity.profile) throw new Error('Profile verification failed');
      setPassword(''); setConfirmation(''); setMode('success');
      setNotice('Your password was updated. Return to Wings HRMS and sign in with your email and new password.');
    } catch {
      if (updated) {
        setPassword(''); setConfirmation(''); setMode('success');
        setError('The password update completed, but the profile check failed. Return to sign in and contact your administrator if access fails.');
      } else setError('The password could not be updated. Use a stronger password, or request a new recovery link if this one expired.');
    } finally {
      if (updated) { await client.auth.signOut({ scope: 'local' }); setIdentity(null); }
      setBusy(false);
    }
  }

  const inputClass = 'block w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#365CF5] outline-hidden text-slate-900';
  return <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-white"><img src={wingsLogo} alt="Wings logo" className="h-full w-full object-contain" /></div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1D2B45]">Wings Corporation</h1>
    </div>
    <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"><div className="bg-white py-8 px-6 shadow-sm border border-slate-200/90 rounded-2xl sm:px-10">
      <h2 className="text-sm font-bold text-slate-900 mb-4">{mode === 'reset' ? 'Choose a new password' : 'Password recovery'}</h2>
      {mode === 'validating' && <p role="status" className="text-xs text-slate-600">Verifying your recovery link…</p>}
      {error && <div role="alert" className="p-2.5 mb-4 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">{error}</div>}
      {notice && <div role="status" className="p-2.5 mb-4 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">{notice}</div>}
      {mode === 'request' && <form className="space-y-4" onSubmit={requestEmail}>
        <label className="block text-xs font-semibold text-slate-700">Account email<input className={inputClass + ' mt-1'} type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <button type="submit" disabled={busy || !!configError} className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-[#1D2B45] hover:bg-slate-800 cursor-pointer">{busy ? 'Requesting email…' : 'Send reset email'}</button>
      </form>}
      {mode === 'reset' && <form className="space-y-4" onSubmit={savePassword}>
        <label className="block text-xs font-semibold text-slate-700">New password<input className={inputClass + ' mt-1'} type="password" autoComplete="new-password" minLength={12} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label className="block text-xs font-semibold text-slate-700">Confirm new password<input className={inputClass + ' mt-1'} type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
        <button type="submit" disabled={busy} className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-[#1D2B45] hover:bg-slate-800 cursor-pointer">{busy ? 'Saving password…' : 'Update password'}</button>
      </form>}
      <a className="block text-center mt-4 text-xs font-semibold text-[#365CF5]" href="./">Return to Wings HRMS sign in</a>
    </div></div>
  </div>;
}

createRoot(document.getElementById('root')!).render(<Recovery />);
