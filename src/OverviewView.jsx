import { useEffect, useMemo, useState } from 'react';
import { fetchAllLeadTasks, setLeadTaskStatus, setTeamMemberRole, supabase } from './supabase';

function money(value) {
  return `Rs ${new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
}

function daysFromToday(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

function Metric({ label, value, note, tone = 'cyan' }) {
  const tones = { cyan: 'bg-cyan-50 text-cyan-700', emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', violet: 'bg-violet-50 text-violet-700' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card"><span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${tones[tone]}`}>{label}</span><p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>;
}

export default function OverviewView({ leads, currentUser, teamMembers, onOpenLead, onTeamChanged }) {
  const [tasks, setTasks] = useState([]);
  const [taskError, setTaskError] = useState('');
  const [roleError, setRoleError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    fetchAllLeadTasks().then(setTasks).catch(() => setTaskError('Run the operational CRM migration to enable the shared task queue.'));
  }, []);

  const data = useMemo(() => {
    const openLeads = leads.filter((lead) => !['won', 'lost'].includes(lead.status));
    const won = leads.filter((lead) => lead.status === 'won').length;
    const lost = leads.filter((lead) => lead.status === 'lost').length;
    const conversion = won + lost ? Math.round((won / (won + lost)) * 100) : 0;
    const pipeline = openLeads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
    const dueLeads = openLeads.filter((lead) => {
      const due = daysFromToday(lead.followUpDate);
      return due !== null && due <= 0;
    }).sort((a, b) => (a.followUpDate || '').localeCompare(b.followUpDate || ''));
    const sources = Object.entries(leads.reduce((result, lead) => {
      const source = lead.source || 'Unknown';
      result[source] = (result[source] || 0) + 1;
      return result;
    }, {})).sort((a, b) => b[1] - a[1]);
    const owners = Object.entries(openLeads.reduce((result, lead) => {
      const owner = lead.owner || 'Unassigned';
      result[owner] = result[owner] || { count: 0, value: 0 };
      result[owner].count += 1;
      result[owner].value += Number(lead.value || 0);
      return result;
    }, {})).sort((a, b) => b[1].value - a[1].value);
    return { openLeads, won, lost, conversion, pipeline, dueLeads, sources, owners };
  }, [leads]);

  const myTasks = tasks.filter((task) => task.assigned_to === currentUser.id && task.status !== 'done');
  const currentProfile = teamMembers.find((member) => member.user_id === currentUser.id);
  const canManageTeam = currentProfile?.role === 'admin';
  const maxSourceCount = Math.max(...data.sources.map(([, count]) => count), 1);

  const toggleTask = async (task) => {
    const status = task.status === 'done' ? 'open' : 'done';
    await setLeadTaskStatus(task.id, status);
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item));
  };

  const changeRole = async (member, role) => {
    setRoleError('');
    try {
      await setTeamMemberRole(member.user_id, role);
      onTeamChanged?.();
    } catch (error) {
      setRoleError(error.message || 'Unable to change this role.');
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">Today at YalaByte</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">A focused view of deals, follow-ups, and your work.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Open pipeline" value={money(data.pipeline)} note={`${data.openLeads.length} active opportunities`} />
        <Metric label="Conversion" value={`${data.conversion}%`} note={`${data.won} won · ${data.lost} lost`} tone="emerald" />
        <Metric label="Due now" value={data.dueLeads.length} note="Follow-ups requiring attention" tone="amber" />
        <Metric label="My tasks" value={myTasks.length} note="Open assignments" tone="violet" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-amber-600">Action center</p><h2 className="mt-1 text-lg font-extrabold">Follow up now</h2></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{data.dueLeads.length}</span></div>
          <div className="mt-4 divide-y divide-slate-100">
            {data.dueLeads.slice(0, 8).map((lead) => {
              const days = daysFromToday(lead.followUpDate);
              return <button className="flex w-full items-center justify-between gap-3 py-3 text-left" key={lead.id} onClick={() => onOpenLead(lead.id)} type="button"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{lead.name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{lead.company || lead.service} · {lead.owner || 'Unassigned'}</p></div><span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${days < 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{days < 0 ? `${Math.abs(days)}d overdue` : 'Today'}</span></button>;
            })}
            {!data.dueLeads.length ? <p className="py-8 text-center text-sm text-slate-400">No overdue follow-ups. Nicely done.</p> : null}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-5">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-violet-600">Personal queue</p><h2 className="mt-1 text-lg font-extrabold">My tasks</h2></div>
          {taskError ? <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{taskError}</p> : null}
          <div className="mt-4 space-y-2">
            {myTasks.slice(0, 8).map((task) => {
              const lead = leads.find((item) => item.id === task.lead_id);
              const due = daysFromToday(task.due_date);
              return <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3" key={task.id}><button className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-transparent hover:border-emerald-500 hover:text-emerald-500" onClick={() => toggleTask(task)} type="button">✓</button><button className="min-w-0 flex-1 text-left" onClick={() => lead && onOpenLead(lead.id)} type="button"><p className="truncate text-sm font-bold text-slate-800">{task.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{lead?.name || 'Lead'}{due !== null ? ` · ${due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? 'Due today' : `Due in ${due}d`}` : ''}</p></button></div>;
            })}
            {!myTasks.length && !taskError ? <p className="py-8 text-center text-sm text-slate-400">Your task queue is clear.</p> : null}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"><h2 className="text-lg font-extrabold">Lead sources</h2><p className="mt-1 text-xs text-slate-500">Where opportunities are coming from</p><div className="mt-5 space-y-3">{data.sources.slice(0, 7).map(([source, count]) => <div key={source}><div className="mb-1 flex justify-between text-xs"><span className="font-semibold text-slate-600">{source}</span><span className="font-bold text-slate-800">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyanbrand-500" style={{ width: `${Math.max((count / maxSourceCount) * 100, 6)}%` }} /></div></div>)}{!data.sources.length ? <p className="text-sm text-slate-400">No source data yet.</p> : null}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"><h2 className="text-lg font-extrabold">Team pipeline</h2><p className="mt-1 text-xs text-slate-500">Open ownership and value</p><div className="mt-4 divide-y divide-slate-100">{data.owners.map(([owner, summary]) => <div className="flex items-center justify-between gap-3 py-3" key={owner}><div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600">{owner.charAt(0)}</span><div><p className="truncate text-sm font-bold text-slate-800">{owner}</p><p className="text-xs text-slate-500">{summary.count} open</p></div></div><span className="text-sm font-extrabold text-slate-800">{money(summary.value)}</span></div>)}{!data.owners.length ? <p className="py-6 text-sm text-slate-400">No active ownership data.</p> : null}</div></section>
      </div>

      {canManageTeam ? (
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Admin</p><h2 className="mt-1 text-lg font-extrabold">Team access</h2><p className="mt-1 text-xs text-slate-500">Admins can manage roles and delete audited leads.</p></div>
          {roleError ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{roleError}</p> : null}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{teamMembers.map((member) => <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3" key={member.user_id}><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{member.name}</p><p className="truncate text-xs text-slate-400">{member.email}</p></div><select className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-600" value={member.role || 'member'} onChange={(event) => changeRole(member, event.target.value)}><option value="member">Member</option><option value="admin">Admin</option></select></div>)}</div>
        </section>
      ) : null}
    </div>
  );
}
