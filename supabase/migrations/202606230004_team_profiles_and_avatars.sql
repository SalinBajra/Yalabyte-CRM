alter table public.team_members add column if not exists phone text not null default '';
alter table public.team_members add column if not exists bio text not null default '';
alter table public.team_members add column if not exists status text not null default 'available';
alter table public.team_members add column if not exists avatar_url text not null default '';

do $$ begin
  alter table public.team_members add constraint team_members_status_check
  check (status in ('available', 'busy', 'away', 'offline'));
exception when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-avatars', 'team-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view team avatars"
on storage.objects for select
using (bucket_id = 'team-avatars');

create policy "Team can upload own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'team-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com'
);

create policy "Team can update own avatar"
on storage.objects for update to authenticated
using (bucket_id = 'team-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'team-avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Team can delete own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'team-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
