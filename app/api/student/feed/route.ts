import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", user.id)
      .single();
    if (!profile?.is_active || profile.role !== "student") {
      return NextResponse.json({ error: "ฟีดนี้สำหรับบัญชีนักศึกษาเท่านั้น" }, { status: 403 });
    }

    const [{ data: memberships }, { data: preferences }, { data: announcements }] = await Promise.all([
      supabase
        .from("student_cohort_memberships")
        .select("cohort:cohorts(id,code,label)")
        .eq("profile_id", user.id)
        .not("verified_at", "is", null),
      supabase
        .from("student_preferences")
        .select("topic_ids")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("announcements")
        .select(`
          id,title,body,topic_id,is_urgent,status,published_at,deadline_at,event_date,event_time,event_location,
          topic:topics(id,slug,name),
          targets:announcement_cohorts(cohort:cohorts(id,code,label)),
          links:announcement_links(id,label,url,sort_order)
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false }),
    ]);

    const verifiedCohorts = new Set(
      (memberships ?? [])
        .map((item: { cohort: { id: string; code: string; label: string } | null }) => item.cohort?.id)
        .filter((id): id is string => Boolean(id)),
    );
    const selectedTopics = new Set(preferences?.topic_ids ?? []);

    const items = (announcements ?? []).filter((announcement: any) => {
      const targetRows = announcement.targets ?? [];
      const matchesCohort = targetRows.some((target: any) => target.cohort && verifiedCohorts.has(target.cohort.id));
      const matchesTopic = selectedTopics.size === 0
        || selectedTopics.has(announcement.topic_id)
        || announcement.is_urgent;
      return matchesCohort && matchesTopic;
    });

    return NextResponse.json({ data: items, verifiedCohortCount: verifiedCohorts.size });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถโหลดฟีดประกาศได้" }, { status: 503 });
  }
}
