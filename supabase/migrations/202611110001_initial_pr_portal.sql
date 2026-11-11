-- Science PR Portal production schema
-- Apply this file in Supabase SQL Editor. Review the policy section before production use.

create extension if not exists pgcrypto;

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  admission_year integer,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.cohorts (code, label, admission_year)
values
  ('66', 'รุ่น 66', 2023),
  ('67', 'รุ่น 67', 2024),
  ('68', 'รุ่น 68', 2025),
  ('69', 'รุ่น 69', 2026),
  ('70', 'รุ่น 70', 2027)
on conflict (code) do nothing;

insert into public.topics (slug, name, sort_order)
values
  ('general', 'ประกาศทั่วไป', 10),
  ('academic', 'การเรียน', 20),
  ('scholarship', 'ทุนการศึกษา', 30),
  ('student-loan', 'กยศ.', 40),
  ('graduation', 'การยื่นเรื่องจบ', 50),
  ('activities', 'กิจกรรม', 60)
on conflict (slug) do nothing;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'student'
    check (role in ('student', 'admin', 'reviewer', 'superadmin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_unique
  on public.profiles (lower(email))
  where email is not null;

create table if not exists public.student_cohort_memberships (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  is_primary boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (profile_id, cohort_id)
);

create index if not exists student_cohort_memberships_verified_idx
  on public.student_cohort_memberships (cohort_id, profile_id)
  where verified_at is not null;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  topic_id uuid not null references public.topics(id) on delete restrict,
  is_urgent boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'published')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  scheduled_publish_at timestamptz,
  published_at timestamptz,
  deadline_at timestamptz,
  channels text[] not null default array['website']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_pending_schedule_check
    check ((status = 'pending' and scheduled_publish_at is not null)
        or (status <> 'pending' and scheduled_publish_at is null))
);

alter table public.announcements
  add column if not exists event_date date,
  add column if not exists event_time text,
  add column if not exists event_location text,
  add column if not exists pinned boolean not null default false,
  add column if not exists comments_enabled boolean not null default false;

create index if not exists announcements_status_schedule_idx
  on public.announcements (status, scheduled_publish_at);

create index if not exists announcements_published_idx
  on public.announcements (published_at desc)
  where status = 'published';

create table if not exists public.announcement_cohorts (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  primary key (announcement_id, cohort_id)
);

create table if not exists public.announcement_links (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  label text not null,
  url text not null check (url ~ '^https://'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.announcement_reviews (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  cohorts_checked boolean not null default false,
  date_time_links_checked boolean not null default false,
  reviewer_passed boolean not null default false,
  channels_checked boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists announcement_reviews_latest_idx
  on public.announcement_reviews (announcement_id, created_at desc);

create table if not exists public.student_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  topic_ids uuid[] not null default '{}'::uuid[],
  email_enabled boolean not null default false,
  important_email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.email_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  consented boolean not null,
  consent_text_version text not null,
  source text not null default 'student-settings',
  created_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index if not exists email_consents_current_idx
  on public.email_consents (profile_id, created_at desc);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (announcement_id, profile_id)
);

create index if not exists notification_outbox_queue_idx
  on public.notification_outbox (status, next_attempt_at);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name',
             split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert or update of email on auth.users
  for each row execute procedure public.handle_new_auth_user();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists announcements_touch_updated_at on public.announcements;
create trigger announcements_touch_updated_at
  before update on public.announcements
  for each row execute procedure public.touch_updated_at();

create or replace function public.log_announcement_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_details jsonb;
begin
  if tg_op = 'INSERT' then
    v_action := 'created';
    v_details := jsonb_build_object('status', new.status, 'title', new.title);
  elsif old.status is distinct from new.status then
    v_action := case new.status
      when 'pending' then 'queued_for_review'
      when 'published' then 'published'
      when 'draft' then case when old.status = 'pending' then 'suspended_to_draft' else 'returned_to_draft' end
      else 'status_changed'
    end;
    v_details := jsonb_build_object('from', old.status, 'to', new.status, 'title', new.title);
  else
    v_action := 'updated';
    v_details := jsonb_build_object('title', new.title);
  end if;

  insert into public.audit_logs (actor_id, entity_type, entity_id, action, details)
  values (auth.uid(), 'announcement', new.id, v_action, v_details);
  return new;
end;
$$;

drop trigger if exists announcements_audit_log on public.announcements;
create trigger announcements_audit_log
  after insert or update on public.announcements
  for each row execute procedure public.log_announcement_change();

create or replace function public.create_announcement(
  p_title text,
  p_body text,
  p_topic_id uuid,
  p_cohort_ids uuid[],
  p_links jsonb default '[]'::jsonb,
  p_is_urgent boolean default false,
  p_deadline_at timestamptz default null,
  p_event_date date default null,
  p_event_time text default null,
  p_event_location text default null,
  p_channels text[] default array['website']::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_id uuid;
  v_link jsonb;
begin
  v_role := public.current_app_role();
  if v_role not in ('admin', 'reviewer', 'superadmin') then
    raise exception 'ไม่มีสิทธิ์สร้างประกาศ';
  end if;
  if nullif(trim(p_title), '') is null or nullif(trim(p_body), '') is null then
    raise exception 'กรุณากรอกหัวข้อและรายละเอียดประกาศ';
  end if;
  if p_cohort_ids is null or cardinality(p_cohort_ids) = 0 then
    raise exception 'กรุณาเลือกกลุ่มเป้าหมายอย่างน้อยหนึ่งรุ่น';
  end if;
  if exists (
    select 1 from unnest(p_cohort_ids) c
    where not exists (select 1 from public.cohorts co where co.id = c and co.is_active)
  ) then
    raise exception 'พบรุ่นนักศึกษาที่ไม่มีอยู่หรือปิดใช้งานแล้ว';
  end if;
  if jsonb_typeof(coalesce(p_links, '[]'::jsonb)) <> 'array' then
    raise exception 'รูปแบบรายการลิงก์ไม่ถูกต้อง';
  end if;
  for v_link in select value from jsonb_array_elements(coalesce(p_links, '[]'::jsonb)) loop
    if nullif(trim(v_link ->> 'label'), '') is null
       or coalesce(v_link ->> 'url', '') !~ '^https://' then
      raise exception 'ลิงก์ทุกช่องต้องมีชื่อและ URL ที่ขึ้นต้นด้วย https://';
    end if;
  end loop;

  insert into public.announcements (
    title, body, topic_id, is_urgent, created_by, deadline_at,
    event_date, event_time, event_location, channels
  ) values (
    trim(p_title), trim(p_body), p_topic_id, coalesce(p_is_urgent, false),
    auth.uid(), p_deadline_at, p_event_date, nullif(trim(p_event_time), ''),
    nullif(trim(p_event_location), ''), coalesce(p_channels, array['website']::text[])
  )
  returning id into v_id;

  insert into public.announcement_cohorts (announcement_id, cohort_id)
  select v_id, cohort_id from (select distinct unnest(p_cohort_ids) as cohort_id) selected;

  for v_link in select value from jsonb_array_elements(coalesce(p_links, '[]'::jsonb)) loop
    insert into public.announcement_links (announcement_id, label, url, sort_order)
    values (v_id, trim(v_link ->> 'label'), trim(v_link ->> 'url'), coalesce((v_link ->> 'sort_order')::integer, 0));
  end loop;

  return v_id;
end;
$$;

create or replace function public.submit_announcement_review(
  p_announcement_id uuid,
  p_cohorts_checked boolean,
  p_date_time_links_checked boolean,
  p_reviewer_passed boolean,
  p_channels_checked boolean,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_id uuid;
begin
  v_role := public.current_app_role();
  if v_role not in ('reviewer', 'superadmin') then
    raise exception 'เฉพาะผู้ตรวจสอบที่ได้รับสิทธิ์เท่านั้นที่บันทึกผลตรวจได้';
  end if;
  if not exists (select 1 from public.announcements where id = p_announcement_id and status = 'draft') then
    raise exception 'ตรวจได้เฉพาะประกาศฉบับร่าง';
  end if;

  insert into public.announcement_reviews (
    announcement_id, reviewer_id, cohorts_checked, date_time_links_checked,
    reviewer_passed, channels_checked, notes
  ) values (
    p_announcement_id, auth.uid(), coalesce(p_cohorts_checked, false),
    coalesce(p_date_time_links_checked, false), coalesce(p_reviewer_passed, false),
    coalesce(p_channels_checked, false), p_notes
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.queue_announcement(p_announcement_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_schedule timestamptz;
  v_announcement public.announcements%rowtype;
begin
  v_role := public.current_app_role();
  if v_role not in ('admin', 'reviewer', 'superadmin') then
    raise exception 'ไม่มีสิทธิ์ส่งประกาศเข้าคิว';
  end if;

  select * into v_announcement
  from public.announcements
  where id = p_announcement_id
  for update;

  if not found then raise exception 'ไม่พบประกาศ'; end if;
  if v_announcement.status not in ('draft', 'pending') then
    raise exception 'ประกาศนี้ไม่อยู่ในสถานะที่ส่งเข้าคิวได้';
  end if;
  if not exists (select 1 from public.announcement_cohorts where announcement_id = p_announcement_id) then
    raise exception 'กรุณาเลือกกลุ่มเป้าหมายอย่างน้อยหนึ่งรุ่น';
  end if;
  if not exists (
    select 1 from public.announcement_reviews r
    join public.profiles p on p.id = r.reviewer_id
    where r.announcement_id = p_announcement_id
      and r.created_at >= v_announcement.updated_at
      and r.cohorts_checked
      and r.date_time_links_checked
      and r.reviewer_passed
      and r.channels_checked
      and p.role in ('reviewer', 'superadmin')
      and p.is_active
  ) then
    raise exception 'ต้องมีผู้ตรวจสอบบันทึกผลตรวจครบทุกข้อก่อน';
  end if;

  v_schedule := now() + interval '10 minutes';
  update public.announcements
  set status = 'pending',
      scheduled_publish_at = v_schedule
  where id = p_announcement_id;

  return v_schedule;
end;
$$;

create or replace function public.publish_announcement_now(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_announcement public.announcements%rowtype;
begin
  v_role := public.current_app_role();
  if v_role not in ('admin', 'reviewer', 'superadmin') then
    raise exception 'ไม่มีสิทธิ์อนุมัติประกาศ';
  end if;

  select * into v_announcement
  from public.announcements
  where id = p_announcement_id
  for update;

  if not found then raise exception 'ไม่พบประกาศ'; end if;
  if v_announcement.status not in ('draft', 'pending') then
    raise exception 'ประกาศนี้เผยแพร่แล้วหรือไม่สามารถอนุมัติได้';
  end if;
  if not exists (select 1 from public.announcement_cohorts where announcement_id = p_announcement_id) then
    raise exception 'กรุณาเลือกกลุ่มเป้าหมายอย่างน้อยหนึ่งรุ่น';
  end if;
  if not exists (
    select 1 from public.announcement_reviews r
    join public.profiles p on p.id = r.reviewer_id
    where r.announcement_id = p_announcement_id
      and r.created_at >= v_announcement.updated_at
      and r.cohorts_checked
      and r.date_time_links_checked
      and r.reviewer_passed
      and r.channels_checked
      and p.role in ('reviewer', 'superadmin')
      and p.is_active
  ) then
    raise exception 'ต้องมีผู้ตรวจสอบบันทึกผลตรวจครบทุกข้อก่อน';
  end if;

  update public.announcements
  set status = 'published',
      published_at = now(),
      scheduled_publish_at = null
  where id = p_announcement_id;
end;
$$;

create or replace function public.suspend_announcement(p_announcement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  v_role := public.current_app_role();
  if v_role not in ('admin', 'reviewer', 'superadmin') then
    raise exception 'ไม่มีสิทธิ์ระงับประกาศ';
  end if;

  update public.announcements
  set status = 'draft',
      scheduled_publish_at = null
  where id = p_announcement_id
    and status = 'pending';

  if not found then raise exception 'ประกาศนี้ไม่ได้อยู่ในคิวรอ'; end if;
end;
$$;

create or replace function public.publish_due_announcements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  with due as (
    select a.id
    from public.announcements a
    where a.status = 'pending'
      and a.scheduled_publish_at <= now()
      and exists (
        select 1
        from public.announcement_cohorts ac
        where ac.announcement_id = a.id
      )
      and exists (
        select 1
        from public.announcement_reviews r
        join public.profiles p on p.id = r.reviewer_id
        where r.announcement_id = a.id
          and r.created_at >= a.updated_at
          and r.cohorts_checked
          and r.date_time_links_checked
          and r.reviewer_passed
          and r.channels_checked
          and p.role in ('reviewer', 'superadmin')
          and p.is_active
      )
    for update skip locked
  )
  update public.announcements a
  set status = 'published',
      published_at = now(),
      scheduled_publish_at = null
  from due
  where a.id = due.id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.set_student_preferences(
  p_topic_ids uuid[],
  p_email_enabled boolean,
  p_important_email_enabled boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_email text;
begin
  v_role := public.current_app_role();
  if v_role <> 'student' then
    raise exception 'การตั้งค่านี้ใช้ได้เฉพาะบัญชีนักศึกษา';
  end if;
  select email into v_email from public.profiles where id = auth.uid();
  if coalesce(p_email_enabled, false) and not exists (
    select 1 from public.email_consents
    where profile_id = auth.uid()
      and email = v_email
      and consented
      and withdrawn_at is null
  ) then
    raise exception 'ต้องยินยอมรับประกาศทางอีเมลก่อนเปิดการส่งอีเมล';
  end if;
  insert into public.student_preferences (
    profile_id, topic_ids, email_enabled, important_email_enabled
  ) values (
    auth.uid(), coalesce(p_topic_ids, '{}'::uuid[]),
    coalesce(p_email_enabled, false), coalesce(p_important_email_enabled, true)
  )
  on conflict (profile_id) do update
    set topic_ids = excluded.topic_ids,
        email_enabled = excluded.email_enabled,
        important_email_enabled = excluded.important_email_enabled,
        updated_at = now();
end;
$$;

create or replace function public.record_student_email_consent(
  p_consented boolean,
  p_consent_text_version text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_email text;
  v_id uuid;
begin
  v_role := public.current_app_role();
  if v_role <> 'student' then
    raise exception 'การยินยอมนี้ใช้ได้เฉพาะบัญชีนักศึกษา';
  end if;
  select email into v_email from public.profiles where id = auth.uid();
  if nullif(v_email, '') is null then
    raise exception 'บัญชีนี้ยังไม่มีอีเมลที่ยืนยันแล้ว';
  end if;
  if coalesce(p_consented, false) then
    insert into public.email_consents (
      profile_id, email, consented, consent_text_version, source
    ) values (
      auth.uid(), v_email, true, coalesce(nullif(p_consent_text_version, ''), 'v1'), 'student-settings'
    ) returning id into v_id;
  else
    update public.email_consents
    set withdrawn_at = now()
    where profile_id = auth.uid()
      and consented
      and withdrawn_at is null;

    insert into public.email_consents (
      profile_id, email, consented, consent_text_version, source, withdrawn_at
    ) values (
      auth.uid(), v_email, false, coalesce(nullif(p_consent_text_version, ''), 'v1'),
      'student-settings', now()
    ) returning id into v_id;

    update public.student_preferences
    set email_enabled = false, updated_at = now()
    where profile_id = auth.uid();
  end if;
  return v_id;
end;
$$;

create or replace function public.enqueue_announcement_email_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    insert into public.notification_outbox
      (announcement_id, profile_id, recipient_email)
    select
      new.id,
      p.id,
      p.email
    from public.profiles p
    join public.student_cohort_memberships scm
      on scm.profile_id = p.id and scm.verified_at is not null
    join public.announcement_cohorts ac
      on ac.cohort_id = scm.cohort_id and ac.announcement_id = new.id
    join public.student_preferences sp
      on sp.profile_id = p.id and sp.email_enabled
    where p.is_active
      and p.email is not null
      and (
        cardinality(sp.topic_ids) = 0
        or new.topic_id = any(sp.topic_ids)
        or (new.is_urgent and sp.important_email_enabled)
      )
      and exists (
        select 1
        from public.email_consents ec
        where ec.profile_id = p.id
          and ec.email = p.email
          and ec.consented
          and ec.withdrawn_at is null
      )
    on conflict (announcement_id, profile_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists announcements_enqueue_email on public.announcements;
create trigger announcements_enqueue_email
  after insert or update of status on public.announcements
  for each row execute procedure public.enqueue_announcement_email_notifications();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.cohorts enable row level security;
alter table public.topics enable row level security;
alter table public.student_cohort_memberships enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_cohorts enable row level security;
alter table public.announcement_links enable row level security;
alter table public.announcement_reviews enable row level security;
alter table public.student_preferences enable row level security;
alter table public.email_consents enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notification_outbox enable row level security;

drop policy if exists profiles_read_self_or_staff on public.profiles;
create policy profiles_read_self_or_staff on public.profiles
for select to authenticated
using (id = auth.uid() or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists profiles_manage_superadmin on public.profiles;
create policy profiles_manage_superadmin on public.profiles
for update to authenticated
using (public.current_app_role() = 'superadmin')
with check (public.current_app_role() = 'superadmin');

drop policy if exists cohorts_read_active on public.cohorts;
create policy cohorts_read_active on public.cohorts
for select to anon, authenticated
using (is_active or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists cohorts_manage_staff on public.cohorts;
create policy cohorts_manage_staff on public.cohorts
for all to authenticated
using (public.current_app_role() in ('admin', 'superadmin'))
with check (public.current_app_role() in ('admin', 'superadmin'));

drop policy if exists topics_read_active on public.topics;
create policy topics_read_active on public.topics
for select to anon, authenticated
using (is_active or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists topics_manage_staff on public.topics;
create policy topics_manage_staff on public.topics
for all to authenticated
using (public.current_app_role() in ('admin', 'superadmin'))
with check (public.current_app_role() in ('admin', 'superadmin'));

drop policy if exists memberships_read_self_or_staff on public.student_cohort_memberships;
create policy memberships_read_self_or_staff on public.student_cohort_memberships
for select to authenticated
using (profile_id = auth.uid() or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists memberships_manage_staff on public.student_cohort_memberships;
create policy memberships_manage_staff on public.student_cohort_memberships
for all to authenticated
using (public.current_app_role() in ('admin', 'superadmin'))
with check (public.current_app_role() in ('admin', 'superadmin'));

drop policy if exists announcements_read_published_or_staff on public.announcements;
create policy announcements_read_published_or_staff on public.announcements
for select to anon, authenticated
using (status = 'published' or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists announcements_insert_staff on public.announcements;
create policy announcements_insert_staff on public.announcements
for insert to authenticated
with check (
  created_by = auth.uid()
  and public.current_app_role() in ('admin', 'reviewer', 'superadmin')
);

drop policy if exists announcements_update_staff on public.announcements;
create policy announcements_update_staff on public.announcements
for update to authenticated
using (public.current_app_role() in ('admin', 'reviewer', 'superadmin'))
with check (public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists announcements_delete_superadmin on public.announcements;
create policy announcements_delete_superadmin on public.announcements
for delete to authenticated
using (public.current_app_role() = 'superadmin');

drop policy if exists announcement_cohorts_read on public.announcement_cohorts;
create policy announcement_cohorts_read on public.announcement_cohorts
for select to anon, authenticated
using (
  exists (
    select 1 from public.announcements a
    where a.id = announcement_id and a.status = 'published'
  )
  or public.current_app_role() in ('admin', 'reviewer', 'superadmin')
);

drop policy if exists announcement_cohorts_manage_staff on public.announcement_cohorts;
create policy announcement_cohorts_manage_staff on public.announcement_cohorts
for all to authenticated
using (public.current_app_role() in ('admin', 'reviewer', 'superadmin'))
with check (public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists announcement_links_read on public.announcement_links;
create policy announcement_links_read on public.announcement_links
for select to anon, authenticated
using (
  exists (
    select 1 from public.announcements a
    where a.id = announcement_id and a.status = 'published'
  )
  or public.current_app_role() in ('admin', 'reviewer', 'superadmin')
);

drop policy if exists announcement_links_manage_staff on public.announcement_links;
create policy announcement_links_manage_staff on public.announcement_links
for all to authenticated
using (public.current_app_role() in ('admin', 'reviewer', 'superadmin'))
with check (public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists announcement_reviews_read_staff on public.announcement_reviews;
create policy announcement_reviews_read_staff on public.announcement_reviews
for select to authenticated
using (public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists announcement_reviews_insert_reviewer on public.announcement_reviews;
create policy announcement_reviews_insert_reviewer on public.announcement_reviews
for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and public.current_app_role() in ('reviewer', 'superadmin')
);

drop policy if exists student_preferences_read_own on public.student_preferences;
create policy student_preferences_read_own on public.student_preferences
for select to authenticated
using (profile_id = auth.uid());

drop policy if exists student_preferences_insert_own on public.student_preferences;
create policy student_preferences_insert_own on public.student_preferences
for insert to authenticated
with check (
  profile_id = auth.uid()
  and public.current_app_role() = 'student'
);

drop policy if exists student_preferences_update_own on public.student_preferences;
create policy student_preferences_update_own on public.student_preferences
for update to authenticated
using (profile_id = auth.uid() and public.current_app_role() = 'student')
with check (profile_id = auth.uid() and public.current_app_role() = 'student');

drop policy if exists email_consents_read_own_or_staff on public.email_consents;
create policy email_consents_read_own_or_staff on public.email_consents
for select to authenticated
using (profile_id = auth.uid() or public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists email_consents_insert_own on public.email_consents;
create policy email_consents_insert_own on public.email_consents
for insert to authenticated
with check (profile_id = auth.uid() and public.current_app_role() = 'student');

drop policy if exists audit_logs_read_staff on public.audit_logs;
create policy audit_logs_read_staff on public.audit_logs
for select to authenticated
using (public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

drop policy if exists notification_outbox_read_staff on public.notification_outbox;
create policy notification_outbox_read_staff on public.notification_outbox
for select to authenticated
using (public.current_app_role() in ('admin', 'reviewer', 'superadmin'));

-- Only the database scheduler should call this function.
revoke all on function public.publish_due_announcements() from public, anon, authenticated;
revoke all on function public.create_announcement(text, text, uuid, uuid[], jsonb, boolean, timestamptz, date, text, text, text[]) from public, anon;
revoke all on function public.submit_announcement_review(uuid, boolean, boolean, boolean, boolean, text) from public, anon;
revoke all on function public.set_student_preferences(uuid[], boolean, boolean) from public, anon;
revoke all on function public.record_student_email_consent(boolean, text) from public, anon;
grant execute on function public.set_student_preferences(uuid[], boolean, boolean) to authenticated;
grant execute on function public.record_student_email_consent(boolean, text) to authenticated;
grant execute on function public.create_announcement(text, text, uuid, uuid[], jsonb, boolean, timestamptz, date, text, text, text[]) to authenticated;
grant execute on function public.submit_announcement_review(uuid, boolean, boolean, boolean, boolean, text) to authenticated;
revoke all on function public.queue_announcement(uuid) from public, anon;
revoke all on function public.publish_announcement_now(uuid) from public, anon;
revoke all on function public.suspend_announcement(uuid) from public, anon;
grant execute on function public.queue_announcement(uuid) to authenticated;
grant execute on function public.publish_announcement_now(uuid) to authenticated;
grant execute on function public.suspend_announcement(uuid) to authenticated;

-- Schedule one-minute server-side publish checks if pg_cron is available.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    execute 'create extension if not exists pg_cron';
    if to_regnamespace('cron') is not null then
      execute 'select cron.schedule(''science-pr-publish-due-announcements'', ''* * * * *'', ''select public.publish_due_announcements();'')';
    end if;
  end if;
exception when others then
  raise notice 'pg_cron schedule was not installed automatically: %', sqlerrm;
end;
$$;
