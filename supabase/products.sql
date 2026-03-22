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

create table if not exists public.products (
  id bigserial primary key,
  nombre text not null,
  categoria text not null,
  costo_unitario numeric(16,8) not null check (costo_unitario >= 0),
  precio_venta numeric(16,8) check (precio_venta is null or precio_venta >= 0),
  stock integer not null default 0 check (stock >= 0),
  total_comprado integer not null default 0 check (total_comprado >= 0),
  is_active boolean not null default true,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_nombre_idx
  on public.products (nombre);

create index if not exists products_categoria_idx
  on public.products (categoria);

create index if not exists products_is_active_idx
  on public.products (is_active);

drop trigger if exists products_set_updated_at on public.products;

create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

alter table public.products enable row level security;

drop policy if exists "products_select_approved" on public.products;
create policy "products_select_approved"
on public.products
for select
to authenticated
using (public.is_approved_user());

drop policy if exists "products_insert_approved" on public.products;
create policy "products_insert_approved"
on public.products
for insert
to authenticated
with check (
  public.is_approved_user()
  and created_by = auth.uid()
);

drop policy if exists "products_update_approved" on public.products;
create policy "products_update_approved"
on public.products
for update
to authenticated
using (public.is_approved_user())
with check (public.is_approved_user());

drop policy if exists "products_delete_approved" on public.products;
create policy "products_delete_approved"
on public.products
for delete
to authenticated
using (public.is_approved_user());

comment on table public.products is
'Productos del quiosco escolar con categoria, costo, precio opcional, stock actual y total comprado.';



