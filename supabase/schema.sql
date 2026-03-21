create type public.app_role as enum ('owner', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  role public.app_role not null default 'admin',
  is_approved boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index profiles_single_owner_idx
  on public.profiles ((role))
  where role = 'owner';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

comment on table public.profiles is
'Perfil base del usuario autenticado. Owner y Admin usan esta tabla para aprobación manual.';

-- 1) Ejecuta esto una sola vez después de crear la cuenta del owner:
-- update public.profiles
-- set role = 'owner',
--     is_approved = true,
--     approved_at = timezone('utc', now()),
--     approved_by = id
-- where email = 'tu-correo-owner@dominio.com';

-- 2) Para aprobar un admin manualmente:
-- update public.profiles
-- set is_approved = true,
--     approved_at = timezone('utc', now()),
--     approved_by = (select id from public.profiles where role = 'owner' limit 1)
-- where email = 'admin@dominio.com'
--   and role = 'admin';
