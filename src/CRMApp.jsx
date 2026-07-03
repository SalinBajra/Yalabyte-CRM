import { useEffect, useMemo, useRef, useState } from 'react';
import ContactsView from './ContactsView';
import LeadTasks from './LeadTasks';
import MobileAppView from './MobileAppView';
import OverviewView from './OverviewView';
import PipelineBoard from './PipelineBoard';
import ProfileModal from './ProfileModal';
import SupportView from './SupportView';
import TeamAvatar from './TeamAvatar';
import {
  deleteBiometricCredentials,
  getBiometricStatus,
  getRememberedEmail,
  readBiometricCredentials,
  rememberEmail,
  saveBiometricCredentials,
  verifyDeviceIdentity
} from './capacitor/biometricAuth';
import { getCachedLeads, getCachedTeamMembers } from './capacitor/offlineStorage';
import { isNativeMobile, useCapacitorInit, useOfflineCache } from './hooks/useCapacitor';
import {
  convertLeadToContact,
  deleteLeadWithAudit,
  fetchDeletionNotifications,
  fetchLeads,
  fetchReadNotificationIds,
  fetchTeamMembers,
  markDeletionNotificationsRead,
  notifyCliqNewLead,
  registerTeamMember,
  saveLeads,
  setTeamMemberRole,
  supabase,
  toCRMUser,
  upsertFinanceDealFromLead
} from './supabase';

const STORAGE_KEY = 'yalabyte-crm-leads';
const SESSION_KEY = 'yalabyte-crm-session';
const ACCOUNTS_KEY = 'yalabyte-crm-accounts';
const READ_NOTIFICATIONS_KEY = 'yalabyte-crm-read-notifications';
const WELCOME_SESSION_KEY = 'yalabyte-crm-welcome-shown';
const ALLOWED_EMAIL_DOMAIN = 'yalabyte.com';
const financeAppUrl = import.meta.env.VITE_FINANCE_APP_URL || '';

const stages = [
  { id: 'new', label: 'New', tone: 'bg-sky-50 text-sky-800 border-sky-100' },
  { id: 'contacted', label: 'Contacted', tone: 'bg-cyan-50 text-cyan-800 border-cyan-100' },
  { id: 'proposal', label: 'Proposal', tone: 'bg-amber-50 text-amber-800 border-amber-100' },
  { id: 'won', label: 'Won', tone: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
  { id: 'lost', label: 'Lost', tone: 'bg-rose-50 text-rose-800 border-rose-100' }
];

const services = [
  'Website Development',
  'Business Website Design',
  'Custom Web Applications',
  'UI/UX Design',
  'SEO-ready Website Setup',
  'Maintenance and Support',
  'Digital Consulting'
];

const priorities = ['High', 'Medium', 'Low'];

const initialLead = {
  name: '',
  email: '',
  phone: '',
  company: '',
  service: services[0],
  status: 'new',
  priority: 'Medium',
  owner: '',
  value: '',
  followUpDate: '',
  source: 'Team added',
  message: '',
  notes: ''
};

const sampleLeads = [];

function createId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readLeads() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : sampleLeads;
    if (!Array.isArray(stored)) return sampleLeads;
    return stored
      .filter((lead, index) => lead?.id && stored.findIndex((item) => item?.id === lead.id) === index)
      .map((lead) => ({ ...lead, source: lead.source === 'Manual entry' ? 'Team added' : lead.source }));
  } catch {
    return sampleLeads;
  }
}

function formatDate(value) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function daysUntil(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function normalizedEmail(value) {
  return value?.trim().toLowerCase() || '';
}

function normalizedPhone(value) {
  return value?.replace(/\D/g, '') || '';
}

function samePersonName(left, right) {
  return Boolean(left && right && left.trim().localeCompare(right.trim(), undefined, { sensitivity: 'base' }) === 0);
}

function isTeamOwner(owner, teamMembers) {
  return Boolean(owner && teamMembers.some((member) => samePersonName(member.name, owner)));
}

function trustedOwnerName(owner, teamMembers) {
  if (!owner) return '';
  return teamMembers.find((member) => samePersonName(member.name, owner))?.name || '';
}

function uniqueNotifications(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.lead_id ? `lead:${item.lead_id}` : `notification:${String(item?.id ?? '')}`;
    if (key === 'notification:' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function money(value) {
  const amount = Number(value || 0);
  return `Rs ${new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(amount)}`;
}

function fieldClass() {
  return 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100';
}

function MetricIcon({ type }) {
  if (type === 'pipeline') return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9m5 10V5m5 14v-7m5 7V3" /></svg>;
  if (type === 'due') return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
  if (type === 'open') return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h6l2 2H21v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5Zm0 0v-2a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2" /></svg>;
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M16 18.5a4 4 0 0 0-8 0m4-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 7a3.5 3.5 0 0 0-3-3.46m.5-8.9a2.5 2.5 0 0 1 0 4.72M5 18.5a3.5 3.5 0 0 1 3-3.46m-.5-8.9a2.5 2.5 0 0 0 0 4.72" /></svg>;
}

function SearchIcon() {
  return <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>;
}

function Stat({ label, value, icon = 'leads', tone = 'cyan' }) {
  const tones = {
    cyan: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-100 bg-violet-50 text-violet-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700'
  };
  return (
    <div className="group flex items-center gap-2.5 border-r border-slate-200/80 px-3 py-3 transition hover:bg-white last:border-r-0 sm:gap-3 sm:px-5 sm:py-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border sm:h-10 sm:w-10 sm:rounded-xl ${tones[tone] || tones.cyan}`}>
        <MetricIcon type={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-slate-950 sm:mt-1 sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

function Brand({ compact = false, inverted = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid ${compact ? 'h-10 w-10' : 'h-12 w-12'} place-items-center rounded-xl bg-white p-2 shadow-sm`}>
        <img src="/images/yalabyte-yb-logo.png" alt="YalaByte logo" className="h-full w-full object-contain" />
      </span>
      <div>
        <p className={`${compact ? 'text-lg' : 'text-xl'} font-extrabold tracking-tight ${inverted ? 'text-white' : 'text-slate-950'}`}>
          Yala<span className="text-cyanbrand-500">Byte</span>
        </p>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${inverted ? 'text-slate-400' : 'text-slate-500'}`}>CRMByte</p>
      </div>
    </div>
  );
}

function MobileInstallNotice({ onOpen }) {
  return (
    <div className="mx-auto max-w-[1500px] px-3 pt-3 sm:px-6">
      <div className="flex flex-col gap-2 rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold leading-6">
          Want the mobile app? Open this same CRMByte site on your Android phone, sign in, then use the Mobile App tab to download the APK.
        </p>
        <button className="self-start rounded-lg bg-cyanbrand-500 px-3 py-2 text-xs font-extrabold text-navy-950 transition hover:bg-cyanbrand-400 sm:self-auto" onClick={onOpen} type="button">
          Mobile App
        </button>
      </div>
    </div>
  );
}

function WorkspaceLoader({ user, compact = false }) {
  const initials = user?.name?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'YB';
  if (compact) {
    return (
      <main className="login-shell flex min-h-screen items-center justify-center px-5 text-white">
        <div className="text-center">
          <div className="flex justify-center"><Brand compact inverted /></div>
          <p className="mt-7 text-sm font-semibold text-slate-200">Getting things together…</p>
          <span className="mx-auto mt-4 block h-1 w-20 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-1/2 animate-pulse rounded-full bg-cyanbrand-400" /></span>
        </div>
      </main>
    );
  }
  return (
    <main className="login-shell flex min-h-screen items-center justify-center px-5 text-white">
      <div className="text-center">
        <div className="flex justify-center"><Brand inverted /></div>
        <span className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-full border border-cyanbrand-400/30 bg-white/10 text-lg font-extrabold text-cyanbrand-300 shadow-[0_0_40px_rgba(34,211,238,0.15)]">{initials}</span>
        <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-cyanbrand-400">Team workspace</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome, {user?.name || 'team member'}</h1>
        <p className="mt-2 text-sm text-slate-300">CRMByte is getting everything ready.</p>
        <span className="mx-auto mt-6 block h-1 w-24 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-1/2 animate-pulse rounded-full bg-cyanbrand-400" /></span>
      </div>
    </main>
  );
}

function NativeUnlockGate({ user, onSignOut, onUnlock }) {
  const [status, setStatus] = useState({ available: false, enabled: false, label: 'biometric unlock' });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const promptedRef = useRef(false);

  const unlock = async () => {
    setBusy(true);
    setError('');
    try {
      await verifyDeviceIdentity();
      onUnlock();
    } catch (unlockError) {
      setError(unlockError.message || `${status.label} unlock failed. Try again or sign in with your password.`);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let active = true;
    getBiometricStatus()
      .then((nextStatus) => {
        if (!active) return;
        setStatus(nextStatus);
        setBusy(false);
        if (nextStatus.available && !promptedRef.current) {
          promptedRef.current = true;
          window.setTimeout(unlock, 250);
        }
      })
      .catch(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="login-shell flex min-h-screen items-center justify-center px-5 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-7 text-center text-slate-950 shadow-soft">
        <div className="flex justify-center"><Brand /></div>
        <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">App locked</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Welcome back, {user?.name || 'team member'}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Confirm it is you before opening CRMByte on this device.</p>
        {error ? <p className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        <button
          className="mt-6 w-full rounded-lg bg-cyanbrand-500 px-4 py-3 text-sm font-extrabold text-navy-950 shadow-sm transition hover:bg-cyanbrand-400 disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={unlock}
          type="button"
        >
          {busy ? 'Checking device…' : `Unlock with ${status.label}`}
        </button>
        <button className="mt-4 text-xs font-bold text-slate-400 underline-offset-4 hover:text-slate-600 hover:underline" onClick={onSignOut} type="button">
          Sign in with password
        </button>
      </div>
    </main>
  );
}

function BellIcon() {
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.9 23.9 0 0 0 5.454-1.31A8.97 8.97 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.97 8.97 0 0 1-2.311 6.022 23.9 23.9 0 0 0 5.454 1.31m5.714 0a24.25 24.25 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;
}

function ExportIcon() {
  return <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4 4 4M5 14v5h14v-5" /></svg>;
}

function ImportIcon() {
  return <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 14v5h14v-5" /></svg>;
}

function GearIcon() {
  return <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6.75 11.1 4.9a.95.95 0 0 1 1.8 0l.6 1.85c.2.06.39.14.58.24l1.72-.87a.95.95 0 0 1 1.27.38l.9 1.56a.95.95 0 0 1-.28 1.3l-1.6 1.05c.02.2.03.4.03.59s-.01.39-.03.59l1.6 1.05a.95.95 0 0 1 .28 1.3l-.9 1.56a.95.95 0 0 1-1.27.38l-1.72-.87c-.19.1-.38.18-.58.24l-.6 1.85a.95.95 0 0 1-1.8 0l-.6-1.85a5.1 5.1 0 0 1-.58-.24l-1.72.87a.95.95 0 0 1-1.27-.38l-.9-1.56a.95.95 0 0 1 .28-1.3l1.6-1.05A5.5 5.5 0 0 1 7.88 11c0-.19.01-.39.03-.59l-1.6-1.05a.95.95 0 0 1-.28-1.3l.9-1.56a.95.95 0 0 1 1.27-.38l1.72.87c.19-.1.38-.18.58-.24Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /></svg>;
}

function SignOutIcon() {
  return <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-3m-5-4h11m0 0-3-3m3 3-3 3" /></svg>;
}

function ProgressRoadmap({ status, onChange }) {
  const pipelineStages = stages.slice(0, 3);
  const currentIndex = pipelineStages.findIndex((stage) => stage.id === status);
  const reachedOutcome = ['won', 'lost'].includes(status);

  return (
    <div className="mt-5">
      <div className="space-y-0">
        {pipelineStages.map((stage, index) => {
          const complete = reachedOutcome || currentIndex > index;
          const active = status === stage.id;
          return (
            <div className="relative flex gap-3 pb-5 last:pb-3" key={stage.id}>
              {index < pipelineStages.length - 1 ? (
                <span className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 ${complete ? 'bg-cyanbrand-500' : 'bg-slate-200'}`} />
              ) : null}
              <button
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition ${
                  active
                    ? 'border-cyanbrand-500 bg-cyanbrand-500 text-navy-950 shadow-[0_0_0_5px_rgba(19,200,222,0.12)]'
                    : complete
                      ? 'border-cyanbrand-500 bg-white text-cyan-700'
                      : 'border-slate-200 bg-white text-slate-400'
                }`}
                onClick={() => onChange(stage.id)}
                type="button"
                aria-label={`Move lead to ${stage.label}`}
              >
                {complete ? '✓' : index + 1}
              </button>
              <button className="pt-1 text-left" onClick={() => onChange(stage.id)} type="button">
                <span className={`block text-sm font-bold ${active ? 'text-slate-950' : 'text-slate-600'}`}>{stage.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  {stage.id === 'new' ? 'Review the opportunity' : stage.id === 'contacted' ? 'Start the conversation' : 'Share scope and pricing'}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Outcome</p>
      <div className="grid grid-cols-2 gap-2">
        {stages.slice(3).map((stage) => (
          <button
            key={stage.id}
            className={`rounded-lg border px-3 py-2.5 text-sm font-bold transition ${
              status === stage.id
                ? stage.id === 'won'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-rose-400 bg-rose-50 text-rose-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => onChange(stage.id)}
            type="button"
          >
            {stage.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function isAllowedTeamEmail(email) {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

function readLocalAccounts() {
  try {
    const accounts = JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || '[]');
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function saveLocalSession(session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function readLocalSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function LoginGate({ onUnlock }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [biometricStatus, setBiometricStatus] = useState({ available: false, enabled: false, label: 'biometric unlock' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getRememberedEmail(), getBiometricStatus()])
      .then(([rememberedEmail, nextBiometricStatus]) => {
        if (!active) return;
        if (rememberedEmail) setEmail(rememberedEmail);
        setBiometricStatus(nextBiometricStatus);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!isAllowedTeamEmail(normalizedEmail)) {
      setError('Access denied. Only verified @yalabyte.com team accounts can use this CRM.');
      return;
    }

    if (password.length < 8) {
      setError('Use at least 8 characters for the password.');
      return;
    }

    if (!supabase) {
      const accounts = readLocalAccounts();
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Add your name to create the account.');
          return;
        }
        if (accounts.some((account) => account.email === normalizedEmail)) {
          setError('This email already has a CRM account.');
          return;
        }
        const account = { id: createId('user'), name: name.trim(), email: normalizedEmail, password };
        window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([account, ...accounts]));
        const session = { id: account.id, name: account.name, email: account.email };
        saveLocalSession(session);
        onUnlock(session);
        return;
      }

      const account = accounts.find((item) => item.email === normalizedEmail && item.password === password);
      if (!account) {
        setError('No matching CRM account found.');
        return;
      }
      const session = { id: account.id, name: account.name, email: account.email };
      saveLocalSession(session);
      onUnlock(session);
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Add your name to create the account.');
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (signUpError) throw signUpError;
        if (data.session) onUnlock(toCRMUser(data.user));
        else setMessage('Account created. Check your YalaByte inbox to confirm your email, then sign in.');
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });
      if (signInError) throw signInError;
      await rememberEmail(normalizedEmail);
      if (rememberDevice && biometricStatus.available) {
        await saveBiometricCredentials(normalizedEmail, password)
          .then(() => setBiometricStatus((current) => ({ ...current, enabled: true, email: normalizedEmail })))
          .catch(() => setMessage(`Signed in. ${biometricStatus.label} was not enabled on this device.`));
      }
      onUnlock(toCRMUser(data.user));
    } catch (authError) {
      setError(authError.message || 'Unable to authenticate. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const unlockWithBiometrics = async () => {
    if (!supabase || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const credentials = await readBiometricCredentials();
      if (!credentials?.username || !credentials?.password) {
        setError(`${biometricStatus.label} is not set up for CRMByte yet.`);
        return;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.username,
        password: credentials.password
      });
      if (signInError) throw signInError;
      await rememberEmail(credentials.username);
      onUnlock(toCRMUser(data.user));
    } catch (authError) {
      setError(authError.message || `${biometricStatus.label} unlock failed. Use your password once to refresh it.`);
    } finally {
      setBusy(false);
    }
  };

  const forgetBiometrics = async () => {
    await deleteBiometricCredentials();
    setBiometricStatus((current) => ({ ...current, enabled: false, email: '' }));
    setMessage(`${biometricStatus.label} unlock removed from this device.`);
  };

  return (
    <main className="login-shell min-h-screen px-5 py-8 text-white sm:py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-white/10 bg-white shadow-soft sm:rounded-3xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative hidden overflow-hidden bg-navy-950 p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyanbrand-500/15 blur-3xl" />
            <div className="relative">
              <Brand inverted />
              <p className="mt-16 inline-flex rounded-full border border-cyanbrand-500/25 bg-cyanbrand-500/10 px-3 py-1.5 text-xs font-bold text-cyanbrand-400">
                Private team workspace
              </p>
              <h1 className="mt-5 max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white">Turn every inquiry into a clear next step.</h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">Manage opportunities, ownership, follow-ups, and client progress from one focused workspace.</p>
            </div>
            <div className="relative mt-12 grid gap-3">
              {['Shared lead pipeline', 'Live team ownership', 'Protected YalaByte access'].map((item) => (
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-200" key={item}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyanbrand-500/15 text-xs text-cyanbrand-400">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <form className="p-6 text-slate-950 sm:p-10" onSubmit={handleSubmit}>
            <div className="lg:hidden"><Brand /></div>
            <div className="mt-7 lg:mt-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Secure access</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Sign in to CRMByte</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Use your company email to continue to CRMByte.</p>
            </div>
          <div className="mt-6 grid grid-cols-2 rounded-md bg-slate-100 p-1">
            <button
              className={`rounded px-3 py-2 text-sm font-bold ${mode === 'signin' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`rounded px-3 py-2 text-sm font-bold ${mode === 'signup' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              type="button"
            >
              Create
            </button>
          </div>
          {mode === 'signup' ? (
            <label className="mt-5 block text-sm font-semibold text-slate-900">
              Name
              <input className={fieldClass()} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
            </label>
          ) : null}
          <label className="mt-6 block text-sm font-semibold text-slate-900">
            YalaByte email
            <input
              className={fieldClass()}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@yalabyte.com"
              autoComplete="email"
              autoFocus
            />
          </label>
          <label className="mt-5 block text-sm font-semibold text-slate-900">
            Password
            <input
              className={fieldClass()}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </label>
          {mode === 'signin' && biometricStatus.available ? (
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-700">
              <input
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyanbrand-500 focus:ring-cyanbrand-200"
                checked={rememberDevice}
                onChange={(event) => setRememberDevice(event.target.checked)}
                type="checkbox"
              />
              <span>
                Remember this device
                <span className="mt-0.5 block text-xs font-medium leading-5 text-slate-500">Enable {biometricStatus.label} for the next login.</span>
              </span>
            </label>
          ) : null}
          {mode === 'signin' && biometricStatus.enabled ? (
            <div className="mt-4 grid gap-2">
              <button className="w-full rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-extrabold text-cyan-800 transition hover:bg-cyan-100 disabled:opacity-60" disabled={busy} onClick={unlockWithBiometrics} type="button">
                Unlock with {biometricStatus.label}
              </button>
              <button className="text-xs font-bold text-slate-400 underline-offset-4 hover:text-slate-600 hover:underline" onClick={forgetBiometrics} type="button">
                Forget {biometricStatus.label} on this device
              </button>
            </div>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3" role="alert">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-red-700">Access rejected</p>
              <p className="mt-1 text-sm font-medium leading-5 text-red-700">{error}</p>
            </div>
          ) : null}
          {message ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p> : null}
          <button disabled={busy} className="mt-5 w-full rounded-lg bg-cyanbrand-500 px-4 py-3 text-sm font-bold text-navy-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyanbrand-400 hover:shadow-md disabled:cursor-wait disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">Restricted to authorized <span className="font-bold text-slate-600">@yalabyte.com</span> accounts.</p>
        </form>
        </div>
      </div>
    </main>
  );
}

export default function CRMApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [appUnlocked, setAppUnlocked] = useState(() => !isNativeMobile());
  const [dataReady, setDataReady] = useState(false);
  const [syncState, setSyncState] = useState('saved');
  const [dataError, setDataError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [welcomeMode, setWelcomeMode] = useState(() => window.sessionStorage.getItem(WELCOME_SESSION_KEY) ? 'refresh' : 'login');
  const [leads, setLeads] = useState(readLeads);
  const [selectedId, setSelectedId] = useState(() => readLeads()[0]?.id || '');
  const [draft, setDraft] = useState(initialLead);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [copiedLeadId, setCopiedLeadId] = useState('');
  const [mobilePane, setMobilePane] = useState('list');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [note, setNote] = useState('');
  const [activityType, setActivityType] = useState('Note');
  const [teamMembers, setTeamMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);
  const [financeHandoffBusy, setFinanceHandoffBusy] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('overview');
  const [profileOpen, setProfileOpen] = useState(false);
  const importInputRef = useRef(null);

  const selectedLead = isCreatingLead ? null : leads.find((lead) => lead.id === selectedId) || null;

  useCapacitorInit(currentUser);
  useOfflineCache(leads, teamMembers);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    if (!actionNotice) return undefined;
    const timer = window.setTimeout(() => setActionNotice(''), 10000);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  useEffect(() => {
    if (dataReady && currentUser) window.sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
  }, [dataReady, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      setReadNotificationIds([]);
      return;
    }
    try {
      const stored = JSON.parse(window.localStorage.getItem(`${READ_NOTIFICATIONS_KEY}:${currentUser.id}`) || '[]');
      setReadNotificationIds(Array.isArray(stored) ? stored : []);
    } catch {
      setReadNotificationIds([]);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!supabase) {
      setCurrentUser(readLocalSession());
      setAuthReady(true);
      return undefined;
    }

    const acceptSession = (session) => {
      const user = toCRMUser(session?.user);
      if (user && !isAllowedTeamEmail(user.email)) {
        setCurrentUser(null);
        supabase.auth.signOut();
      } else {
        setCurrentUser(user);
        if (!user) setAppUnlocked(!isNativeMobile());
      }
      setAuthReady(true);
    };

    supabase.auth.getSession().then(({ data }) => acceptSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => acceptSession(session));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) {
      setDataReady(Boolean(currentUser));
      return;
    }

    if (!currentUser) {
      setDataReady(false);
      return;
    }

    let active = true;
    setDataReady(false);
    setDataError('');

    Promise.allSettled([
      registerTeamMember(currentUser).then(() => fetchTeamMembers()),
      fetchDeletionNotifications(),
      fetchReadNotificationIds()
    ]).then(([membersResult, notificationsResult, readNotificationsResult]) => {
      if (!active) return;
      if (membersResult.status === 'fulfilled') setTeamMembers(membersResult.value);
      if (notificationsResult.status === 'fulfilled') setNotifications(uniqueNotifications(notificationsResult.value));
      if (readNotificationsResult.status === 'fulfilled') setReadNotificationIds((current) => Array.from(new Set([...current, ...readNotificationsResult.value])));
      if (membersResult.status === 'rejected' || notificationsResult.status === 'rejected' || readNotificationsResult.status === 'rejected') {
        const failedParts = [
          membersResult.status === 'rejected' ? `team members: ${membersResult.reason?.message || 'unavailable'}` : '',
          notificationsResult.status === 'rejected' ? `deletion audit: ${notificationsResult.reason?.message || 'unavailable'}` : '',
          readNotificationsResult.status === 'rejected' ? `notification reads: ${readNotificationsResult.reason?.message || 'unavailable'}` : ''
        ].filter(Boolean);
        setDataError(`CRM access setup needs attention (${failedParts.join('; ')}).`);
      }
      if (membersResult.status === 'rejected' && isNativeMobile()) {
        getCachedTeamMembers().then((cachedMembers) => {
          if (active && cachedMembers?.length) setTeamMembers(cachedMembers);
        }).catch(() => {});
      }
    });

    fetchLeads()
      .then((remoteLeads) => {
        if (!active) return;
        const nextLeads = remoteLeads.length ? remoteLeads : readLeads();
        setLeads(nextLeads);
        setSelectedId(nextLeads[0]?.id || '');
        window.sessionStorage.setItem(WELCOME_SESSION_KEY, 'true');
        setDataReady(true);
      })
      .catch((error) => {
        if (!active) return;
        if (isNativeMobile()) {
          getCachedLeads()
            .then((cachedLeads) => {
              if (!active) return;
              if (cachedLeads?.length) {
                setLeads(cachedLeads);
                setSelectedId(cachedLeads[0]?.id || '');
                setDataError('You are viewing cached CRM data. Changes will sync after the connection is restored.');
              } else {
                setDataError(error.message || 'Unable to load CRM data.');
              }
            })
            .catch(() => {
              if (active) setDataError(error.message || 'Unable to load CRM data.');
            })
            .finally(() => {
              if (active) setDataReady(true);
            });
          return;
        }
        setDataError(error.message || 'Unable to load CRM data.');
        setDataReady(true);
      });

    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!dataReady || !currentUser || !supabase) return undefined;
    setSyncState('syncing');
    const timer = window.setTimeout(() => {
      saveLeads(leads)
        .then(() => setSyncState('saved'))
        .catch((error) => {
          setSyncState('error');
          setDataError(error.message || 'Unable to save CRM data.');
        });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [leads, dataReady, currentUser?.id]);

  useEffect(() => {
    if (!dataReady || !teamMembers.length) return;
    const now = new Date().toISOString();
    setLeads((current) => {
      let changed = false;
      const next = current.map((lead) => {
        if (!lead.owner || isTeamOwner(lead.owner, teamMembers)) return lead;
        changed = true;
        return { ...lead, owner: '', updatedAt: now };
      });
      return changed ? next : current;
    });
  }, [dataReady, teamMembers]);

  useEffect(() => {
    if (!dataReady || !currentUser || !supabase) return undefined;

    const channel = supabase
      .channel('crm-leads-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        setLeads((current) => {
          if (payload.eventType === 'DELETE') {
            return current.filter((lead) => lead.id !== payload.old?.id);
          }

          const incoming = payload.new?.data;
          if (!incoming?.id) return current;
          const existingIndex = current.findIndex((lead) => lead.id === incoming.id);
          if (existingIndex === -1) return [incoming, ...current];
          if (JSON.stringify(current[existingIndex]) === JSON.stringify(incoming)) return current;

          const next = [...current];
          next[existingIndex] = incoming;
          return next;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        fetchTeamMembers().then(setTeamMembers).catch(() => {});
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lead_deletion_notifications' }, (payload) => {
        setNotifications((current) => uniqueNotifications([payload.new, ...current]).slice(0, 30));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dataReady, currentUser?.id]);

  useEffect(() => {
    if (isCreatingLead) return;
    if (selectedLead) {
      setDraft({
        ...initialLead,
        ...selectedLead,
        owner: selectedLead.owner && isTeamOwner(selectedLead.owner, teamMembers) ? selectedLead.owner : ''
      });
      setNote('');
    } else {
      setDraft(initialLead);
    }
  }, [selectedLead?.id, selectedLead?.updatedAt, isCreatingLead, teamMembers]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchingLeads = leads.filter((lead) => {
      const matchesStage = stageFilter === 'all' || lead.status === stageFilter;
      const trustedOwner = trustedOwnerName(lead.owner, teamMembers);
      const matchesOwner = ownerFilter === 'all'
        || (ownerFilter === 'mine' && samePersonName(trustedOwner, currentUser?.name))
        || (ownerFilter === 'unassigned' && !trustedOwner)
        || (ownerFilter.startsWith('owner:') && samePersonName(trustedOwner, ownerFilter.slice(6)));
      const due = daysUntil(lead.followUpDate);
      const isClosed = ['won', 'lost'].includes(lead.status);
      const matchesFollowUp = followUpFilter === 'all'
        || (followUpFilter === 'overdue' && due !== null && due < 0 && !isClosed)
        || (followUpFilter === 'today' && due === 0 && !isClosed)
        || (followUpFilter === 'upcoming' && due !== null && due > 0 && !isClosed)
        || (followUpFilter === 'none' && due === null && !isClosed);
      const matchesQuery =
        !normalizedQuery ||
        [lead.name, lead.email, lead.phone, lead.company, lead.service, trustedOwner, lead.source]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStage && matchesOwner && matchesFollowUp && matchesQuery;
    });
    return matchingLeads.sort((left, right) => {
      if (sortBy === 'followup') {
        const leftDate = left.followUpDate ? new Date(left.followUpDate).getTime() : Number.MAX_SAFE_INTEGER;
        const rightDate = right.followUpDate ? new Date(right.followUpDate).getTime() : Number.MAX_SAFE_INTEGER;
        return leftDate - rightDate;
      }
      if (sortBy === 'value') return Number(right.value || 0) - Number(left.value || 0);
      if (sortBy === 'name') return (left.name || '').localeCompare(right.name || '');
      return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
    });
  }, [leads, query, stageFilter, ownerFilter, followUpFilter, sortBy, currentUser?.name, teamMembers]);

  const duplicateLead = useMemo(() => {
    const email = normalizedEmail(draft.email);
    const phone = normalizedPhone(draft.phone);
    if (!email && phone.length < 7) return null;
    return leads.find((lead) => {
      if (lead.id === draft.id) return false;
      const emailMatches = email && normalizedEmail(lead.email) === email;
      const phoneMatches = phone.length >= 7 && normalizedPhone(lead.phone) === phone;
      return emailMatches || phoneMatches;
    }) || null;
  }, [draft.email, draft.phone, draft.id, leads]);

  useEffect(() => {
    if (isCreatingLead || filteredLeads.some((lead) => lead.id === selectedId)) return;
    setSelectedId(filteredLeads[0]?.id || '');
  }, [filteredLeads, selectedId, isCreatingLead]);

  const stats = useMemo(() => {
    const open = leads.filter((lead) => !['won', 'lost'].includes(lead.status)).length;
    const financePending = leads.filter((lead) => lead.status === 'won' && !lead.financeHandoffAt).length;
    const totalValue = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
    const dueToday = leads.filter((lead) => {
      const days = daysUntil(lead.followUpDate);
      return days !== null && days <= 0 && !['won', 'lost'].includes(lead.status);
    }).length;
    return { total: leads.length, open, financePending, totalValue, dueToday };
  }, [leads]);

  const updateLead = (id, changes, activityText = '', type = 'Update') => {
    const now = new Date().toISOString();
    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== id) return lead;
        const activity = activityText
          ? [{ id: createId('activity'), type, text: activityText, at: now, by: currentUser?.name || 'Team member', byEmail: currentUser?.email || '' }, ...(lead.activities || [])]
          : lead.activities || [];
        return { ...lead, ...changes, updatedAt: now, activities: activity };
      })
    );
  };

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const copyLeadContact = async () => {
    if (!selectedLead) return;
    const details = [selectedLead.name, selectedLead.company, selectedLead.email, selectedLead.phone]
      .filter(Boolean)
      .join('\n');
    try {
      await window.navigator.clipboard.writeText(details);
      setCopiedLeadId(selectedLead.id);
      window.setTimeout(() => setCopiedLeadId(''), 1800);
    } catch {
      setDataError('Unable to copy contact details from this browser.');
    }
  };

  const addFollowUpToCalendar = () => {
    if (!selectedLead?.followUpDate) return;
    const start = selectedLead.followUpDate.replaceAll('-', '');
    const endDate = new Date(`${selectedLead.followUpDate}T12:00:00`);
    endDate.setDate(endDate.getDate() + 1);
    const end = endDate.toISOString().slice(0, 10).replaceAll('-', '');
    const clean = (value) => String(value || '').replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll('\n', '\\n');
    const calendar = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CRMByte//EN', 'BEGIN:VEVENT',
      `UID:${selectedLead.id}@crm.yalabyte.com`, `DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${clean(`Follow up with ${selectedLead.name}`)}`,
      `DESCRIPTION:${clean([selectedLead.company, selectedLead.service, selectedLead.phone, selectedLead.email].filter(Boolean).join(' · '))}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `follow-up-${selectedLead.name || 'lead'}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const prepareFinanceLead = (lead) => {
    const owner = trustedOwnerName(lead.owner, teamMembers);
    const ownerProfile = teamMembers.find((member) => samePersonName(member.name, owner));
    return {
      ...lead,
      owner,
      ownerEmail: ownerProfile?.email || currentUser?.email || ''
    };
  };

  const saveDraft = async (event) => {
    event.preventDefault();
    if (duplicateLead) {
      setActionNotice('');
      setDataError(`Lead already created 😊 You can't create a duplicate deal—open ${duplicateLead.name || 'the existing lead'} instead.`);
      return;
    }
    if (isCreatingLead) {
      const now = new Date().toISOString();
      const lead = {
        ...initialLead,
        ...draft,
        id: draft.id || createId('lead'),
        name: draft.name.trim() || 'New lead',
        owner: trustedOwnerName(draft.owner, teamMembers),
        createdAt: now,
        updatedAt: now,
        activities: [{ id: createId('activity'), type: 'Created', text: 'Lead created manually.', at: now, by: currentUser.name, byEmail: currentUser.email }]
      };
      setSyncState('syncing');
      setDataError('');
      setActionNotice('');
      try {
        if (supabase) await saveLeads([lead]);
        let savedLead = lead;
        let contactError = '';
        if (supabase) {
          try {
            const result = await convertLeadToContact(lead, currentUser);
            savedLead = { ...lead, convertedContactId: result.contact.id, convertedAt: new Date().toISOString() };
            await saveLeads([savedLead]);
          } catch (error) {
            contactError = error.message || 'Contact creation failed.';
          }
        }
        if (savedLead.status === 'won' && supabase) {
          const financeLead = prepareFinanceLead(savedLead);
          await upsertFinanceDealFromLead(financeLead, currentUser);
          savedLead = {
            ...financeLead,
            financeHandoffAt: new Date().toISOString(),
            financeStatus: 'ready_to_invoice',
            activities: [
              { id: createId('activity'), type: 'Finance', text: 'Won deal sent to Finance for invoicing.', at: new Date().toISOString(), by: currentUser.name, byEmail: currentUser.email },
              ...(savedLead.activities || [])
            ]
          };
        }
        setLeads((current) => [savedLead, ...current.filter((item) => item.id !== savedLead.id)]);
        setSelectedId(savedLead.id);
        setIsCreatingLead(false);
        setSyncState('saved');
        if (supabase && !contactError) setActionNotice('Lead and contact created together—no double work needed. 😊');
        if (contactError) setDataError(`Lead saved, but its contact could not be created: ${contactError}`);
        if (supabase) {
          try {
            await notifyCliqNewLead(savedLead, currentUser);
          } catch {
            setDataError('Lead saved, but the Cliq team notification could not be delivered.');
          }
        }
      } catch (error) {
        setSyncState('error');
        setDataError(error.message || 'Unable to create this lead.');
      }
      return;
    }
    if (!selectedLead) return;
    const nextLead = { ...selectedLead, ...draft };
    updateLead(selectedLead.id, draft, 'Lead details updated.');
    if (nextLead.status === 'won') await sendLeadToFinance(nextLead);
    else setActionNotice('Lead changes saved.');
  };

  const createLead = () => {
    setDraft({
      ...initialLead,
      id: createId('lead'),
      owner: trustedOwnerName(currentUser?.name, teamMembers),
      createdAt: '',
      updatedAt: '',
      activities: []
    });
    setSelectedId('');
    setIsCreatingLead(true);
    setActiveWorkspace('leads');
    setMobilePane('detail');
  };

  const cancelCreateLead = () => {
    setIsCreatingLead(false);
    setSelectedId(leads[0]?.id || '');
    setDraft(initialLead);
    setMobilePane('list');
  };

  const addActivity = () => {
    if (!selectedLead || !note.trim()) return;
    updateLead(selectedLead.id, {}, note.trim(), activityType);
    setNote('');
  };

  const currentDraftLead = () => selectedLead ? { ...selectedLead, ...draft, status: draft.status || selectedLead.status } : null;

  const changeStatus = async (status) => {
    if (isCreatingLead) {
      setDraft((current) => ({ ...current, status }));
      return;
    }
    if (!selectedLead) return;
    setDraft((current) => ({ ...current, status }));
    updateLead(selectedLead.id, { ...draft, status }, `Moved to ${stages.find((stage) => stage.id === status)?.label || status}.`, 'Stage');
    if (status === 'won') await sendLeadToFinance({ ...selectedLead, ...draft, status });
  };

  const moveLeadToStage = async (leadId, status) => {
    if (!status) return;
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.status === status) return;
    const label = stages.find((stage) => stage.id === status)?.label || status;
    updateLead(leadId, { status }, `Moved to ${label} from the pipeline.`, 'Stage');
    if (status === 'won') await sendLeadToFinance({ ...lead, status });
  };

  const openLeadWorkspace = (leadId) => {
    setIsCreatingLead(false);
    setSelectedId(leadId);
    setActiveWorkspace('leads');
    setMobilePane('detail');
  };

  const handleConvertLead = async () => {
    if (!selectedLead || converting || selectedLead.convertedContactId) return;
    if (!supabase) {
      setDataError('Lead conversion requires the shared Supabase workspace.');
      return;
    }
    setConverting(true);
    setDataError('');
    setActionNotice('');
    try {
      const result = await convertLeadToContact(selectedLead, currentUser);
      updateLead(selectedLead.id, {
        convertedContactId: result.contact.id,
        convertedAt: new Date().toISOString()
      }, result.created ? 'Converted lead into a contact.' : 'Linked lead to an existing contact.', 'Conversion');
      setActionNotice(result.created ? 'Contact created successfully.' : 'This lead was linked to an existing contact.');
    } catch (error) {
      setDataError(error.message || 'Unable to convert this lead.');
    } finally {
      setConverting(false);
    }
  };

  const sendLeadToFinance = async (lead) => {
    if (!lead || lead.status !== 'won') return;
    if (!supabase) {
      setDataError('Finance handoff requires the shared Supabase workspace.');
      return;
    }
    setFinanceHandoffBusy(true);
    setDataError('');
    try {
      const handoffLead = prepareFinanceLead(lead);
      await upsertFinanceDealFromLead(handoffLead, currentUser);
      updateLead(lead.id, {
        ...handoffLead,
        financeHandoffAt: new Date().toISOString(),
        financeStatus: 'ready_to_invoice'
      }, 'Won deal sent to Finance for invoicing.', 'Finance');
      setActionNotice('Won deal sent to Finance for invoicing.');
    } catch (error) {
      setDataError(error.message || 'Unable to send this won deal to Finance.');
    } finally {
      setFinanceHandoffBusy(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead || deleting) return;
    const actorProfile = teamMembers.find((member) => member.user_id === currentUser.id);
    if (actorProfile?.role && actorProfile.role !== 'admin') {
      setDataError('Only CRM admins can delete leads.');
      return;
    }
    const confirmed = window.confirm(
      `Delete ${selectedLead.name || 'this lead'}? A protected audit copy and deletion notification will be retained.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setDataError('');
    try {
      if (supabase) {
        await deleteLeadWithAudit(selectedLead.id, currentUser.name);
        const updatedNotifications = await fetchDeletionNotifications();
        setNotifications(uniqueNotifications(updatedNotifications));
      } else {
        setNotifications((current) => uniqueNotifications([
          {
            id: createId('deletion'),
            lead_id: selectedLead.id,
            lead_name: selectedLead.name || 'Unnamed lead',
            deleted_by_name: currentUser.name,
            deleted_by_email: currentUser.email,
            deleted_at: new Date().toISOString()
          },
          ...current
        ]));
      }

      const remainingLeads = leads.filter((lead) => lead.id !== selectedLead.id);
      setLeads(remainingLeads);
      setSelectedId(remainingLeads[0]?.id || '');
    } catch (error) {
      setDataError(error.message || 'Unable to delete this lead.');
    } finally {
      setDeleting(false);
    }
  };

  const exportLeads = () => {
    const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `yalabyte-crm-leads-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importLeads = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDataError('');
    setActionNotice('');
    try {
      const imported = JSON.parse(await file.text());
      if (!Array.isArray(imported)) throw new Error('The import file must contain a list of leads.');
      const normalized = imported.filter((lead) => lead && typeof lead === 'object').map((lead) => ({
      ...initialLead,
      ...lead,
      source: lead.source === 'Manual entry' ? 'Team added' : lead.source || initialLead.source,
        id: lead.id || createId('lead'),
        createdAt: lead.createdAt || new Date().toISOString(),
        updatedAt: lead.updatedAt || new Date().toISOString(),
        activities: Array.isArray(lead.activities) ? lead.activities : []
      }));
      setLeads((current) => {
        const merged = new Map(current.map((lead) => [lead.id, lead]));
        normalized.forEach((lead) => merged.set(lead.id, { ...merged.get(lead.id), ...lead }));
        return Array.from(merged.values()).sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0));
      });
      setSelectedId(normalized[0]?.id || selectedId);
      setActionNotice(`${normalized.length} lead${normalized.length === 1 ? '' : 's'} imported safely. Existing records were merged, not replaced.`);
    } catch (error) {
      setDataError(error.message || 'Unable to import this file.');
    } finally {
      event.target.value = '';
    }
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    else window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(WELCOME_SESSION_KEY);
    setWelcomeMode('login');
    setAppUnlocked(!isNativeMobile());
    setCurrentUser(null);
  };

  if (!authReady) {
    return <main className="login-shell flex min-h-screen items-center justify-center text-sm font-semibold text-white">Opening secure CRM…</main>;
  }

  if (!currentUser) {
    return (
      <LoginGate
        onUnlock={(user) => {
          setCurrentUser(user);
          setAppUnlocked(true);
        }}
      />
    );
  }

  if (!appUnlocked) {
    return <NativeUnlockGate onSignOut={signOut} onUnlock={() => setAppUnlocked(true)} user={currentUser} />;
  }

  if (!dataReady) {
    return <WorkspaceLoader compact={welcomeMode === 'refresh'} user={currentUser} />;
  }

  const activeTone = stages.find((stage) => stage.id === draft.status)?.tone || stages[0].tone;
  const ownerOptions = Array.from(new Set(teamMembers.map((member) => member.name).filter(Boolean)));
  const leadOwnerOptions = Array.from(new Set(leads.map((lead) => lead.owner).filter((owner) => isTeamOwner(owner, teamMembers)))).sort();
  const stageCounts = Object.fromEntries(stages.map((stage) => [stage.id, leads.filter((lead) => lead.status === stage.id).length]));
  const activeFilterCount = Number(Boolean(query.trim())) + Number(stageFilter !== 'all') + Number(ownerFilter !== 'all') + Number(followUpFilter !== 'all');
  const currentProfile = teamMembers.find((member) => member.user_id === currentUser.id);
  const hasUnsavedLeadChanges = Boolean(selectedLead && Object.keys(initialLead).some((field) => String(draft[field] ?? '') !== String(selectedLead[field] ?? '')));
  const canDeleteLeads = !currentProfile?.role || currentProfile.role === 'admin';
  const profileStatusTone = currentProfile?.status === 'busy' ? 'bg-rose-500' : currentProfile?.status === 'away' ? 'bg-amber-400' : currentProfile?.status === 'offline' ? 'bg-slate-400' : 'bg-emerald-500';
  const readNotificationIdSet = new Set(readNotificationIds);
  const unreadNotificationCount = notifications.filter((notification) => !readNotificationIdSet.has(notification.id)).length;

  const markAllNotificationsRead = async () => {
    setDataError('');
    const nextIds = Array.from(new Set([...readNotificationIds, ...notifications.map((notification) => notification.id)]));
    setReadNotificationIds(nextIds);
    window.localStorage.setItem(`${READ_NOTIFICATIONS_KEY}:${currentUser.id}`, JSON.stringify(nextIds));
    if (supabase) {
      try {
        await markDeletionNotificationsRead(notifications.map((notification) => notification.id), currentUser.id);
      } catch {
        setDataError('Notifications were cleared here, but could not sync across devices.');
      }
    }
  };
  const changeTeamRole = async (member, role) => {
    setRoleError('');
    if (['admin', 'finance'].includes(role) && member.role !== role) {
      const confirmed = window.confirm(`Grant ${role === 'admin' ? 'Admin' : 'Finance'} access to ${member.name}?`);
      if (!confirmed) return;
    }
    try {
      await setTeamMemberRole(member.user_id, role);
      setTeamMembers((current) => current.map((item) => item.user_id === member.user_id ? { ...item, role } : item));
    } catch (error) {
      setRoleError(error.message || 'Unable to change this role.');
    }
  };

  return (
    <main className="crm-shell min-h-screen text-slate-950">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_16px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2.5 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            <Brand compact />
            <nav className="flex max-w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-100/80 p-1" aria-label="CRM workspace">
              {[['overview', 'Dashboard'], ['leads', 'Leads'], ['pipeline', 'Pipeline'], ['contacts', 'Contacts'], ['support', 'Support'], ['mobile', 'Mobile App']].map(([workspace, label]) => (
                <button className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition sm:px-3.5 sm:text-sm ${activeWorkspace === workspace ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} key={workspace} onClick={() => setActiveWorkspace(workspace)} type="button">{label}</button>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-0.5 hidden text-xs font-semibold text-slate-400 xl:inline">Welcome,</span>
            <button className="mr-1 hidden items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100 sm:flex" onClick={() => setProfileOpen(true)} type="button" title="Update profile">
              <span className="relative h-10 w-10 shrink-0">
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-navy-950 text-xs font-extrabold uppercase text-cyanbrand-400">
                  {currentProfile?.avatar_url ? <img className="h-full w-full object-cover" src={currentProfile.avatar_url} alt="" /> : currentUser.name?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'YB'}
                </span>
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${profileStatusTone}`} />
              </span>
              <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-xs text-slate-500">
                {currentProfile?.status ? `${currentProfile.status[0].toUpperCase()}${currentProfile.status.slice(1)}` : 'Available'} · {syncState === 'syncing' ? 'Saving…' : syncState === 'error' ? 'Sync issue' : 'Synced'}
              </p>
              </div>
            </button>
            <button className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-navy-950 text-xs font-extrabold uppercase text-cyanbrand-400 sm:hidden" onClick={() => setProfileOpen(true)} type="button" aria-label="Update profile">
              {currentProfile?.avatar_url ? <img className="h-full w-full object-cover" src={currentProfile.avatar_url} alt="" /> : currentUser.name?.split(' ').map((part) => part[0]).slice(0, 2).join('') || 'YB'}
            </button>
            <div className="relative">
              <button
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${notificationsOpen ? 'border-cyanbrand-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setAccessOpen(false);
                }}
                type="button"
                aria-label="Open notifications"
                title="Notifications"
              >
                <BellIcon />
                {unreadNotificationCount ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 py-0.5 text-[9px] font-extrabold text-white">
                    {unreadNotificationCount}
                  </span>
                ) : null}
              </button>
              {notificationsOpen ? (
                <div className="absolute right-0 top-12 z-40 w-[min(92vw,390px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-950">Lead deletion log</p>
                      <p className="mt-0.5 text-xs text-slate-500">Protected audit copies are retained in Supabase.</p>
                    </div>
                    {unreadNotificationCount ? (
                      <button className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-200" onClick={markAllNotificationsRead} type="button">
                        Mark all read
                      </button>
                    ) : null}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div className="border-b border-slate-100 px-4 py-3 last:border-0" key={notification.id}>
                        <p className="text-sm font-semibold text-slate-900">
                          <span className="text-rose-600">Deleted:</span> {notification.lead_name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          By {notification.deleted_by_name} · {formatDate(notification.deleted_at)}
                        </p>
                      </div>
                    ))}
                    {!notifications.length ? <p className="px-4 py-6 text-center text-sm text-slate-500">No deleted leads.</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
            {currentProfile?.role === 'admin' ? (
              <div className="relative">
                <button
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${accessOpen ? 'border-cyanbrand-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  onClick={() => {
                    setAccessOpen((open) => !open);
                    setNotificationsOpen(false);
                  }}
                  type="button"
                  aria-label="Manage team access"
                  title="Team access"
                >
                  <GearIcon />
                </button>
                {accessOpen ? (
                  <div className="absolute right-0 top-12 z-40 w-[min(92vw,520px)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="font-bold text-slate-950">Team access</p>
                      <p className="mt-0.5 text-xs text-slate-500">Manage CRM roles and Finance access without crowding the dashboard.</p>
                    </div>
                    {roleError ? <p className="mx-4 mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{roleError}</p> : null}
                    <div className="max-h-96 overflow-y-auto p-3">
                      {teamMembers.map((member) => (
                        <div className="mb-2 flex items-center gap-3 rounded-xl border border-slate-200 p-3 last:mb-0" key={member.user_id}>
                          <TeamAvatar name={member.name} teamMembers={teamMembers} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">{member.name}</p>
                            <p className="truncate text-xs text-slate-400">{member.email}</p>
                          </div>
                          <select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-600 outline-none focus:border-cyanbrand-500" value={member.role || 'member'} onChange={(event) => changeTeamRole(member, event.target.value)}>
                            <option value="member">Member</option>
                            <option value="finance">Finance</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:flex" onClick={exportLeads} aria-label="Export leads" title="Export leads">
              <ExportIcon />
            </button>
            <button className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:flex" onClick={() => importInputRef.current?.click()} aria-label="Import leads" title="Import leads">
              <ImportIcon />
            </button>
            <input ref={importInputRef} className="hidden" type="file" accept="application/json" onChange={importLeads} />
            <button
              className="rounded-xl bg-cyanbrand-500 px-4 py-2.5 text-sm font-extrabold text-navy-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyanbrand-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreatingLead}
              onClick={createLead}
            >
              <span className="sm:hidden">{isCreatingLead ? 'Drafting…' : 'New'}</span>
              <span className="hidden sm:inline">{isCreatingLead ? 'Drafting…' : 'New Lead'}</span>
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" onClick={signOut} aria-label="Sign out" title="Sign out">
              <SignOutIcon />
            </button>
        </div>
      </div>
      <MobileInstallNotice onOpen={() => setActiveWorkspace('mobile')} />
      {activeWorkspace === 'leads' ? <div className="mx-auto grid max-w-[1500px] grid-cols-2 overflow-hidden border-t border-slate-200 bg-slate-50/70 sm:grid-cols-4">
          <Stat label="Total leads" value={stats.total} icon="leads" tone="cyan" />
          <Stat label="Open leads" value={stats.open} icon="open" tone="sky" />
          <Stat label="Pipeline value" value={money(stats.totalValue)} icon="pipeline" tone="emerald" />
          <Stat label="Finance pending" value={stats.financePending} icon="pipeline" tone="violet" />
          <Stat label="Due now" value={stats.dueToday} icon="due" tone="amber" />
        </div> : null}
      </div>

      {dataError ? (
        <div className="mx-auto mt-4 max-w-[1500px] px-4 sm:px-6">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{dataError}</p>
        </div>
      ) : null}
      {actionNotice ? (
        <div className="mx-auto mt-4 max-w-[1500px] px-4 sm:px-6">
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{actionNotice}</p>
        </div>
      ) : null}

      {activeWorkspace === 'overview' ? (
        <OverviewView
          currentUser={currentUser}
          leads={leads}
          onOpenLead={openLeadWorkspace}
          onOpenSupport={() => setActiveWorkspace('support')}
          teamMembers={teamMembers}
        />
      ) : activeWorkspace === 'pipeline' ? (
        <PipelineBoard leads={leads} stages={stages} teamMembers={teamMembers} onMove={moveLeadToStage} onOpenLead={openLeadWorkspace} />
      ) : activeWorkspace === 'contacts' ? (
        <ContactsView currentUser={currentUser} teamMembers={teamMembers} />
      ) : activeWorkspace === 'support' ? (
        <SupportView currentUser={currentUser} leads={leads} teamMembers={teamMembers} />
      ) : activeWorkspace === 'mobile' ? (
        <MobileAppView />
      ) : (
        <>
      <div className="mx-auto grid max-w-[1500px] items-start gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={`${mobilePane === 'detail' ? 'hidden md:block' : 'block'} overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-card sm:rounded-2xl`}>
          <div className="border-b border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">Pipeline</p>
                <h2 className="mt-0.5 text-lg font-extrabold tracking-tight">Lead opportunities</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 sm:hidden" onClick={() => setMobileFiltersOpen((open) => !open)} type="button">
                  Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
                </button>
                <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{filteredLeads.length} shown</span>
              </div>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon /></span>
              <input
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100"
                placeholder="Search leads, companies, owners…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className={`${mobileFiltersOpen ? 'block' : 'hidden'} sm:block`}>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className={`rounded-lg px-3 py-2.5 text-xs font-bold transition ${ownerFilter === 'mine' ? 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setOwnerFilter((current) => current === 'mine' ? 'all' : 'mine')}
                type="button"
              >
                My Leads
              </button>
              <button
                className={`rounded-lg px-3 py-2.5 text-xs font-bold transition ${followUpFilter === 'overdue' ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setFollowUpFilter((current) => current === 'overdue' ? 'all' : 'overdue')}
                type="button"
              >
                Overdue follow-ups
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Owner
                <select className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-cyanbrand-500" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
                  <option value="all">All owners</option>
                  <option value="mine">My leads</option>
                  <option value="unassigned">Unassigned</option>
                  {leadOwnerOptions.filter((owner) => !samePersonName(owner, currentUser.name)).map((owner) => <option key={owner} value={`owner:${owner}`}>{owner}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Follow-up
                <select className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-cyanbrand-500" value={followUpFilter} onChange={(event) => setFollowUpFilter(event.target.value)}>
                  <option value="all">Any date</option>
                  <option value="overdue">Overdue</option>
                  <option value="today">Due today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="none">No date</option>
                </select>
              </label>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <label className="min-w-0 flex-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                Sort leads
                <select className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-700 outline-none focus:border-cyanbrand-500" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="newest">Recently updated</option>
                  <option value="followup">Follow-up date</option>
                  <option value="value">Highest value</option>
                  <option value="name">Name A–Z</option>
                </select>
              </label>
              {activeFilterCount ? (
                <button
                  className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => {
                    setQuery('');
                    setStageFilter('all');
                    setOwnerFilter('all');
                    setFollowUpFilter('all');
                  }}
                  type="button"
                >
                  Clear {activeFilterCount}
                </button>
              ) : null}
            </div>
            <p className="mb-2 mt-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Pipeline stage</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                className={`flex items-center justify-between gap-1 rounded-lg px-2 py-2 text-xs font-bold transition ${stageFilter === 'all' ? 'bg-slate-950 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setStageFilter('all')}
                type="button"
              >
                <span>All</span><span className="opacity-60">{leads.length}</span>
              </button>
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  className={`flex items-center justify-between gap-1 rounded-lg px-2 py-2 text-xs font-bold transition ${stageFilter === stage.id ? 'bg-slate-950 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  onClick={() => setStageFilter(stage.id)}
                  type="button"
                >
                  <span>{stage.label}</span><span className="opacity-60">{stageCounts[stage.id] || 0}</span>
                </button>
              ))}
            </div>
            </div>
          </div>
          <div className="max-h-[calc(100vh-285px)] overflow-y-auto sm:max-h-[calc(100vh-485px)]">
            {filteredLeads.map((lead) => {
              const due = daysUntil(lead.followUpDate);
              return (
                <button
                  key={lead.id}
                  className={`relative block w-full border-b border-slate-100 p-3 text-left transition hover:bg-slate-50 sm:p-4 ${selectedLead?.id === lead.id ? 'border-l-4 border-l-cyanbrand-500 bg-cyan-50/70' : 'border-l-4 border-l-transparent bg-white'}`}
                  onClick={() => {
                    setIsCreatingLead(false);
                    setSelectedId(lead.id);
                    setMobilePane('detail');
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{lead.name || 'Unnamed lead'}</p>
                      <p className="mt-1 text-sm text-slate-500">{lead.company || lead.email || 'No company'}</p>
                    </div>
                    <span className={`rounded-md border px-2 py-1 text-xs font-bold ${stages.find((stage) => stage.id === lead.status)?.tone || stages[0].tone}`}>
                      {stages.find((stage) => stage.id === lead.status)?.label || 'New'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="truncate">{lead.service}</span>
                    <span className="shrink-0 font-semibold text-slate-700">{money(lead.value)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex min-w-0 items-center gap-1.5 truncate font-medium text-slate-600">
                      <TeamAvatar name={trustedOwnerName(lead.owner, teamMembers)} teamMembers={teamMembers} size="sm" />
                      <span className="truncate">{trustedOwnerName(lead.owner, teamMembers) || 'Unassigned'}</span>
                    </span>
                    {due < 0 ? <span className="rounded-md bg-rose-50 px-2 py-1 font-bold text-rose-700">Overdue {Math.abs(due)}d</span>
                      : due === 0 ? <span className="rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-700">Due today</span>
                      : <span>{formatDate(lead.followUpDate)}</span>}
                  </div>
                </button>
              );
            })}
            {!filteredLeads.length ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">No leads match this view</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Try clearing the filters or changing your search.</p>
                {activeFilterCount ? <button className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200" onClick={() => { setQuery(''); setStageFilter('all'); setOwnerFilter('all'); setFollowUpFilter('all'); }} type="button">Clear filters</button> : null}
              </div>
            ) : null}
          </div>
        </aside>

        <section className={`${mobilePane === 'list' ? 'hidden md:grid' : 'grid'} items-start gap-3 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]`}>
          <form className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card sm:rounded-2xl sm:p-6" onSubmit={saveDraft}>
            {selectedLead || isCreatingLead ? (
              <>
                <button className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 md:hidden" onClick={() => setMobilePane('list')} type="button">
                  <span aria-hidden="true">←</span> Back to leads
                </button>
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    {isCreatingLead ? (
                      <span className="inline-flex rounded-md border border-violet-100 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">Unsaved draft</span>
                    ) : (
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${activeTone}`}>
                      {stages.find((stage) => stage.id === draft.status)?.label}
                    </span>
                    )}
                    <h2 className="mt-3 text-2xl font-semibold tracking-normal">{isCreatingLead ? 'Create a new lead' : draft.name || 'Unnamed lead'}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {isCreatingLead ? 'Nothing is saved to the database until you create this lead.' : `Created ${formatDate(draft.createdAt)} from ${draft.source || 'Unknown source'}`}
                    </p>
                    {!isCreatingLead ? <p className={`mt-1 text-xs font-semibold ${hasUnsavedLeadChanges ? 'text-amber-600' : 'text-emerald-600'}`}>{hasUnsavedLeadChanges ? 'Unsaved changes' : 'All changes saved'}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {isCreatingLead ? (
                      <>
                        <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50" onClick={cancelCreateLead} type="button">Cancel</button>
                        <button className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40" disabled={Boolean(duplicateLead)} type="submit">{duplicateLead ? 'Duplicate found' : 'Create lead'}</button>
                      </>
	                    ) : <>
	                      {draft.status === 'won' ? (
	                        <div className="flex flex-wrap items-center gap-2">
	                          <button className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60" disabled={financeHandoffBusy} onClick={() => sendLeadToFinance(currentDraftLead())} title="Save and send this won lead to Finance" type="button">{financeHandoffBusy ? 'Sending…' : selectedLead?.financeHandoffAt ? 'Refresh Finance' : hasUnsavedLeadChanges ? 'Save & send to Finance' : 'Send to Finance'}</button>
	                          {financeAppUrl ? <a className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-100" href={financeAppUrl} rel="noreferrer" target="_blank">Open Finance</a> : null}
	                        </div>
	                      ) : null}
                      {draft.convertedContactId ? <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700"><span aria-hidden="true">✓</span> Contact linked</span> : (
                        <button className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-800 hover:bg-cyan-100 disabled:opacity-60" disabled={converting} onClick={handleConvertLead} type="button">{converting ? 'Converting…' : 'Convert to contact'}</button>
                      )}
                      {canDeleteLeads ? (
                        <button
                          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-wait disabled:opacity-60"
                          disabled={deleting}
                          onClick={handleDeleteLead}
                          type="button"
                        >
                          {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                      ) : null}
                      {hasUnsavedLeadChanges ? <button className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40" disabled={Boolean(duplicateLead)} type="submit">{duplicateLead ? 'Duplicate found' : 'Save changes'}</button> : null}
                    </>}
                  </div>
                </div>

                {!isCreatingLead && (draft.email || draft.phone) ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                    <span className="mr-auto w-full px-1.5 text-xs font-semibold text-slate-500 sm:w-auto">Quick contact</span>
                    {draft.email ? (
                      <a className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 sm:flex-none" href={`mailto:${draft.email}?subject=${encodeURIComponent(`Following up from YalaByte${draft.company ? ` — ${draft.company}` : ''}`)}&body=${encodeURIComponent(`Hi ${draft.name || 'there'},\n\n`)}`}>
                        Email lead
                      </a>
                    ) : null}
                    {draft.phone ? (
                      <a className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 sm:flex-none" href={`tel:${draft.phone.replace(/\s/g, '')}`}>
                        Call lead
                      </a>
                    ) : null}
                    <button className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 sm:flex-none" onClick={copyLeadContact} type="button">
                      {copiedLeadId === selectedLead?.id ? 'Copied!' : 'Copy details'}
                    </button>
                    {draft.followUpDate ? <button className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700 sm:flex-none" onClick={addFollowUpToCalendar} type="button">Add to calendar</button> : null}
                  </div>
                ) : null}

                {duplicateLead ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-900">Lead already created 😊</p>
                      <p className="mt-0.5 text-xs leading-5 text-amber-700">You can't create a duplicate deal. {duplicateLead.name || 'An existing lead'} already uses this email address or phone number.</p>
                    </div>
                    <button
                      className="shrink-0 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                      onClick={() => {
                        setIsCreatingLead(false);
                        setSelectedId(duplicateLead.id);
                        setOwnerFilter('all');
                        setFollowUpFilter('all');
                        setStageFilter('all');
                      }}
                      type="button"
                    >
                      Open existing
                    </button>
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Name
                    <input className={fieldClass()} name="name" value={draft.name} onChange={handleDraftChange} />
                  </label>
                  <label className="text-sm font-semibold">
                    Company
                    <input className={fieldClass()} name="company" value={draft.company} onChange={handleDraftChange} />
                  </label>
                  <label className="text-sm font-semibold">
                    Email
                    <input className={fieldClass()} name="email" type="email" value={draft.email} onChange={handleDraftChange} />
                  </label>
                  <label className="text-sm font-semibold">
                    Phone
                    <input className={fieldClass()} name="phone" value={draft.phone} onChange={handleDraftChange} />
                  </label>
                  <label className="text-sm font-semibold">
                    Service
                    <select className={fieldClass()} name="service" value={draft.service} onChange={handleDraftChange}>
                      {services.map((service) => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Status
                    <select className={fieldClass()} name="status" value={draft.status} onChange={handleDraftChange}>
                      {stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>{stage.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Priority
                    <select className={fieldClass()} name="priority" value={draft.priority} onChange={handleDraftChange}>
                      {priorities.map((priority) => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    Owner
                    <select className={fieldClass()} name="owner" value={draft.owner} onChange={handleDraftChange}>
                      <option value="">Unassigned</option>
                      {ownerOptions.map((owner) => (
                        <option key={owner} value={owner}>{owner}</option>
                      ))}
                    </select>
                    <span className="mt-1.5 block text-xs font-normal text-slate-400">Team members appear after their first CRM sign-in.</span>
                  </label>
                  <label className="text-sm font-semibold">
                    Estimated value (NPR)
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-[19px] text-sm font-semibold text-slate-500">Rs</span>
                      <input className={`${fieldClass()} pl-10`} name="value" type="number" min="0" step="1000" value={draft.value} onChange={handleDraftChange} />
                    </div>
                  </label>
                  <label className="text-sm font-semibold">
                    Follow-up date
                    <input className={fieldClass()} name="followUpDate" type="date" value={draft.followUpDate} onChange={handleDraftChange} />
                  </label>
                </div>

                <label className="mt-4 block text-sm font-semibold">
                  Client message
                  <textarea className={`${fieldClass()} min-h-28`} name="message" value={draft.message} onChange={handleDraftChange} />
                </label>
                <label className="mt-4 block text-sm font-semibold">
                  Internal notes
                  <textarea className={`${fieldClass()} min-h-28`} name="notes" value={draft.notes} onChange={handleDraftChange} />
                </label>
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">Choose a lead or adjust the current filters.</div>
            )}
          </form>

          <aside className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-card sm:rounded-2xl sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700">Lead roadmap</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight">Progress</h3>
            <ProgressRoadmap status={draft.status} onChange={changeStatus} />

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold tracking-normal">Activity</h3>
              {isCreatingLead ? (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-500">Activity tracking begins after the lead is created.</p>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-[110px_1fr] gap-2">
                    <select className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-600 outline-none focus:border-cyanbrand-500" value={activityType} onChange={(event) => setActivityType(event.target.value)}>
                      <option>Note</option><option>Call</option><option>Email</option><option>Meeting</option>
                    </select>
                    <span className="self-center text-right text-[11px] font-medium text-slate-400">Logged as {currentUser.name}</span>
                  </div>
                  <textarea
                    className={`${fieldClass()} min-h-24`}
                    placeholder="Add progress note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <button className="mt-2 w-full rounded-md bg-cyanbrand-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyanbrand-400" onClick={addActivity} type="button">
                    Add {activityType}
                  </button>
                  <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                    {(selectedLead?.activities || []).map((activity) => (
                      <div key={activity.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-950">{activity.text}</p>
                        <p className="mt-1 text-xs text-slate-500">{activity.type || 'Update'} · {activity.by || 'Team member'} · {formatDate(activity.at)}</p>
                      </div>
                    ))}
                    {!selectedLead?.activities?.length ? <p className="text-sm text-slate-500">No activity yet.</p> : null}
                  </div>
                </>
              )}
            </div>
            {!isCreatingLead && selectedLead ? <LeadTasks currentUser={currentUser} lead={selectedLead} onActivity={(text, type) => updateLead(selectedLead.id, {}, text, type)} teamMembers={teamMembers} /> : null}
	            {!isCreatingLead && selectedLead?.status === 'won' ? (
	              <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3">
	                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
	                  <div>
	                    <h3 className="text-sm font-extrabold text-violet-950">Finance handoff</h3>
	                    <p className="mt-0.5 text-xs leading-5 text-violet-700">{selectedLead.financeHandoffAt ? `Synced ${formatDate(selectedLead.financeHandoffAt)}.` : 'Ready to send for invoicing.'}</p>
	                  </div>
	                  <div className="flex flex-wrap gap-2">
	                    <button className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60" disabled={financeHandoffBusy} onClick={() => sendLeadToFinance(currentDraftLead())} type="button">{financeHandoffBusy ? 'Sending…' : selectedLead.financeHandoffAt ? 'Refresh' : hasUnsavedLeadChanges ? 'Save & send' : 'Send'}</button>
	                    {financeAppUrl ? <a className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-violet-700 ring-1 ring-violet-100 hover:bg-violet-100" href={financeAppUrl} rel="noreferrer" target="_blank">Open</a> : null}
	                  </div>
	                </div>
	              </div>
	            ) : null}
          </aside>
        </section>
      </div>
        </>
      )}
      {profileOpen ? (
        <ProfileModal
          currentUser={currentUser}
          profile={currentProfile}
          onClose={() => setProfileOpen(false)}
          onSaved={(updated) => {
            setTeamMembers((current) => current.some((member) => member.user_id === updated.user_id)
              ? current.map((member) => member.user_id === updated.user_id ? updated : member)
              : [...current, updated]);
            setCurrentUser((current) => ({ ...current, name: updated.name }));
            setProfileOpen(false);
          }}
        />
      ) : null}
	    </main>
  );
}
