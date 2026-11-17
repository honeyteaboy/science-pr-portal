import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RouteContext = { params: { id: string } };

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
    if (!profile?.is_active || !["admin", "superadmin"].includes(profile.role)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ดำเนินการกับประกาศ" }, { status: 403 });
    }

    const body = (await request.json()) as { action?: string; value?: boolean; status?: "draft" | "published" };
    const action = body.action;
    if (action === "pin" || action === "comments" || action === "status") {
      if (action === "status" && !["draft", "published"].includes(String(body.status ?? ""))) {
        return NextResponse.json({ error: "สถานะประกาศไม่ถูกต้อง" }, { status: 400 });
      }
      const payload = body;
      const update: Record<string, unknown> = {};
      if (action === "pin") update.pinned = Boolean(payload.value);
      if (action === "comments") update.comments_enabled = Boolean(payload.value);
      if (action === "status") {
        update.status = payload.status;
        update.scheduled_publish_at = null;
        update.published_at = payload.status === "published" ? new Date().toISOString() : null;
      }
      const { error } = await supabase.from("announcements").update(update).eq("id", context.params.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, action });
    }

    if (action === "delete") {
      if (profile.role !== "superadmin") {
        return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ลบประกาศได้" }, { status: 403 });
      }
      const { error } = await supabase.from("announcements").delete().eq("id", context.params.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, action });
    }

    if (!["queue", "publish_now", "suspend"].includes(action ?? "")) {
      return NextResponse.json({ error: "ไม่รู้จักคำสั่งนี้" }, { status: 400 });
    }

    const rpcName = action === "queue"
      ? "queue_announcement"
      : action === "publish_now"
        ? "publish_announcement_now"
        : "suspend_announcement";

    const { data, error } = await supabase.rpc(rpcName, { p_announcement_id: context.params.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({
      ok: true,
      action,
      scheduledPublishAt: action === "queue" ? data : null,
    });
  } catch {
    return NextResponse.json({ error: "ไม่สามารถดำเนินการได้" }, { status: 500 });
  }
}
