-- Announcement media library: public image delivery, staff-only upload and browsing.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'announcement-media',
  'announcement-media',
  true,
  15728640,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "announcement_media_staff_select" on storage.objects;
create policy "announcement_media_staff_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'announcement-media'
  and public.current_app_role() = any (array['admin','superadmin']::text[])
);

drop policy if exists "announcement_media_staff_insert" on storage.objects;
create policy "announcement_media_staff_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'announcement-media'
  and public.current_app_role() = any (array['admin','superadmin']::text[])
);

drop policy if exists "announcement_media_staff_update" on storage.objects;
create policy "announcement_media_staff_update"
on storage.objects for update to authenticated
using (
  bucket_id = 'announcement-media'
  and public.current_app_role() = any (array['admin','superadmin']::text[])
)
with check (
  bucket_id = 'announcement-media'
  and public.current_app_role() = any (array['admin','superadmin']::text[])
);

drop policy if exists "announcement_media_staff_delete" on storage.objects;
create policy "announcement_media_staff_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'announcement-media'
  and public.current_app_role() = any (array['admin','superadmin']::text[])
);
