create table if not exists public.leads (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "YalaByte team can read leads"
on public.leads
for select
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com');

create policy "YalaByte team can create leads"
on public.leads
for insert
to authenticated
with check (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com');

create policy "YalaByte team can update leads"
on public.leads
for update
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com')
with check (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com');

create policy "YalaByte team can delete leads"
on public.leads
for delete
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com');

grant select, insert, update, delete on public.leads to authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on public.leads to service_role;

do $$
begin
  alter publication supabase_realtime add table public.leads;
exception
  when duplicate_object then null;
end $$;
