import { useEffect, useState } from 'react';
import { createLeadTask, fetchLeadTasks, setLeadTaskStatus, supabase } from './supabase';

const emptyTask = { assigneeId: '', title: '', description: '', dueDate: '', priority: 'medium' };
const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100';

function taskDueLabel(value) {
  if (!value) return 'No due date';
  const days = Math.ceil((new Date(`${value}T23:59:59`) - new Date()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default function LeadTasks({ lead, currentUser, teamMembers, onActivity }) {
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState(emptyTask);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!lead?.id || !supabase) {
      setTasks([]);
      return;
    }
    fetchLeadTasks(lead.id).then(setTasks).catch(() => setMessage('Run the operational CRM migration to enable lead tasks.'));
  }, [lead?.id]);

  const saveTask = async () => {
    const assignee = teamMembers.find((member) => member.user_id === draft.assigneeId);
    if (!assignee || !draft.title.trim()) {
      setMessage('Choose a teammate and add a task title.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const task = await createLeadTask(draft, lead.id, assignee, currentUser);
      setTasks((current) => [task, ...current]);
      setDraft(emptyTask);
      setCreating(false);
      setMessage(`Task assigned to ${assignee.name}.`);
      onActivity?.(`Task assigned to ${assignee.name}: ${task.title}`, 'Task');

      const { data } = await supabase.auth.getSession();
      fetch('https://www.yalabyte.com/api/team-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` },
        body: JSON.stringify({
          to: assignee.email,
          assigneeName: assignee.name,
          assignedByName: currentUser.name,
          contactName: lead.name,
          contactCompany: lead.company,
          leadName: lead.name,
          title: task.title,
          description: task.description,
          dueDate: task.due_date
        })
      }).catch(() => {});
    } catch (error) {
      setMessage(error.message || 'Unable to create this task.');
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (task) => {
    const status = task.status === 'done' ? 'open' : 'done';
    try {
      await setLeadTaskStatus(task.id, status);
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item));
      onActivity?.(`${status === 'done' ? 'Completed' : 'Reopened'} task: ${task.title}`, 'Task');
    } catch (error) {
      setMessage(error.message || 'Unable to update this task.');
    }
  };

  if (!lead) return null;

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="text-base font-semibold">Tasks</h3><p className="mt-0.5 text-xs text-slate-400">Assignments and reminders</p></div>
        <button className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200" onClick={() => setCreating((open) => !open)} type="button">{creating ? 'Cancel' : 'Add task'}</button>
      </div>

      {creating ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="text-xs font-bold text-slate-600">Title<input className={inputClass} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Follow up with the lead" /></label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-xs font-bold text-slate-600">Assignee<select className={inputClass} value={draft.assigneeId} onChange={(event) => setDraft((current) => ({ ...current, assigneeId: event.target.value }))}><option value="">Choose</option>{teamMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.name}</option>)}</select></label>
            <label className="text-xs font-bold text-slate-600">Due date<input className={inputClass} type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} /></label>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_110px] gap-2">
            <label className="text-xs font-bold text-slate-600">Instructions<input className={inputClass} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
            <label className="text-xs font-bold text-slate-600">Priority<select className={inputClass} value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          </div>
          <button className="mt-3 w-full rounded-lg bg-cyanbrand-500 px-3 py-2.5 text-sm font-extrabold text-navy-950 disabled:opacity-50" disabled={busy || !supabase} onClick={saveTask} type="button">{busy ? 'Assigning…' : 'Assign task'}</button>
        </div>
      ) : null}

      {message ? <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">{message}</p> : null}
      <div className="mt-3 space-y-2">
        {tasks.map((task) => {
          const due = taskDueLabel(task.due_date);
          const overdue = due.includes('overdue');
          return <button className={`block w-full rounded-lg border p-3 text-left transition ${task.status === 'done' ? 'border-emerald-100 bg-emerald-50/70' : overdue ? 'border-rose-100 bg-rose-50/60' : 'border-slate-200 bg-white hover:bg-slate-50'}`} key={task.id} onClick={() => toggleTask(task)} type="button"><div className="flex items-start justify-between gap-2"><p className={`text-sm font-bold ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p><span className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${task.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>{task.priority}</span></div><p className={`mt-1 text-xs ${overdue && task.status !== 'done' ? 'font-bold text-rose-600' : 'text-slate-500'}`}>{task.assigned_to_name} · {due}</p></button>;
        })}
        {!tasks.length && !creating ? <p className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400">No tasks for this lead.</p> : null}
      </div>
    </div>
  );
}
