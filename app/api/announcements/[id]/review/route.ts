import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteContext = { params: { id: string } };
type ReviewInput = {
  cohortsChecked?: boolean;
  dateTimeLinksChecked?: boolean;
  reviewerPassed?: boolean;
  channelsChecked?: boolean;
  notes?: string;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", user.id)
      .single();
    if (!profile?.is_active || !["reviewer", "superadmin"].includes(profile.role)) {
      return NextResponse.json({ error: "ต้องใช้บัญชีผู้ตรวจสอบที่ได้รับอนุญาต" }, { status: 403 });
    }

    const input = (await request.json()) as ReviewInput;
    const { data, error } = await supabase.rpc("submit_announcement_review", {
      p_announcement_id: context.params.id,
      p_cohorts_checked: Boolean(input.cohortsChecked),
      p_date_time_links_checked: Boolean(input.dateTimeLinksChecked),
      p_reviewer_passed: Boolean(input.reviewerPassed),
      p_channels_checked: Boolean(input.channelsChecked),
      p_notes: input.notes ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, reviewId: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถบันทึกผลตรวจทานได้" }, { status: 500 });
  }
}
