alter table public.sale_items
  add column if not exists prepared_food_id bigint references public.prepared_foods(id) on delete restrict;

alter table public.sale_items
  alter column product_id drop not null;

create index if not exists sale_items_prepared_food_id_idx
  on public.sale_items (prepared_food_id);

alter table public.sale_items
  drop constraint if exists sale_items_single_source_check;

alter table public.sale_items
  add constraint sale_items_single_source_check
  check (num_nonnulls(product_id, prepared_food_id) = 1);

comment on table public.sale_items is
'Lineas de venta de productos o alimentos. Guarda cantidad, precio y costo snapshot.';
