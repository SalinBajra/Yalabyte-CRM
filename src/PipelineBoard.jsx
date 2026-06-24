function currency(value) {
  return `Rs ${new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
}

function dueLabel(value) {
  if (!value) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  return `Due in ${days}d`;
}

export default function PipelineBoard({ leads, stages, onMove, onOpenLead }) {
  const activeLeads = leads.filter((lead) => lead.status !== 'lost');

  return (
    <div className="mx-auto max-w-[1700px] px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">Deal flow</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">Drag a deal to a new stage, or use the arrows on mobile.</p>
        </div>
        <p className="text-xs font-bold text-slate-500">{activeLeads.length} active opportunities</p>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto pb-4 xl:grid xl:grid-cols-5 xl:overflow-visible">
        {stages.filter((stage) => stage.id !== 'lost').map((stage, stageIndex, visibleStages) => {
          const stageLeads = leads.filter((lead) => lead.status === stage.id);
          const value = stageLeads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
          return (
            <section
              className="min-w-[285px] snap-start rounded-2xl border border-slate-200/90 bg-slate-100/70 p-2.5 xl:min-w-0"
              key={stage.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const leadId = event.dataTransfer.getData('text/lead-id');
                if (leadId) onMove(leadId, stage.id);
              }}
            >
              <div className="flex items-center justify-between gap-3 px-1.5 py-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.id === 'won' ? 'bg-emerald-500' : stage.id === 'proposal' ? 'bg-amber-400' : stage.id === 'contacted' ? 'bg-cyan-500' : 'bg-sky-500'}`} />
                  <h2 className="text-sm font-extrabold text-slate-800">{stage.label}</h2>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{stageLeads.length}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{currency(value)}</span>
              </div>

              <div className="min-h-32 space-y-2">
                {stageLeads.map((lead) => {
                  const due = dueLabel(lead.followUpDate);
                  return (
                    <article
                      className="cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-card active:cursor-grabbing"
                      draggable
                      key={lead.id}
                      onDragStart={(event) => event.dataTransfer.setData('text/lead-id', lead.id)}
                    >
                      <button className="block w-full text-left" onClick={() => onOpenLead(lead.id)} type="button">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-950">{lead.name || 'Unnamed lead'}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">{lead.company || lead.service}</p>
                          </div>
                          <span className="shrink-0 text-xs font-extrabold text-slate-700">{currency(lead.value)}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                          <span className="truncate font-semibold text-slate-500">{lead.owner || 'Unassigned'}</span>
                          {due ? <span className={due.includes('overdue') ? 'font-bold text-rose-600' : due === 'Due today' ? 'font-bold text-amber-600' : 'text-slate-400'}>{due}</span> : null}
                        </div>
                      </button>
                      <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 xl:hidden">
                        <button className="rounded-md px-2 py-1 text-xs font-bold text-slate-500 disabled:opacity-20" disabled={stageIndex === 0} onClick={() => onMove(lead.id, visibleStages[stageIndex - 1]?.id)} type="button">← Previous</button>
                        <button className="rounded-md px-2 py-1 text-xs font-bold text-cyan-700 disabled:opacity-20" disabled={stageIndex === visibleStages.length - 1} onClick={() => onMove(lead.id, visibleStages[stageIndex + 1]?.id)} type="button">Next →</button>
                      </div>
                    </article>
                  );
                })}
                {!stageLeads.length ? <div className="rounded-xl border border-dashed border-slate-300 px-3 py-8 text-center text-xs font-medium text-slate-400">Drop a deal here</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
