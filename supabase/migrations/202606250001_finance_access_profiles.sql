create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique check (lower(email) like '%@yalabyte.com'),
  full_name text,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  create policy "Users can read their own shared profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can create their own member profile"
  on public.profiles for insert to authenticated
  with check (
    id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and role = 'member'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can refresh their own shared profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
exception when duplicate_object then null;
end $$;

grant select on public.profiles to authenticated;
grant insert (id, email, full_name, updated_at) on public.profiles to authenticated;
grant update (email, full_name, updated_at) on public.profiles to authenticated;

alter table public.team_members
drop constraint if exists team_members_role_check;

alter table public.team_members
add constraint team_members_role_check
check (role in ('admin', 'finance', 'member'));

insert into public.profiles (id, email, full_name, role)
select
  user_id,
  lower(email),
  name,
  case when role in ('admin', 'finance') then role else 'member' end::public.app_role
from public.team_members
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  updated_at = now();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.set_team_member_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('admin', 'finance', 'member') then
    raise exception 'Invalid team role.';
  end if;
  if not exists (
    select 1 from public.team_members
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only CRM admins can change team roles.';
  end if;
  if p_user_id = auth.uid() and p_role <> 'admin' and (
    select count(*) from public.team_members where role = 'admin'
  ) = 1 then
    raise exception 'The CRM must retain at least one admin.';
  end if;

  update public.team_members
  set role = p_role
  where user_id = p_user_id;

  insert into public.profiles (id, email, full_name, role)
  select
    user_id,
    lower(email),
    name,
    p_role::public.app_role
  from public.team_members
  where user_id = p_user_id
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();
end;
$$;

revoke all on function public.set_team_member_role(uuid, text) from public;
grant execute on function public.set_team_member_role(uuid, text) to authenticated;
