-- Bucket and storage rules used by src/products/mediaService.js.
alter table public.products
  add column if not exists image_url text,
  add column if not exists images text[] not null default '{}',
  add column if not exists old_price numeric,
  add column if not exists videos text[] not null default '{}',
  add column if not exists video_url text,
  add column if not exists stock integer,
  add column if not exists brand text not null default '',
  add column if not exists condition text not null default 'new';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  52428800,
  array['image/jpeg', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product media" on storage.objects;
create policy "Public can read product media"
  on storage.objects for select
  using (bucket_id = 'product-media');

drop policy if exists "Sellers can upload their product media" on storage.objects;
create policy "Sellers can upload their product media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'product-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Sellers can delete their product media" on storage.objects;
create policy "Sellers can delete their product media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'product-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
