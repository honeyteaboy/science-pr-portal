-- Separate public active-row reads from authenticated staff reads.
-- This allows current_app_role() to be removed from the anon API surface.
drop policy if exists cohorts_read_active on public.cohorts;
create policy cohorts_read_active_anon on public.cohorts
for select to anon
using (is_active);
create policy cohorts_read_active_authenticated on public.cohorts
for select to authenticated
using (is_active or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists topics_read_active on public.topics;
create policy topics_read_active_anon on public.topics
for select to anon
using (is_active);
create policy topics_read_active_authenticated on public.topics
for select to authenticated
using (is_active or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

revoke all on function public.current_app_role() from public, anon;
grant execute on function public.current_app_role() to authenticated;
