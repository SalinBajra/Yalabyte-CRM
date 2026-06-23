import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchLeads, isSupabaseConfigured, saveLeads, supabase, toCRMUser } from './supabase';

const STORAGE_KEY = 'yalabyte-crm-leads';
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

function money(value) {
  const amount = Number(value || 0);
  return `Rs ${new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(amount)}`;
}

function fieldClass() {
  return 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100';
}

function Stat({ label, value }) {
  return (
    <div className="border-r border-slate-200 px-5 py-4 last:border-r-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <img
        className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-xl object-cover shadow-sm`}
        src="/favicon.png"
        alt="YalaByte logo"
      />
      <div>
        <p className={`${compact ? 'text-lg' : 'text-xl'} font-extrabold tracking-tight text-slate-950`}>
          Yala<span className="text-cyanbrand-500">Byte</span>
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Team CRM</p>
      </div>
    </div>
  );
}

function isAllowedTeamEmail(email) {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
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
      setError('Use your YalaByte email address to access the CRM.');
      return;
    }

    if (password.length < 8) {
      setError('Use at least 8 characters for the password.');
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
    <main className="login-shell min-h-screen px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
        <form className="w-full rounded-2xl border border-white/10 bg-white p-7 text-slate-950 shadow-soft sm:p-8" onSubmit={handleSubmit}>
          <Brand />
          <div className="mt-8 h-px bg-slate-100" />
          <h1 className="mt-7 text-2xl font-bold tracking-tight">Welcome to the workspace</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sign in with a YalaByte domain email to open the lead workspace.</p>
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
          {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
          {message ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{message}</p> : null}
          <button disabled={busy} className="mt-5 w-full rounded-lg bg-cyanbrand-500 px-4 py-3 text-sm font-bold text-navy-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyanbrand-400 hover:shadow-md disabled:cursor-wait disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
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
  const [note, setNote] = useState('');
  const importInputRef = useRef(null);

  const selectedLead = leads.find((lead) => lead.id === selectedId) || leads[0] || null;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return undefined;
    }

    const acceptSession = (session) => {
      const user = toCRMUser(session?.user);
      setCurrentUser(user && isAllowedTeamEmail(user.email) ? user : null);
      setAuthReady(true);
    };

    supabase.auth.getSession().then(({ data }) => acceptSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => acceptSession(session));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !supabase) {
      setDataReady(false);
      return;
    }

    let active = true;
    setDataReady(false);
    setDataError('');

    fetchLeads()
      .then(async (remoteLeads) => {
        if (!active) return;
        const nextLeads = remoteLeads.length ? remoteLeads : readLeads();
        if (!remoteLeads.length && nextLeads.length) await saveLeads(nextLeads);
        if (!active) return;
        setLeads(nextLeads);
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
    if (selectedLead) {
      setDraft({ ...initialLead, ...selectedLead });
      setNote('');
    } else {
      setDraft(initialLead);
    }
  }, [selectedLead?.id]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesStage = stageFilter === 'all' || lead.status === stageFilter;
      const matchesQuery =
        !normalizedQuery ||
        [lead.name, lead.email, lead.phone, lead.company, lead.service, lead.owner, lead.source]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStage && matchesQuery;
    });
  }, [leads, query, stageFilter]);

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

  const saveDraft = (event) => {
    event.preventDefault();
    if (!selectedLead) return;
    updateLead(selectedLead.id, draft, 'Lead details updated.');
  };

  const createLead = () => {
    const now = new Date().toISOString();
    const lead = {
      ...initialLead,
      id: createId('lead'),
      name: 'New lead',
      owner: currentUser?.name || '',
      createdAt: now,
      updatedAt: now,
      activities: [{ id: createId('activity'), type: 'Created', text: 'Lead created manually.', at: now }]
    };
    setLeads((current) => [lead, ...current]);
    setSelectedId(lead.id);
  };

  const addActivity = () => {
    if (!selectedLead || !note.trim()) return;
    updateLead(selectedLead.id, {}, note.trim());
    setNote('');
  };

  const changeStatus = (status) => {
    if (!selectedLead) return;
    const label = stages.find((stage) => stage.id === status)?.label || status;
    setDraft((current) => ({ ...current, status }));
    updateLead(selectedLead.id, { status }, `Status changed to ${label}.`);
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
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="login-shell flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-soft">
          <Brand />
          <h1 className="mt-8 text-2xl font-bold tracking-tight">Connect the CRM database</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> in Vercel, then redeploy.
          </p>
        </div>
      </main>
    );
  }

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

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_12px_rgba(15,23,42,0.04)] backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Brand compact />
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-xs text-slate-500">
                {currentUser.email} · {syncState === 'syncing' ? 'Saving…' : syncState === 'error' ? 'Sync issue' : 'Synced'}
              </p>
            </div>
            <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={exportLeads}>
              Export
            </button>
            <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={() => importInputRef.current?.click()}>
              Import
            </button>
            <input ref={importInputRef} className="hidden" type="file" accept="application/json" onChange={importLeads} />
            <button className="rounded-md bg-cyanbrand-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyanbrand-400" onClick={createLead}>
              New Lead
            </button>
            <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </div>
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 overflow-hidden border-t border-slate-200 sm:grid-cols-4">
          <Stat label="Total leads" value={stats.total} />
          <Stat label="Open leads" value={stats.open} />
          <Stat label="Pipeline value" value={money(stats.totalValue)} />
          <Stat label="Due now" value={stats.dueToday} />
        </div>
      </div>

      {dataError ? (
        <div className="mx-auto mt-4 max-w-[1500px] px-4 sm:px-6">
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{dataError}</p>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[360px_1fr]">
        <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-200 p-3">
            <input
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100"
              placeholder="Search leads, companies, owners…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="mt-3 flex gap-2 overflow-x-auto">
              <button
                className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold ${stageFilter === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}
                onClick={() => setStageFilter('all')}
              >
                All
              </button>
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold ${stageFilter === stage.id ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}
                  onClick={() => setStageFilter(stage.id)}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
            {filteredLeads.map((lead) => {
              const due = daysUntil(lead.followUpDate);
              return (
                <button
                  key={lead.id}
                  className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${selectedLead?.id === lead.id ? 'bg-cyan-50' : 'bg-white'}`}
                  onClick={() => setSelectedId(lead.id)}
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
                    <span className={due !== null && due <= 0 ? 'font-bold text-red-600' : ''}>{formatDate(lead.followUpDate)}</span>
                  </div>
                </button>
              );
            })}
            {!filteredLeads.length ? <p className="p-5 text-sm text-slate-500">No leads match this view.</p> : null}
          </div>
        </aside>

        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:p-6" onSubmit={saveDraft}>
            {selectedLead ? (
              <>
                <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold ${activeTone}`}>
                      {stages.find((stage) => stage.id === draft.status)?.label}
                    </span>
                    <h2 className="mt-3 text-2xl font-semibold tracking-normal">{draft.name || 'Unnamed lead'}</h2>
                    <p className="mt-1 text-sm text-slate-500">Created {formatDate(draft.createdAt)} from {draft.source || 'Unknown source'}</p>
                  </div>
                  <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
                    Save Lead
                  </button>
                </div>

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
                    <input className={fieldClass()} name="owner" value={draft.owner} onChange={handleDraftChange} />
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
              <div className="flex min-h-[420px] items-center justify-center text-sm text-slate-500">Create a lead to begin.</div>
            )}
          </form>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-base font-semibold tracking-normal">Progress</h3>
            <div className="mt-4 space-y-2">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm font-bold ${draft.status === stage.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => changeStatus(stage.id)}
                  type="button"
                >
                  {stage.label}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold tracking-normal">Activity</h3>
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
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
