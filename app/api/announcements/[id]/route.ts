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
        reviews:announcement_reviews(id,reviewer_id,cohorts_checked,date_time_links_checked,reviewer_passed,channels_checked,created_at)
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
