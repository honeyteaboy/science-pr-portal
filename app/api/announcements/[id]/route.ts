import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteContext = { params: { id: string } };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        id,title,body,is_urgent,status,channels,deadline_at,event_date,event_time,event_location,
        department,action_line,reminder_days,image_url,view_count,created_at,updated_at,published_at,
        scheduled_publish_at,created_by,pinned,comments_enabled,
        topic:topics(id,slug,name),
        targets:announcement_cohorts(cohort:cohorts(id,code,label)),
        links:announcement_links(id,label,url,sort_order),
      `)
      .eq("id", context.params.id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "ไม่พบประกาศนี้ หรือประกาศยังไม่เผยแพร่" }, { status: 404 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถโหลดรายละเอียดประกาศได้" }, { status: 503 });
  }
}

 
export async function PUT(request: Request, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", user.id)
      .single();
    if (!profile?.is_active || !["admin", "superadmin"].includes(profile.role)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขประกาศ" }, { status: 403 });
    }

    const input = await request.json() as {
      title?: string; body?: string; topicId?: string; cohortIds?: string[];
      links?: { label: string; url: string }[]; isUrgent?: boolean;
      deadlineAt?: string | null; eventDate?: string | null; eventTime?: string | null;
      eventLocation?: string | null; channels?: string[]; department?: string;
      actionLine?: string; reminderDays?: number[];
    };
    const title = input.title?.trim() || "";
    const body = input.body?.trim() || "";
    if (!title || !body || !input.topicId || !Array.isArray(input.cohortIds) || input.cohortIds.length === 0) {
      return NextResponse.json({ error: "กรุณากรอกหัวข้อ รายละเอียด หัวข้อประกาศ และรุ่นเป้าหมายให้ครบ" }, { status: 400 });
    }
    const links = Array.isArray(input.links) ? input.links : [];
    if (links.some((link) => !link.label?.trim() || !/^https:\/\//i.test(link.url ?? ""))) {
      return NextResponse.json({ error: "ลิงก์ทุกช่องต้องมีชื่อและ URL ที่ขึ้นต้นด้วย https://" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("update_announcement", {
      p_announcement_id: context.params.id,
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
    return NextResponse.json({ id: data, status: "draft" });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถแก้ไขประกาศได้" }, { status: 500 });
  }
}
