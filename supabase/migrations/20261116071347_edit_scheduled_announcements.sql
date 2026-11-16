create or replace function public.update_announcement(
  p_announcement_id uuid,
  p_title text,
  p_body text,
  p_topic_id uuid,
  p_cohort_ids uuid[],
  p_links jsonb default '[]'::jsonb,
  p_is_urgent boolean default false,
  p_deadline_at timestamp with time zone default null,
  p_event_date date default null,
  p_event_time text default null,
  p_event_location text default null,
  p_channels text[] default array['website']::text[],
  p_department text default 'ประชาสัมพันธ์กลาง',
  p_action_line text default null,
  p_reminder_days integer[] default array[14,7,3]::integer[]
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_role text;
  v_link jsonb;
begin
  v_role := public.current_app_role();
  if v_role not in ('admin','superadmin') then
    raise exception 'ไม่มีสิทธิ์แก้ไขประกาศ';
  end if;

  perform 1
  from public.announcements
  where id = p_announcement_id and status in ('draft','pending')
  for update;
  if not found then
    raise exception 'แก้ไขได้เฉพาะประกาศฉบับร่างหรือประกาศที่ตั้งเวลาไว้';
  end if;

  if nullif(trim(p_title),'') is null or nullif(trim(p_body),'') is null then
    raise exception 'กรุณากรอกหัวข้อและรายละเอียดประกาศ';
  end if;
  if p_cohort_ids is null or cardinality(p_cohort_ids)=0 then
    raise exception 'กรุณาเลือกกลุ่มเป้าหมายอย่างน้อยหนึ่งรุ่น';
  end if;
  if exists (
    select 1 from unnest(p_cohort_ids) c
    where not exists (select 1 from public.cohorts co where co.id=c and co.is_active)
  ) then
    raise exception 'พบรุ่นนักศึกษาที่ไม่มีอยู่หรือปิดใช้งานแล้ว';
  end if;
  if jsonb_typeof(coalesce(p_links,'[]'::jsonb)) <> 'array' then
    raise exception 'รูปแบบรายการลิงก์ไม่ถูกต้อง';
  end if;
  for v_link in select value from jsonb_array_elements(coalesce(p_links,'[]'::jsonb)) loop
    if nullif(trim(v_link->>'label'),'') is null or coalesce(v_link->>'url','') !~ '^https://' then
      raise exception 'ลิงก์ทุกช่องต้องมีชื่อและ URL ที่ขึ้นต้นด้วย https://';
    end if;
  end loop;

  update public.announcements set
    title=trim(p_title),
    body=trim(p_body),
    topic_id=p_topic_id,
    is_urgent=coalesce(p_is_urgent,false),
    deadline_at=p_deadline_at,
    event_date=p_event_date,
    event_time=nullif(trim(p_event_time),''),
    event_location=nullif(trim(p_event_location),''),
    channels=coalesce(p_channels,array['website']::text[]),
    department=coalesce(nullif(trim(p_department),''),'ประชาสัมพันธ์กลาง'),
    action_line=nullif(trim(p_action_line),''),
    reminder_days=coalesce(p_reminder_days,array[14,7,3]::integer[]),
    scheduled_publish_at=null,
    status='draft',
    content_updated_at=now(),
    updated_at=now()
  where id=p_announcement_id;

  delete from public.announcement_cohorts where announcement_id=p_announcement_id;
  insert into public.announcement_cohorts(announcement_id,cohort_id)
  select p_announcement_id,cohort_id
  from (select distinct unnest(p_cohort_ids) cohort_id) selected;

  delete from public.announcement_links where announcement_id=p_announcement_id;
  for v_link in select value from jsonb_array_elements(coalesce(p_links,'[]'::jsonb)) loop
    insert into public.announcement_links(announcement_id,label,url,sort_order)
    values(p_announcement_id,trim(v_link->>'label'),trim(v_link->>'url'),coalesce((v_link->>'sort_order')::integer,0));
  end loop;
  return p_announcement_id;
end;
$function$;
