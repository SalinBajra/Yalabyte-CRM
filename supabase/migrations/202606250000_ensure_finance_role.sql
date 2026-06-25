do $$ begin
  create type public.app_role as enum ('admin', 'finance', 'member');
exception when duplicate_object then null;
end $$;

alter type public.app_role add value if not exists 'finance';
