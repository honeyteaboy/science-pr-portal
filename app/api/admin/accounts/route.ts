import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const ADMIN_EMAIL_DOMAIN = "admin.sciencepr.local";

export async function POST(request: NextRequest) {
  try {
    const sessionClient = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const { data: actor } = await sessionClient.from("profiles").select("role,is_active").eq("id", user.id).single();
    if (!actor?.is_active || actor.role !== "superadmin") {
      return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่สร้างบัญชีแอดมินได้" }, { status: 403 });
    }

    const input = await request.json() as { username?: string; name?: string; password?: string; role?: string };
    const username = String(input.username || "").trim().toLowerCase();
    const name = String(input.name || "").trim();
    const password = String(input.password || "");
    const role = input.role === "superadmin" ? "superadmin" : "admin";

    if (!/^[a-z0-9._-]{3,32}$/.test(username)) return NextResponse.json({ error: "ชื่อบัญชีต้องมี 3–32 ตัว ใช้ a-z, 0-9, จุด ขีด หรือขีดล่าง" }, { status: 400 });
    if (!name || name.length > 100) return NextResponse.json({ error: "กรุณากรอกชื่อผู้ดูแล" }, { status: 400 });
    if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "รหัสผ่านต้องมี 8–128 ตัวอักษร" }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel" }, { status: 503 });

    const adminClient = createSupabaseClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const email = username + "@" + ADMIN_EMAIL_DOMAIN;
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: name, username, account_type: "admin" },
    });
    if (createError || !created.user) {
      const message = createError?.message || "ไม่สามารถสร้างบัญชีผู้ดูแลได้";
      return NextResponse.json({ error: /already|registered|exists/i.test(message) ? "ชื่อบัญชีนี้ถูกใช้งานแล้ว" : message }, { status: 409 });
    }

    const { error: profileError } = await adminClient.from("profiles")
      .update({ username, full_name: name, role, is_active: true }).eq("id", created.user.id);
    if (profileError) {
      await adminClient.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: "บันทึกโปรไฟล์ไม่สำเร็จ กรุณารัน migration เพิ่ม username ก่อน" }, { status: 500 });
    }

    return NextResponse.json({ data: { id: created.user.id, username, name, role } }, { status: 201 });
  } catch (error) {
    console.error("Admin account creation failed", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างบัญชีแอดมิน" }, { status: 500 });
  }
}
