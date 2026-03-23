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

create table if not exists public.sales (
  id bigserial primary key,
  sale_date date not null default current_date,
  notes text,
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sale_items (
  id bigserial primary key,
  sale_id bigint not null references public.sales(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_snapshot numeric(16,8) not null check (unit_price_snapshot >= 0),
  unit_cost_snapshot numeric(16,8) not null check (unit_cost_snapshot >= 0),
  line_total numeric(16,8) not null check (line_total >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sales_sale_date_idx
  on public.sales (sale_date desc);

create index if not exists sales_created_by_idx
  on public.sales (created_by);

create index if not exists sale_items_sale_id_idx
  on public.sale_items (sale_id);

create index if not exists sale_items_product_id_idx
  on public.sale_items (product_id);

create index if not exists sale_items_created_at_idx
  on public.sale_items (created_at desc);

drop trigger if exists sales_set_updated_at on public.sales;

create trigger sales_set_updated_at
before update on public.sales
for each row
execute function public.set_updated_at();

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

drop policy if exists "sales_select_approved" on public.sales;
create policy "sales_select_approved"
on public.sales
for select
to authenticated
using (public.is_approved_user());

drop policy if exists "sales_insert_approved" on public.sales;
create policy "sales_insert_approved"
on public.sales
for insert
to authenticated
with check (
  public.is_approved_user()
  and created_by = auth.uid()
);

drop policy if exists "sales_update_approved" on public.sales;
create policy "sales_update_approved"
on public.sales
for update
to authenticated
using (public.is_approved_user())
with check (public.is_approved_user());

drop policy if exists "sales_delete_approved" on public.sales;
create policy "sales_delete_approved"
on public.sales
for delete
to authenticated
using (public.is_approved_user());

drop policy if exists "sale_items_select_approved" on public.sale_items;
create policy "sale_items_select_approved"
on public.sale_items
for select
to authenticated
using (public.is_approved_user());

drop policy if exists "sale_items_insert_approved" on public.sale_items;
create policy "sale_items_insert_approved"
on public.sale_items
for insert
to authenticated
with check (
  public.is_approved_user()
  and exists (
    select 1
    from public.sales
    where sales.id = sale_items.sale_id
      and sales.created_by = auth.uid()
  )
);

drop policy if exists "sale_items_update_approved" on public.sale_items;
create policy "sale_items_update_approved"
on public.sale_items
for update
to authenticated
using (public.is_approved_user())
with check (public.is_approved_user());

drop policy if exists "sale_items_delete_approved" on public.sale_items;
create policy "sale_items_delete_approved"
on public.sale_items
for delete
to authenticated
using (public.is_approved_user());

comment on table public.sales is
'Cabecera de cierres diarios de venta del quiosco escolar.';

comment on table public.sale_items is
'Lineas de productos vendidos por cierre diario. Guarda cantidad, precio y costo snapshot.';