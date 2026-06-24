create policy "YalaByte team can delete contacts"
on public.contacts
for delete
to authenticated
using (lower(coalesce(auth.jwt() ->> 'email', '')) like '%@yalabyte.com');

grant delete on public.contacts to authenticated;
