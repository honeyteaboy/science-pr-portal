import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const [{ data: profile }, { data: preferences }, { data: memberships }, { data: topics }] = await Promise.all([
      supabase.from("profiles").select("email,full_name,role,is_active").eq("id", user.id).single(),
      supabase.from("student_preferences").select("topic_ids,email_enabled,important_email_enabled").eq("profile_id", user.id).maybeSingle(),
      supabase.from("student_cohort_memberships").select("cohort:cohorts(code,label),verified_at").eq("profile_id", user.id).not("verified_at", "is", null),
      supabase.from("topics").select("id,slug,name").eq("is_active", true).order("sort_order"),
    ]);

    const { data: consent } = await supabase
      .from("email_consents")
      .select("consented,withdrawn_at,created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      profile,
      preferences: preferences ?? { topic_ids: [], email_enabled: false, important_email_enabled: true },
      memberships: memberships ?? [],
      topics: topics ?? [],
      emailConsent: Boolean(consent?.consented && !consent.withdrawn_at),
    });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถโหลดการตั้งค่าได้ กรุณาตรวจการตั้งค่า Supabase" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: "การตั้งค่านี้ใช้ได้เฉพาะบัญชีนักศึกษา" }, { status: 403 });
    }

    const input = (await request.json()) as {
      topicIds?: string[];
      emailEnabled?: boolean;
      importantEmailEnabled?: boolean;
    };
    const topicIds = Array.isArray(input.topicIds) ? [...new Set(input.topicIds)] : [];
    const { error } = await supabase.rpc("set_student_preferences", {
      p_topic_ids: topicIds,
      p_email_enabled: Boolean(input.emailEnabled),
      p_important_email_enabled: input.importantEmailEnabled !== false,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกการตั้งค่าได้" }, { status: 500 });
  }
}
