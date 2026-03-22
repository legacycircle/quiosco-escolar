create or replace function public.is_approved_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_approved = true
  );
$$;

grant execute on function public.is_approved_user() to authenticated;

create table if not exists public.expenses (
  id bigserial primary key,
  concepto text not null,
  tipo text not null check (tipo in ('operativo', 'insumo', 'produccion', 'otro')),
  categoria text not null,
  monto_total numeric(16,8) not null check (monto_total > 0),
  fecha_gasto date not null default current_date,
  notas text,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists expenses_fecha_gasto_idx
  on public.expenses (fecha_gasto desc);

create index if not exists expenses_tipo_idx
  on public.expenses (tipo);

create index if not exists expenses_categoria_idx
  on public.expenses (categoria);

drop trigger if exists expenses_set_updated_at on public.expenses;

create trigger expenses_set_updated_at
before update on public.expenses
for each row
execute function public.set_updated_at();

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_approved" on public.expenses;
create policy "expenses_select_approved"
on public.expenses
for select
to authenticated
using (public.is_approved_user());

drop policy if exists "expenses_insert_approved" on public.expenses;
create policy "expenses_insert_approved"
on public.expenses
for insert
to authenticated
with check (
  public.is_approved_user()
  and created_by = auth.uid()
);

drop policy if exists "expenses_update_approved" on public.expenses;
create policy "expenses_update_approved"
on public.expenses
for update
to authenticated
using (public.is_approved_user())
with check (public.is_approved_user());

drop policy if exists "expenses_delete_approved" on public.expenses;
create policy "expenses_delete_approved"
on public.expenses
for delete
to authenticated
using (public.is_approved_user());

comment on table public.expenses is
'Gastos del quiosco escolar. Usa tipo y categoria para separar operativos, insumos y costos de produccion sin crear tablas adicionales.';
