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

create table if not exists public.prepared_foods (
  id bigserial primary key,
  nombre text not null,
  categoria text not null,
  costo_produccion numeric(16,8) check (costo_produccion is null or costo_produccion >= 0),
  precio_venta numeric(16,8) not null check (precio_venta > 0),
  fecha_preparacion date not null default current_date,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists prepared_foods_nombre_idx
  on public.prepared_foods (nombre);

create index if not exists prepared_foods_categoria_idx
  on public.prepared_foods (categoria);

create index if not exists prepared_foods_fecha_preparacion_idx
  on public.prepared_foods (fecha_preparacion desc);

drop trigger if exists prepared_foods_set_updated_at on public.prepared_foods;

create trigger prepared_foods_set_updated_at
before update on public.prepared_foods
for each row
execute function public.set_updated_at();

alter table public.prepared_foods enable row level security;

drop policy if exists "prepared_foods_select_approved" on public.prepared_foods;
create policy "prepared_foods_select_approved"
on public.prepared_foods
for select
to authenticated
using (public.is_approved_user());

drop policy if exists "prepared_foods_insert_approved" on public.prepared_foods;
create policy "prepared_foods_insert_approved"
on public.prepared_foods
for insert
to authenticated
with check (
  public.is_approved_user()
  and created_by = auth.uid()
);

drop policy if exists "prepared_foods_update_approved" on public.prepared_foods;
create policy "prepared_foods_update_approved"
on public.prepared_foods
for update
to authenticated
using (public.is_approved_user())
with check (public.is_approved_user());

drop policy if exists "prepared_foods_delete_approved" on public.prepared_foods;
create policy "prepared_foods_delete_approved"
on public.prepared_foods
for delete
to authenticated
using (public.is_approved_user());

comment on table public.prepared_foods is
'Alimentos preparados del dia sin control de stock. Guarda nombre, categoria, costo opcional, precio de venta y fecha de preparacion.';
