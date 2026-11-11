import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getStaff() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,role,is_active")
    .eq("id", user.id)
    .single();
  return { supabase, user, profile };
}

export async function GET() {
  try {
    const { supabase, user, profile } = await getStaff();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (!profile?.is_active || !["admin", "reviewer", "superadmin"].includes(profile.role)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ดูรายชื่อนักศึกษา" }, { status: 403 });
    }

    const [{ data: students, error: studentsError }, { data: cohorts, error: cohortsError }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,full_name,is_active,student_cohort_memberships(cohort:cohorts(id,code,label),verified_at,verified_by)")
        .eq("role", "student")
        .order("created_at", { ascending: false }),
      supabase.from("cohorts").select("id,code,label").eq("is_active", true).order("code"),
    ]);

    if (studentsError) throw studentsError;
    if (cohortsError) throw cohortsError;
    return NextResponse.json({ data: students ?? [], cohorts: cohorts ?? [] });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถโหลดรายชื่อนักศึกษาได้" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getStaff();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (!profile?.is_active || !["admin", "superadmin"].includes(profile.role)) {
      return NextResponse.json({ error: "เฉพาะแอดมินหรือผู้ดูแลระบบสูงสุดที่ยืนยันรุ่นได้" }, { status: 403 });
    }

    const input = await request.json() as { profileId?: string; cohortId?: string };
    if (!input.profileId || !input.cohortId) {
      return NextResponse.json({ error: "กรุณาเลือกนักศึกษาและรุ่น" }, { status: 400 });
    }
    const { data: student } = await supabase
      .from("profiles")
      .select("id,role")
      .eq("id", input.profileId)
      .single();
    if (!student || student.role !== "student") {
      return NextResponse.json({ error: "ไม่พบบัญชีนักศึกษาที่ต้องการ" }, { status: 404 });
    }

    const { error } = await supabase
      .from("student_cohort_memberships")
      .upsert({
        profile_id: input.profileId,
        cohort_id: input.cohortId,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      }, { onConflict: "profile_id,cohort_id" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถยืนยันรุ่นนักศึกษาได้ กรุณาตรวจสิทธิ์และฐานข้อมูล" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, user, profile } = await getStaff();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    if (!profile?.is_active || !["admin", "superadmin"].includes(profile.role)) {
      return NextResponse.json({ error: "เฉพาะแอดมินหรือผู้ดูแลระบบสูงสุดที่ถอนการยืนยันรุ่นได้" }, { status: 403 });
    }

    const input = await request.json() as { profileId?: string; cohortId?: string };
    if (!input.profileId || !input.cohortId) {
      return NextResponse.json({ error: "กรุณาเลือกนักศึกษาและรุ่น" }, { status: 400 });
    }

    const { error } = await supabase
      .from("student_cohort_memberships")
      .delete()
      .eq("profile_id", input.profileId)
      .eq("cohort_id", input.cohortId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถถอนการยืนยันรุ่นได้" }, { status: 500 });
  }
}
