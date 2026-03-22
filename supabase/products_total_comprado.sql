alter table public.products
  add column if not exists total_comprado integer not null default 0 check (total_comprado >= 0);

update public.products
set total_comprado = stock
where total_comprado = 0;
