import { useEffect, useMemo, useRef, useState } from 'react';
import ContactsView from './ContactsView';
import ProfileModal from './ProfileModal';
import {
  deleteLeadWithAudit,
  fetchDeletionNotifications,
  fetchLeads,
  fetchTeamMembers,
  notifyCliqNewLead,
  registerTeamMember,
  saveLeads,
  supabase,
  toCRMUser
} from './supabase';

const STORAGE_KEY = 'yalabyte-crm-leads';
const SESSION_KEY = 'yalabyte-crm-session';
const ACCOUNTS_KEY = 'yalabyte-crm-accounts';
const READ_NOTIFICATIONS_KEY = 'yalabyte-crm-read-notifications';
const ALLOWED_EMAIL_DOMAIN = 'yalabyte.com';

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
  source: 'Manual entry',
  message: '',
  notes: ''
};

const sampleLeads = [
  {
    id: 'lead-sample-1',
    name: 'Aarav Sharma',
    email: 'aarav@example.com',
    phone: '+977 9800000000',
    company: 'Himalayan Travel Co.',
    service: 'Business Website Design',
    status: 'new',
    priority: 'High',
    owner: 'Paul',
    value: '150000',
    followUpDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    source: 'Website form',
    message: 'Needs a polished travel website with inquiry forms and package pages.',
    notes: 'Ask about package categories, payment flow, and launch timeline.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [
      {
        id: 'activity-sample-1',
        type: 'Created',
        text: 'Lead created from website form.',
        at: new Date().toISOString()
      }
    ]
  },
  {
    id: 'lead-sample-2',
    name: 'Maya Rai',
    email: 'maya@example.com',
    phone: '',
    company: 'Studio North',
    service: 'Custom Web Applications',
    status: 'proposal',
    priority: 'Medium',
    owner: 'YalaByte',
    value: '420000',
    followUpDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    source: 'Referral',
    message: 'Looking for a client portal and internal project dashboard.',
    notes: 'Proposal sent. Waiting on scope approval.',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    activities: [
      {
        id: 'activity-sample-2',
        type: 'Proposal',
        text: 'Proposal shared for review.',
        at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }
];

function createId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}-${window.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readLeads() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : sampleLeads;
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
    amber: 'border-amber-100 bg-amber-50 text-amber-700'
  };
  return (
    <div className="group flex items-center gap-3 border-r border-slate-200/80 px-5 py-4 transition hover:bg-white last:border-r-0">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tones[tone] || tones.cyan}`}>
        <MetricIcon type={icon} />
      </span>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-500">{label}</p>
        <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">{value}</p>
      </div>
    </div>
  );
}

function Brand({ compact = false, inverted = false }) {
  return (
    <div className="flex items-center gap-3">
      <img
        className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-xl object-cover shadow-sm`}
        src="/favicon.png"
        alt="YalaByte logo"
      />
      <div>
        <p className={`${compact ? 'text-lg' : 'text-xl'} font-extrabold tracking-tight ${inverted ? 'text-white' : 'text-slate-950'}`}>
          Yala<span className="text-cyanbrand-500">Byte</span>
        </p>
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${inverted ? 'text-slate-400' : 'text-slate-500'}`}>Team CRM</p>
      </div>
    </div>
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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

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
      onUnlock(toCRMUser(data.user));
    } catch (authError) {
      setError(authError.message || 'Unable to authenticate. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-shell min-h-screen px-5 py-8 text-white sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white shadow-soft lg:grid-cols-[1.05fr_0.95fr]">
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

          <form className="p-7 text-slate-950 sm:p-10" onSubmit={handleSubmit}>
            <div className="lg:hidden"><Brand /></div>
            <div className="mt-8 lg:mt-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">Secure access</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Use your company email to continue to the YalaByte lead workspace.</p>
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
  const [dataReady, setDataReady] = useState(false);
  const [syncState, setSyncState] = useState('saved');
  const [dataError, setDataError] = useState('');
  const [leads, setLeads] = useState(readLeads);
  const [selectedId, setSelectedId] = useState(() => readLeads()[0]?.id || '');
  const [draft, setDraft] = useState(initialLead);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [followUpFilter, setFollowUpFilter] = useState('all');
  const [note, setNote] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('leads');
  const [profileOpen, setProfileOpen] = useState(false);
  const importInputRef = useRef(null);

  const selectedLead = isCreatingLead ? null : leads.find((lead) => lead.id === selectedId) || null;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

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

    fetchLeads()
      .then(async (remoteLeads) => {
        if (!active) return;
        const [membersResult, notificationsResult] = await Promise.allSettled([
          registerTeamMember(currentUser).then(() => fetchTeamMembers()),
          fetchDeletionNotifications()
        ]);
        const nextLeads = remoteLeads.length ? remoteLeads : readLeads();
        if (!remoteLeads.length && nextLeads.length) await saveLeads(nextLeads);
        if (!active) return;
        setLeads(nextLeads);
        if (membersResult.status === 'fulfilled') setTeamMembers(membersResult.value);
        if (notificationsResult.status === 'fulfilled') setNotifications(notificationsResult.value);
        if (membersResult.status === 'rejected' || notificationsResult.status === 'rejected') {
          setDataError('Team ownership and audit features require the latest Supabase migration.');
        }
        setSelectedId(nextLeads[0]?.id || '');
        setDataReady(true);
      })
      .catch((error) => {
        if (!active) return;
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
        setNotifications((current) => [payload.new, ...current].slice(0, 30));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dataReady, currentUser?.id]);

  useEffect(() => {
    if (isCreatingLead) return;
    if (selectedLead) {
      setDraft({ ...initialLead, ...selectedLead });
      setNote('');
    } else {
      setDraft(initialLead);
    }
  }, [selectedLead?.id, isCreatingLead]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStage = stageFilter === 'all' || lead.status === stageFilter;
      const matchesOwner = ownerFilter === 'all'
        || (ownerFilter === 'mine' && samePersonName(lead.owner, currentUser?.name))
        || (ownerFilter === 'unassigned' && !lead.owner)
        || (ownerFilter.startsWith('owner:') && samePersonName(lead.owner, ownerFilter.slice(6)));
      const due = daysUntil(lead.followUpDate);
      const isClosed = ['won', 'lost'].includes(lead.status);
      const matchesFollowUp = followUpFilter === 'all'
        || (followUpFilter === 'overdue' && due !== null && due < 0 && !isClosed)
        || (followUpFilter === 'today' && due === 0 && !isClosed)
        || (followUpFilter === 'upcoming' && due !== null && due > 0 && !isClosed)
        || (followUpFilter === 'none' && due === null && !isClosed);
      const matchesQuery =
        !normalizedQuery ||
        [lead.name, lead.email, lead.phone, lead.company, lead.service, lead.owner, lead.source]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStage && matchesOwner && matchesFollowUp && matchesQuery;
    });
  }, [leads, query, stageFilter, ownerFilter, followUpFilter, currentUser?.name]);

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
    const totalValue = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
    const dueToday = leads.filter((lead) => {
      const days = daysUntil(lead.followUpDate);
      return days !== null && days <= 0 && !['won', 'lost'].includes(lead.status);
    }).length;
    return { total: leads.length, open, totalValue, dueToday };
  }, [leads]);

  const updateLead = (id, changes, activityText = '') => {
    const now = new Date().toISOString();
    setLeads((current) =>
      current.map((lead) => {
        if (lead.id !== id) return lead;
        const activity = activityText
          ? [{ id: createId('activity'), type: 'Update', text: activityText, at: now }, ...(lead.activities || [])]
          : lead.activities || [];
        return { ...lead, ...changes, updatedAt: now, activities: activity };
      })
    );
  };

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const saveDraft = async (event) => {
    event.preventDefault();
    if (isCreatingLead) {
      const now = new Date().toISOString();
      const lead = {
        ...initialLead,
        ...draft,
        id: draft.id || createId('lead'),
        name: draft.name.trim() || 'New lead',
        owner: draft.owner || currentUser?.name || '',
        createdAt: now,
        updatedAt: now,
        activities: [{ id: createId('activity'), type: 'Created', text: 'Lead created manually.', at: now }]
      };
      setSyncState('syncing');
      setDataError('');
      try {
        if (supabase) await saveLeads([lead]);
        setLeads((current) => [lead, ...current]);
        setSelectedId(lead.id);
        setIsCreatingLead(false);
        setSyncState('saved');
        if (supabase) notifyCliqNewLead(lead, currentUser).catch(() => {
          setDataError('Lead saved, but the Cliq team notification could not be delivered.');
        });
      } catch (error) {
        setSyncState('error');
        setDataError(error.message || 'Unable to create this lead.');
      }
      return;
    }
    if (!selectedLead) return;
    updateLead(selectedLead.id, draft, 'Lead details updated.');
  };

  const createLead = () => {
    setDraft({
      ...initialLead,
      id: createId('lead'),
      owner: currentUser?.name || '',
      createdAt: '',
      updatedAt: '',
      activities: []
    });
    setSelectedId('');
    setIsCreatingLead(true);
  };

  const cancelCreateLead = () => {
    setIsCreatingLead(false);
    setSelectedId(leads[0]?.id || '');
    setDraft(initialLead);
  };

  const addActivity = () => {
    if (!selectedLead || !note.trim()) return;
    updateLead(selectedLead.id, {}, note.trim());
    setNote('');
  };

  const changeStatus = (status) => {
    if (isCreatingLead) {
      setDraft((current) => ({ ...current, status }));
      return;
    }
    if (!selectedLead) return;
    const label = stages.find((stage) => stage.id === status)?.label || status;
    setDraft((current) => ({ ...current, status }));
    updateLead(selectedLead.id, { status }, `Status changed to ${label}.`);
  };

  const handleDeleteLead = async () => {
    if (!selectedLead || deleting) return;
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
        setNotifications(updatedNotifications);
      } else {
        setNotifications((current) => [
          {
            id: createId('deletion'),
            lead_id: selectedLead.id,
            lead_name: selectedLead.name || 'Unnamed lead',
            deleted_by_name: currentUser.name,
            deleted_by_email: currentUser.email,
            deleted_at: new Date().toISOString()
          },
          ...current
        ]);
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
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!Array.isArray(imported)) return;
    const normalized = imported.map((lead) => ({
      ...initialLead,
      ...lead,
      id: lead.id || createId('lead'),
      createdAt: lead.createdAt || new Date().toISOString(),
      updatedAt: lead.updatedAt || new Date().toISOString(),
      activities: Array.isArray(lead.activities) ? lead.activities : []
    }));
    setLeads(normalized);
    setSelectedId(normalized[0]?.id || '');
    event.target.value = '';
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    else window.localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  if (!authReady) {
    return <main className="login-shell flex min-h-screen items-center justify-center text-sm font-semibold text-white">Opening secure CRM…</main>;
  }

  if (!currentUser) {
    return <LoginGate onUnlock={setCurrentUser} />;
  }

  if (!dataReady) {
    return <main className="login-shell flex min-h-screen items-center justify-center text-sm font-semibold text-white">Loading shared leads…</main>;
  }

  const activeTone = stages.find((stage) => stage.id === draft.status)?.tone || stages[0].tone;
  const ownerOptions = Array.from(new Set([...teamMembers.map((member) => member.name), draft.owner].filter(Boolean)));
  const leadOwnerOptions = Array.from(new Set(leads.map((lead) => lead.owner).filter(Boolean))).sort();
  const currentProfile = teamMembers.find((member) => member.user_id === currentUser.id);
  const profileStatusTone = currentProfile?.status === 'busy' ? 'bg-rose-500' : currentProfile?.status === 'away' ? 'bg-amber-400' : currentProfile?.status === 'offline' ? 'bg-slate-400' : 'bg-emerald-500';
  const readNotificationIdSet = new Set(readNotificationIds);
  const unreadNotificationCount = notifications.filter((notification) => !readNotificationIdSet.has(notification.id)).length;

  const markAllNotificationsRead = () => {
    const nextIds = Array.from(new Set([...readNotificationIds, ...notifications.map((notification) => notification.id)]));
    setReadNotificationIds(nextIds);
    window.localStorage.setItem(`${READ_NOTIFICATIONS_KEY}:${currentUser.id}`, JSON.stringify(nextIds));
  };

  return (
    <main className="crm-shell min-h-screen text-slate-950">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_16px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            <Brand compact />
            <nav className="flex rounded-xl border border-slate-200/80 bg-slate-100/80 p-1" aria-label="CRM workspace">
              <button className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${activeWorkspace === 'leads' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setActiveWorkspace('leads')} type="button">Leads</button>
              <button className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${activeWorkspace === 'contacts' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} onClick={() => setActiveWorkspace('contacts')} type="button">Contacts</button>
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                onClick={() => setNotificationsOpen((open) => !open)}
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
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50" onClick={exportLeads} aria-label="Export leads" title="Export leads">
              <ExportIcon />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50" onClick={() => importInputRef.current?.click()} aria-label="Import leads" title="Import leads">
              <ImportIcon />
            </button>
            <input ref={importInputRef} className="hidden" type="file" accept="application/json" onChange={importLeads} />
            <button
              className="rounded-xl bg-cyanbrand-500 px-4 py-2.5 text-sm font-extrabold text-navy-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyanbrand-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCreatingLead}
              onClick={createLead}
            >
              {isCreatingLead ? 'Drafting…' : 'New Lead'}
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" onClick={signOut} aria-label="Sign out" title="Sign out">
              <SignOutIcon />
            </button>
          </div>
        </div>
        {activeWorkspace === 'leads' ? <div className="mx-auto grid max-w-[1500px] grid-cols-2 overflow-hidden border-t border-slate-200 bg-slate-50/70 sm:grid-cols-4">
          <Stat label="Total leads" value={stats.total} icon="leads" tone="cyan" />
          <Stat label="Open leads" value={stats.open} icon="open" tone="sky" />
          <Stat label="Pipeline value" value={money(stats.totalValue)} icon="pipeline" tone="emerald" />
          <Stat label="Due now" value={stats.dueToday} icon="due" tone="amber" />
        </div> : null}
      </div>

      {activeWorkspace === 'contacts' ? (
        <ContactsView currentUser={currentUser} teamMembers={teamMembers} />
      ) : (
        <>
      {dataError ? (
        <div className="mx-auto mt-4 max-w-[1500px] px-4 sm:px-6">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{dataError}</p>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[360px_1fr]">
        <aside className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card">
          <div className="border-b border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">Pipeline</p>
                <h2 className="mt-0.5 text-lg font-extrabold tracking-tight">Lead opportunities</h2>
              </div>
              <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{filteredLeads.length} shown</span>
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
            <p className="mb-2 mt-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Filter by stage</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                className={`rounded-lg px-2 py-2 text-xs font-bold transition ${stageFilter === 'all' ? 'bg-slate-950 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setStageFilter('all')}
              >
                All
              </button>
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  className={`rounded-lg px-2 py-2 text-xs font-bold transition ${stageFilter === stage.id ? 'bg-slate-950 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  onClick={() => setStageFilter(stage.id)}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[calc(100vh-420px)] overflow-y-auto">
            {filteredLeads.map((lead) => {
              const due = daysUntil(lead.followUpDate);
              return (
                <button
                  key={lead.id}
                  className={`relative block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${selectedLead?.id === lead.id ? 'border-l-4 border-l-cyanbrand-500 bg-cyan-50/70 pl-3' : 'border-l-4 border-l-transparent bg-white pl-3'}`}
                  onClick={() => {
                    setIsCreatingLead(false);
                    setSelectedId(lead.id);
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
                    <span>{lead.priority || 'Medium'} priority</span>
                    {due < 0 ? <span className="rounded-md bg-rose-50 px-2 py-1 font-bold text-rose-700">Overdue {Math.abs(due)}d</span>
                      : due === 0 ? <span className="rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-700">Due today</span>
                      : <span>{formatDate(lead.followUpDate)}</span>}
                  </div>
                </button>
              );
            })}
            {!filteredLeads.length ? <p className="p-5 text-sm text-slate-500">No leads match this view.</p> : null}
          </div>
        </aside>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <form className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card sm:p-6" onSubmit={saveDraft}>
            {selectedLead || isCreatingLead ? (
              <>
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
                  </div>
                  <div className="flex gap-2">
                    {isCreatingLead ? (
                      <button
                        className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                        onClick={cancelCreateLead}
                        type="button"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        className="rounded-md border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
                        disabled={deleting}
                        onClick={handleDeleteLead}
                        type="button"
                      >
                        {deleting ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                    <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800" type="submit">
                      {isCreatingLead ? 'Create Lead' : 'Save Lead'}
                    </button>
                  </div>
                </div>

                {duplicateLead ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-900">Possible duplicate lead</p>
                      <p className="mt-0.5 text-xs leading-5 text-amber-700">{duplicateLead.name || 'An existing lead'} already uses this email address or phone number.</p>
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

          <aside className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700">Lead roadmap</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight">Progress</h3>
            <ProgressRoadmap status={draft.status} onChange={changeStatus} />

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold tracking-normal">Activity</h3>
              {isCreatingLead ? (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-500">Activity tracking begins after the lead is created.</p>
              ) : (
                <>
                  <textarea
                    className={`${fieldClass()} min-h-24`}
                    placeholder="Add progress note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <button className="mt-2 w-full rounded-md bg-cyanbrand-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyanbrand-400" onClick={addActivity} type="button">
                    Add Note
                  </button>
                  <div className="mt-4 space-y-3">
                    {(selectedLead?.activities || []).map((activity) => (
                      <div key={activity.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-950">{activity.text}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(activity.at)}</p>
                      </div>
                    ))}
                    {!selectedLead?.activities?.length ? <p className="text-sm text-slate-500">No activity yet.</p> : null}
                  </div>
                </>
              )}
            </div>
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
