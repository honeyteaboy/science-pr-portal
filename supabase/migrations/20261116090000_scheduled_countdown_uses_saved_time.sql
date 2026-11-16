create or replace function public.queue_announcement(p_announcement_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_role text;
  v_schedule timestamptz;
  v_announcement public.announcements%rowtype;
begin
  v_role := public.current_app_role();
  if v_role not in ('admin','superadmin') then
    raise exception 'ไม่มีสิทธิ์ส่งประกาศเข้าคิว';
  end if;

  select * into v_announcement
  from public.announcements
  where id = p_announcement_id
  for update;

  if not found then
    raise exception 'ไม่พบประกาศ';
  end if;

  if v_announcement.status <> 'draft' then
    raise exception 'ประกาศนี้ไม่อยู่ในสถานะฉบับร่าง';
  end if;

  if not exists (
    select 1 from public.announcement_cohorts
    where announcement_id = p_announcement_id
  ) then
    raise exception 'กรุณาเลือกกลุ่มเป้าหมายอย่างน้อยหนึ่งรุ่น';
  end if;

  v_schedule := v_announcement.scheduled_publish_at;
  if v_schedule is null then
    raise exception 'กรุณาบันทึกวันและเวลาเผยแพร่ก่อนเริ่มนับถอยหลัง';
  end if;
  if v_schedule <= now() then
    raise exception 'เวลาที่ตั้งไว้ผ่านไปแล้ว กรุณาแก้ไขวันและเวลาใหม่';
  end if;

  update public.announcements
  set status = 'pending'
  where id = p_announcement_id;

  return v_schedule;
end;
$function$;