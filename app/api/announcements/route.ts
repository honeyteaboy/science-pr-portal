import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AnnouncementLinkInput = { label: string; url: string };
type CreateAnnouncementInput = {
  title?: string;
  body?: string;
  topicId?: string;
  cohortIds?: string[];
  links?: AnnouncementLinkInput[];
  isUrgent?: boolean;
  deadlineAt?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  channels?: string[];
  department?: string;
  actionLine?: string;
  reminderDays?: number[];
  imageUrl?: string | null;
};

async function getCurrentProfile(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active")
    .eq("id", user.id)
    .single();
  return { user, profile };
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        id,title,body,is_urgent,status,channels,deadline_at,event_date,event_time,event_location,department,action_line,reminder_days,image_url,view_count,
        created_at,updated_at,published_at,scheduled_publish_at,created_by,pinned,comments_enabled,
        topic:topics(id,slug,name),
        targets:announcement_cohorts(cohort:cohorts(id,code,label)),
        links:announcement_links(id,label,url,sort_order),
      `)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจการตั้งค่า Supabase" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { profile } = await getCurrentProfile(supabase);
    if (!profile || !profile.is_active || !["admin", "superadmin"].includes(profile.role)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์สร้างประกาศ" }, { status: 403 });
    }

    const input = (await request.json()) as CreateAnnouncementInput;
    const title = input.title?.trim() ?? "";
    const body = input.body?.trim() ?? "";
    if (!title || !body || !input.topicId || !Array.isArray(input.cohortIds) || input.cohortIds.length === 0) {
      return NextResponse.json({ error: "กรุณากรอกหัวข้อ รายละเอียด หัวข้อประกาศ และรุ่นเป้าหมายให้ครบ" }, { status: 400 });
    }

    const links = Array.isArray(input.links) ? input.links : [];
    if (links.some((link) => !link.label?.trim() || !/^https:\/\//i.test(link.url ?? ""))) {
      return NextResponse.json({ error: "ลิงก์ทุกช่องต้องมีชื่อและ URL ที่ขึ้นต้นด้วย https://" }, { status: 400 });
    }

    const { data: announcementId, error } = await supabase.rpc("create_announcement", {
      p_title: title,
      p_body: body,
      p_topic_id: input.topicId,
      p_cohort_ids: input.cohortIds,
      p_links: links.map((link, index) => ({ label: link.label.trim(), url: link.url.trim(), sort_order: index })),
      p_is_urgent: Boolean(input.isUrgent),
      p_deadline_at: input.deadlineAt || null,
      p_event_date: input.eventDate || null,
      p_event_time: input.eventTime || null,
      p_event_location: input.eventLocation || null,
      p_channels: input.channels?.length ? input.channels : ["website"],
      p_department: input.department || "ประชาสัมพันธ์กลาง",
      p_action_line: input.actionLine || null,
      p_reminder_days: input.reminderDays?.length ? input.reminderDays : [14, 7, 3],
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ id: announcementId, status: "draft" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกประกาศได้" }, { status: 500 });
  }
}
