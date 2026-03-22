alter table public.products
  alter column precio_venta drop not null;

alter table public.products
  drop constraint if exists products_precio_venta_check;

alter table public.products
  add constraint products_precio_venta_check
  check (precio_venta is null or precio_venta >= 0);
