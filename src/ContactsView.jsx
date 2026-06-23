import { useEffect, useMemo, useState } from 'react';
import {
  createContact,
  createContactTask,
  fetchContacts,
  fetchContactTasks,
  setContactTaskStatus,
  supabase,
  updateContact
} from './supabase';

const emptyContact = { name: '', email: '', phone: '', company: '', role: '', source: 'Prospect', notes: '' };
const emptyTask = { assigneeId: '', title: '', description: '', dueDate: '' };
const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100';

function readableDate(value) {
  if (!value) return 'No due date';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export default function ContactsView({ currentUser, teamMembers }) {
  const [contacts, setContacts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(emptyContact);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskDraft, setTaskDraft] = useState(emptyTask);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [busy, setBusy] = useState(false);

  const selectedContact = isCreating ? null : contacts.find((contact) => contact.id === selectedId) || null;
  const filteredContacts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) => [contact.name, contact.email, contact.phone, contact.company, contact.role]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(needle)));
  }, [contacts, query]);

  useEffect(() => {
    fetchContacts()
      .then((rows) => {
        setContacts(rows);
        setSelectedId(rows[0]?.id || '');
      })
      .catch((error) => setStatus({ type: 'error', message: error.message }));
  }, []);

  useEffect(() => {
    if (isCreating) return;
    setDraft(selectedContact ? {
      name: selectedContact.name,
      email: selectedContact.email,
      phone: selectedContact.phone,
      company: selectedContact.company,
      role: selectedContact.role,
      source: selectedContact.source,
      notes: selectedContact.notes
    } : emptyContact);
    if (selectedContact) {
      fetchContactTasks(selectedContact.id).then(setTasks).catch(() => setTasks([]));
    } else {
      setTasks([]);
    }
  }, [selectedContact?.id, isCreating]);

  const changeDraft = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));

  const startContact = () => {
    setIsCreating(true);
    setSelectedId('');
    setDraft(emptyContact);
    setTasks([]);
    setStatus({ type: '', message: '' });
  };

  const cancelContact = () => {
    setIsCreating(false);
    setSelectedId(contacts[0]?.id || '');
  };

  const saveContact = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) {
      setStatus({ type: 'error', message: 'Add the contact name before saving.' });
      return;
    }
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      if (isCreating) {
        const saved = await createContact(draft, currentUser);
        setContacts((current) => [saved, ...current]);
        setSelectedId(saved.id);
        setIsCreating(false);
        setStatus({ type: 'success', message: 'Prospect contact saved.' });
      } else if (selectedContact) {
        const saved = await updateContact(selectedContact.id, draft);
        setContacts((current) => current.map((contact) => contact.id === saved.id ? saved : contact));
        setStatus({ type: 'success', message: 'Contact updated.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to save contact.' });
    } finally {
      setBusy(false);
    }
  };

  const assignTask = async () => {
    const assignee = teamMembers.find((member) => member.user_id === taskDraft.assigneeId);
    if (!selectedContact || !assignee || !taskDraft.title.trim()) {
      setStatus({ type: 'error', message: 'Choose a teammate and add a task title.' });
      return;
    }
    setBusy(true);
    try {
      const task = await createContactTask(taskDraft, selectedContact.id, assignee, currentUser);
      setTasks((current) => [task, ...current]);
      setTaskDraft(emptyTask);

      const { data } = await supabase.auth.getSession();
      const notificationResponse = await fetch('https://www.yalabyte.com/api/team-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${data.session?.access_token || ''}`
        },
        body: JSON.stringify({
          to: assignee.email,
          assigneeName: assignee.name,
          assignedByName: currentUser.name,
          contactName: selectedContact.name,
          contactCompany: selectedContact.company,
          title: task.title,
          description: task.description,
          dueDate: task.due_date
        })
      });
      setStatus({
        type: notificationResponse.ok ? 'success' : 'warning',
        message: notificationResponse.ok ? `Task assigned and emailed to ${assignee.name}.` : `Task assigned to ${assignee.name}; email delivery is pending.`
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Unable to assign task.' });
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (task) => {
    const nextStatus = task.status === 'done' ? 'open' : 'done';
    await setContactTaskStatus(task.id, nextStatus);
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: nextStatus } : item));
  };

  return (
    <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 xl:grid-cols-[340px_1fr]">
      <aside className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-card">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">Prospects</p><h2 className="mt-1 text-xl font-bold">Contacts</h2></div>
            <button className="rounded-lg bg-cyanbrand-500 px-3 py-2 text-xs font-extrabold text-navy-950" onClick={startContact}>Add contact</button>
          </div>
          <input className={`${inputClass} mt-4`} placeholder="Search contacts…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="max-h-[calc(100vh-245px)] overflow-y-auto">
          {filteredContacts.map((contact) => (
            <button
              className={`block w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${selectedContact?.id === contact.id ? 'bg-cyan-50' : ''}`}
              key={contact.id}
              onClick={() => { setIsCreating(false); setSelectedId(contact.id); setStatus({ type: '', message: '' }); }}
            >
              <p className="font-bold text-slate-950">{contact.name}</p>
              <p className="mt-1 text-sm text-slate-500">{contact.company || contact.email || 'Prospect'}</p>
              <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{contact.source}</span>
            </button>
          ))}
          {!filteredContacts.length ? <p className="p-5 text-sm text-slate-500">No prospect contacts yet.</p> : null}
        </div>
      </aside>

      <section className="space-y-4">
        <form className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card sm:p-6" onSubmit={saveContact}>
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">{isCreating ? 'Unsaved prospect' : 'Contact profile'}</p>
              <h2 className="mt-1 text-2xl font-bold">{isCreating ? 'Add prospect contact' : selectedContact?.name || 'Select a contact'}</h2>
            </div>
            {(selectedContact || isCreating) ? <div className="flex gap-2">{isCreating ? <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold" onClick={cancelContact} type="button">Cancel</button> : null}<button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white" disabled={busy}>{isCreating ? 'Save contact' : 'Save changes'}</button></div> : null}
          </div>
          {(selectedContact || isCreating) ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">Name<input className={inputClass} name="name" value={draft.name} onChange={changeDraft} /></label>
              <label className="text-sm font-semibold">Company<input className={inputClass} name="company" value={draft.company} onChange={changeDraft} /></label>
              <label className="text-sm font-semibold">Email<input className={inputClass} name="email" type="email" value={draft.email} onChange={changeDraft} /></label>
              <label className="text-sm font-semibold">Phone<input className={inputClass} name="phone" value={draft.phone} onChange={changeDraft} /></label>
              <label className="text-sm font-semibold">Role / designation<input className={inputClass} name="role" value={draft.role} onChange={changeDraft} /></label>
              <label className="text-sm font-semibold">Source<select className={inputClass} name="source" value={draft.source} onChange={changeDraft}>{['Prospect', 'Website', 'Referral', 'Networking', 'Existing client'].map((source) => <option key={source}>{source}</option>)}</select></label>
              <label className="text-sm font-semibold md:col-span-2">Notes<textarea className={`${inputClass} min-h-24`} name="notes" value={draft.notes} onChange={changeDraft} /></label>
            </div>
          ) : <p className="py-16 text-center text-sm text-slate-500">Choose a contact or add a new prospect.</p>}
          {status.message ? <p className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-700' : status.type === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{status.message}</p> : null}
        </form>

        {selectedContact ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-700">Team handoff</p><h3 className="mt-1 text-lg font-bold">Tag teammate & assign task</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">Team member<select className={inputClass} value={taskDraft.assigneeId} onChange={(event) => setTaskDraft((current) => ({ ...current, assigneeId: event.target.value }))}><option value="">Select teammate</option>{teamMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.name} · {member.email}</option>)}</select></label>
                <label className="text-sm font-semibold">Due date<input className={inputClass} type="date" value={taskDraft.dueDate} onChange={(event) => setTaskDraft((current) => ({ ...current, dueDate: event.target.value }))} /></label>
                <label className="text-sm font-semibold sm:col-span-2">Task title<input className={inputClass} value={taskDraft.title} onChange={(event) => setTaskDraft((current) => ({ ...current, title: event.target.value }))} placeholder="Call the prospect and confirm requirements" /></label>
                <label className="text-sm font-semibold sm:col-span-2">Instructions<textarea className={`${inputClass} min-h-20`} value={taskDraft.description} onChange={(event) => setTaskDraft((current) => ({ ...current, description: event.target.value }))} /></label>
              </div>
              <button className="mt-3 w-full rounded-lg bg-cyanbrand-500 px-4 py-3 text-sm font-extrabold text-navy-950" disabled={busy} onClick={assignTask} type="button">Assign & email teammate</button>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card"><h3 className="text-lg font-bold">Contact tasks</h3><div className="mt-4 space-y-3">{tasks.map((task) => <button className={`block w-full rounded-lg border p-3 text-left ${task.status === 'done' ? 'border-emerald-100 bg-emerald-50' : 'border-slate-200 bg-white'}`} key={task.id} onClick={() => toggleTask(task)}><p className={`text-sm font-bold ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-900'}`}>{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.assigned_to_name} · {readableDate(task.due_date)}</p></button>)}{!tasks.length ? <p className="text-sm text-slate-500">No tasks assigned for this contact.</p> : null}</div></div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
