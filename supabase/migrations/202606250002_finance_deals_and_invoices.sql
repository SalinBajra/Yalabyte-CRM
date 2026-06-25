create table if not exists public.finance_deals (
  id uuid primary key default gen_random_uuid(),
  crm_lead_id text not null unique,
  client_name text not null,
  company text not null default '',
  email text not null default '',
  phone text not null default '',
  service text not null default '',
  deal_value_npr numeric(14,2) not null default 0,
  owner_name text not null default '',
  owner_email text not null default '',
  status text not null default 'ready_to_invoice' check (status in ('ready_to_invoice', 'invoicing', 'paid', 'archived')),
  lead_data jsonb not null default '{}'::jsonb,
  won_at timestamptz not null default now(),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.finance_deals enable row level security;

do $$ begin
  create policy "YalaByte team can read finance deal handoffs"
  on public.finance_deals for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "YalaByte team can send won deals to finance"
  on public.finance_deals for insert to authenticated
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com');
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "YalaByte team can refresh finance deal handoffs"
  on public.finance_deals for update to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com');
exception when duplicate_object then null;
end $$;

create table if not exists public.finance_invoices (
  id text primary key,
  deal_id uuid not null references public.finance_deals(id) on delete cascade,
  crm_lead_id text not null,
  invoice_number text not null unique,
  status text not null default 'issued' check (status in ('draft', 'issued', 'paid', 'cancelled')),
  amount_due_npr numeric(14,2) not null default 0,
  grand_total_npr numeric(14,2) not null default 0,
  due_date date,
  invoice_data jsonb not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.finance_invoices enable row level security;

do $$ begin
  create policy "Finance roles can read invoices"
  on public.finance_invoices for select to authenticated
  using (public.current_user_role() in ('admin', 'finance'));
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Finance roles can create invoices"
  on public.finance_invoices for insert to authenticated
  with check (public.current_user_role() in ('admin', 'finance') and created_by = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Finance roles can update invoices"
  on public.finance_invoices for update to authenticated
  using (public.current_user_role() in ('admin', 'finance'))
  with check (public.current_user_role() in ('admin', 'finance'));
exception when duplicate_object then null;
end $$;

grant select, insert, update on public.finance_deals to authenticated;
grant select, insert, update on public.finance_invoices to authenticated;
