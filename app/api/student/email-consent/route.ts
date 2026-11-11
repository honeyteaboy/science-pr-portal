import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "การยินยอมนี้ใช้ได้เฉพาะบัญชีนักศึกษา" }, { status: 403 });
    }

    const input = (await request.json()) as { consented?: boolean };
    if (typeof input.consented !== "boolean") {
      return NextResponse.json({ error: "กรุณาระบุว่าจะยินยอมหรือถอนความยินยอม" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("record_student_email_consent", {
      p_consented: input.consented,
      p_consent_text_version: "2026-11-v1",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, consentId: data, consented: input.consented });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกความยินยอมได้" }, { status: 500 });
  }
}
