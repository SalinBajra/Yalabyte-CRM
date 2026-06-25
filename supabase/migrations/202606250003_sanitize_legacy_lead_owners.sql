delete from public.leads
where id in ('lead-sample-1', 'lead-sample-2')
   or id like 'lead-sample-%';

update public.leads
set data = jsonb_set(data, '{owner}', '""'::jsonb, true)
where coalesce(data ->> 'owner', '') <> ''
  and not exists (
    select 1
    from public.team_members
    where lower(trim(name)) = lower(trim(public.leads.data ->> 'owner'))
  );
