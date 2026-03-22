drop policy if exists "products_delete_approved" on public.products;

create policy "products_delete_approved"
on public.products
for delete
to authenticated
using (public.is_approved_user());
