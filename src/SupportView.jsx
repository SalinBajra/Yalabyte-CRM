import { useEffect, useMemo, useState } from "react";
import { createSupportMessage, createSupportTicket, fetchClientProfiles, fetchSupportMessages, fetchSupportTickets, inviteLeadToPortal, supabase, updateSupportTicket } from "./supabase";

const statuses = [
  ["new", "New"],
  ["in_progress", "In progress"],
  ["waiting_client", "Waiting for client"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
];
const priorities = [
  ["low", "Low"],
  ["normal", "Normal"],
  ["high", "High"],
  ["urgent", "Urgent"],
];
const emptyTicket = {
  targetId: "",
  subject: "",
  description: "",
  category: "Technical issue",
  priority: "normal",
  assigneeId: "",
  responseDueAt: "",
  resolutionDueAt: "",
};
const inputClass = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-cyanbrand-500 focus:ring-4 focus:ring-cyanbrand-100";

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function priorityTone(priority) {
  if (priority === "urgent") return "bg-rose-100 text-rose-700";
  if (priority === "high") return "bg-amber-100 text-amber-700";
  if (priority === "low") return "bg-slate-100 text-slate-500";
  return "bg-cyan-50 text-cyan-700";
}

export default function SupportView({ currentUser, leads, teamMembers }) {
  const [tickets, setTickets] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyTicket);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [mobilePane, setMobilePane] = useState("list");

  const selected = tickets.find((ticket) => ticket.id === selectedId) || null;
  const selectedClient = selected?.contact || selected?.lead?.data || null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const statusMatches = statusFilter === "all" || (statusFilter === "open" ? !["resolved", "closed"].includes(ticket.status) : ticket.status === statusFilter);
      const searchMatches = !needle || [ticket.ticket_number, ticket.subject, ticket.contact?.name, ticket.contact?.company, ticket.lead?.data?.name, ticket.lead?.data?.company, ticket.assigned_to_name].filter(Boolean).some((value) => value.toLowerCase().includes(needle));
      return statusMatches && searchMatches;
    });
  }, [tickets, query, statusFilter]);

  useEffect(() => {
    Promise.all([fetchSupportTickets(), fetchClientProfiles()])
      .then(([ticketRows, profileRows]) => {
        setTickets(ticketRows);
        setProfiles(profileRows);
        setSelectedId(ticketRows[0]?.id || null);
      })
      .catch(() => setNotice("Run the client portal support migration to enable this workspace."));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    fetchSupportMessages(selectedId)
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => {
    if (!supabase) return undefined;
    const channel = supabase
      .channel("crm-support-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        fetchSupportTickets()
          .then(setTickets)
          .catch(() => {});
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!supabase || !selectedId) return undefined;
    const channel = supabase
      .channel(`crm-support-messages-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_ticket_messages",
          filter: `ticket_id=eq.${selectedId}`,
        },
        () => {
          fetchSupportMessages(selectedId)
            .then(setMessages)
            .catch(() => {});
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 10000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const createTicket = async () => {
    const [targetType, targetId] = draft.targetId.split(":");
    const lead = targetType === "lead" ? leads.find((item) => item.id === targetId) : null;
    const profile = targetType === "profile" ? profiles.find((item) => item.user_id === targetId) : profiles.find((item) => item.contact?.lead_id === targetId || (lead?.email && item.email?.toLowerCase() === lead.email.toLowerCase()));
    const assignee = teamMembers.find((item) => item.user_id === draft.assigneeId);
    if ((!profile && !lead) || !draft.subject.trim() || !draft.description.trim()) {
      setNotice("Choose a client or lead and complete the subject and description.");
      return;
    }
    setBusy(true);
    try {
      const ticket = await createSupportTicket({ ...draft, assignee }, profile, currentUser, lead);
      let invitationMessage = "";
      if (lead && !profile && lead.email) {
        try {
          const invitation = await inviteLeadToPortal(lead);
          invitationMessage = ` ${invitation.message || `Portal invitation sent to ${lead.email}.`}`;
        } catch (inviteError) {
          invitationMessage = ` Ticket saved, but the portal invite failed: ${inviteError.message}`;
        }
      }
      setTickets((current) => [ticket, ...current]);
      setSelectedId(ticket.id);
      setDraft(emptyTicket);
      setCreating(false);
      setMobilePane("detail");
      setNotice(`${ticket.ticket_number} created.${invitationMessage}`);
    } catch (error) {
      setNotice(error.message || "Unable to create this ticket.");
    } finally {
      setBusy(false);
    }
  };

  const updateTicket = async (changes) => {
    if (!selected) return;
    setBusy(true);
    try {
      const ticket = await updateSupportTicket(selected.id, changes);
      setTickets((current) => current.map((item) => (item.id === ticket.id ? ticket : item)));
    } catch (error) {
      setNotice(error.message || "Unable to update this ticket.");
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setBusy(true);
    try {
      const message = await createSupportMessage(selected.id, reply, currentUser, internal);
      setMessages((current) => [...current, message]);
      setReply("");
      setInternal(false);
      setTickets((current) => current.map((item) => (item.id === selected.id ? { ...item, last_activity_at: message.created_at } : item)));
    } catch (error) {
      setNotice(error.message || "Unable to send this reply.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1600px] gap-3 px-3 py-4 sm:gap-5 sm:px-6 xl:grid-cols-[370px_1fr]">
      <aside className={`${mobilePane === "detail" ? "hidden md:block" : "block"} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card`}>
        <div className="border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">Client care</p>
              <h1 className="mt-1 text-xl font-extrabold">Support</h1>
            </div>
            <button className="rounded-lg bg-cyanbrand-500 px-3 py-2 text-xs font-extrabold text-navy-950" onClick={() => setCreating(true)} type="button">
              New ticket
            </button>
          </div>
          <input className={`${inputClass} mt-4`} placeholder="Search tickets or clients…" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="open">Open tickets</option>
            <option value="all">All tickets</option>
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
          {filtered.map((ticket) => (
            <button
              className={`block w-full border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${ticket.id === selectedId ? "border-l-4 border-l-cyanbrand-500 bg-cyan-50/70" : "border-l-4 border-l-transparent"}`}
              key={ticket.id}
              onClick={() => {
                setSelectedId(ticket.id);
                setMobilePane("detail");
              }}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-extrabold text-cyan-700">{ticket.ticket_number}</p>
                <span className={`rounded px-2 py-1 text-[9px] font-extrabold uppercase ${priorityTone(ticket.priority)}`}>{ticket.priority}</span>
              </div>
              <p className="mt-2 truncate text-sm font-bold text-slate-900">{ticket.subject}</p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {ticket.contact?.name || ticket.lead?.data?.name || "Client"} · {ticket.contact?.company || ticket.lead?.data?.company || "Lead"}
              </p>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                {statuses.find(([value]) => value === ticket.status)?.[1]} · {ticket.assigned_to_name || "Unassigned"}
              </p>
            </button>
          ))}
          {!filtered.length ? <p className="px-5 py-10 text-center text-sm text-slate-400">No tickets match this view.</p> : null}
        </div>
      </aside>

      <main className={`${mobilePane === "list" ? "hidden md:block" : "block"}`}>
        {notice ? <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">{notice}</p> : null}
        {creating ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-cyan-700">Team-created support</p>
                <h2 className="mt-1 text-xl font-extrabold">New ticket</h2>
              </div>
              <button className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold" onClick={() => setCreating(false)} type="button">
                Cancel
              </button>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">
                Client or lead
                <select
                  className={inputClass}
                  value={draft.targetId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      targetId: event.target.value,
                    }))
                  }
                >
                  <option value="">Choose client or lead</option>
                  {profiles.length ? (
                    <optgroup label="Portal clients">
                      {profiles.map((profile) => (
                        <option key={profile.user_id} value={`profile:${profile.user_id}`}>
                          {profile.name} · {profile.company || profile.email}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  {leads.length ? (
                    <optgroup label="CRM leads">
                      {leads.map((lead) => (
                        <option key={lead.id} value={`lead:${lead.id}`}>
                          {lead.name} · {lead.company || lead.email || "Lead"}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Assign to
                <select
                  className={inputClass}
                  value={draft.assigneeId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      assigneeId: event.target.value,
                    }))
                  }
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Category
                <select
                  className={inputClass}
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                >
                  {["Technical issue", "Website update", "Hosting", "Domain & DNS", "Billing", "General support"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Priority
                <select
                  className={inputClass}
                  value={draft.priority}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                >
                  {priorities.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold md:col-span-2">
                Subject
                <input
                  className={inputClass}
                  value={draft.subject}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-semibold md:col-span-2">
                Description
                <textarea
                  className={`${inputClass} min-h-28`}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <button className="mt-4 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={busy} onClick={createTicket} type="button">
              Create ticket
            </button>
          </section>
        ) : selected ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-200 p-5">
              <button className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 md:hidden" onClick={() => setMobilePane("list")} type="button">
                ← Back to tickets
              </button>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-extrabold text-cyan-700">{selected.ticket_number}</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-slate-950">{selected.subject}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedClient?.name} · {selectedClient?.company || selectedClient?.email || "CRM lead"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <select
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"
                    disabled={busy}
                    value={selected.status}
                    onChange={(event) =>
                      updateTicket({
                        status: event.target.value,
                        resolved_at: event.target.value === "resolved" ? new Date().toISOString() : null,
                      })
                    }
                  >
                    {statuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold" disabled={busy} value={selected.priority} onChange={(event) => updateTicket({ priority: event.target.value })}>
                    {priorities.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="col-span-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold"
                    disabled={busy}
                    value={selected.assigned_to || ""}
                    onChange={(event) => {
                      const member = teamMembers.find((item) => item.user_id === event.target.value);
                      updateTicket({
                        assigned_to: member?.user_id || null,
                        assigned_to_name: member?.name || "",
                      });
                    }}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-md bg-slate-100 px-2.5 py-1.5">{selected.category}</span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1.5">Created {formatDate(selected.created_at)}</span>
                <span className="rounded-md bg-slate-100 px-2.5 py-1.5">Last activity {formatDate(selected.last_activity_at)}</span>
              </div>
            </div>
            <div className="grid min-h-[520px] lg:grid-cols-[1fr_280px]">
              <div className="flex flex-col border-r border-slate-100">
                <div className="flex-1 space-y-3 p-4 sm:p-5">
                  {messages.map((message) => (
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 ${message.author_type === "team" ? (message.is_internal ? "ml-auto bg-amber-50 text-amber-950" : "ml-auto bg-navy-950 text-white") : "bg-slate-100 text-slate-800"}`} key={message.id}>
                      <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em] opacity-60">
                        <span>{message.author_name}</span>
                        {message.is_internal ? <span>Internal</span> : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                      <p className="mt-1 text-[10px] opacity-50">{formatDate(message.created_at)}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 p-4">
                  <textarea className={`${inputClass} min-h-24`} placeholder={internal ? "Add an internal team note…" : "Reply to the client…"} value={reply} onChange={(event) => setReply(event.target.value)} />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <input checked={internal} onChange={(event) => setInternal(event.target.checked)} type="checkbox" /> Internal note
                    </label>
                    <button className="rounded-lg bg-cyanbrand-500 px-4 py-2.5 text-sm font-extrabold text-navy-950 disabled:opacity-50" disabled={busy || !reply.trim()} onClick={sendReply} type="button">
                      Send
                    </button>
                  </div>
                </div>
              </div>
              <aside className="bg-slate-50 p-5">
                <h3 className="text-sm font-extrabold text-slate-900">Client details</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Name</p>
                    <p className="mt-0.5 font-semibold">{selectedClient?.name || "Client"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <a className="mt-0.5 block font-semibold text-cyan-700" href={`mailto:${selectedClient?.email || ""}`}>
                      {selectedClient?.email || "Not provided"}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Phone</p>
                    <p className="mt-0.5 font-semibold">{selectedClient?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Company</p>
                    <p className="mt-0.5 font-semibold">{selectedClient?.company || "Not provided"}</p>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <div className="flex min-h-[500px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">Select a ticket or create a new one.</div>
        )}
      </main>
    </div>
  );
}
