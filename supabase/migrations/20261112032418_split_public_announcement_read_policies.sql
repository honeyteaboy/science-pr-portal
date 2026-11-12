-- Keep public reads on published announcements and their related rows,
-- while staff-only visibility remains authenticated.
drop policy if exists announcements_read_published_or_staff on public.announcements;
create policy announcements_read_published_anon on public.announcements
for select to anon
using (status = 'published');
create policy announcements_read_published_authenticated on public.announcements
for select to authenticated
using (status = 'published' or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists announcement_cohorts_read on public.announcement_cohorts;
create policy announcement_cohorts_read_anon on public.announcement_cohorts
for select to anon
using (exists (
  select 1 from public.announcements a
  where a.id = announcement_id and a.status = 'published'
));
create policy announcement_cohorts_read_authenticated on public.announcement_cohorts
for select to authenticated
using (
  exists (
    select 1 from public.announcements a
    where a.id = announcement_id and a.status = 'published'
  )
  or public.current_app_role() in ('admin', 'reviewer', 'superadmin')
);

drop policy if exists announcement_links_read on public.announcement_links;
create policy announcement_links_read_anon on public.announcement_links
for select to anon
using (exists (
  select 1 from public.announcements a
  where a.id = announcement_id and a.status = 'published'
));
create policy announcement_links_read_authenticated on public.announcement_links
for select to authenticated
using (
  exists (
    select 1 from public.announcements a
    where a.id = announcement_id and a.status = 'published'
  )
  or public.current_app_role() in ('admin', 'reviewer', 'superadmin')
);
