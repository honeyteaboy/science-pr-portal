import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }

    const { data: actor, error: actorError } = await supabase
      .from("profiles").select("role,is_active").eq("id", user.id).single();
    if (actorError || !actor?.is_active || actor.role !== "superadmin") {
      return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่สร้างบัญชีแอดมินได้" }, { status: 403 });
    }

    const input = await request.json() as {
      username?: string; name?: string; password?: string; role?: "admin" | "superadmin";
    };
    const username = String(input.username || "").trim().toLowerCase();
    const name = String(input.name || "").trim();
    const password = String(input.password || "");
    const role = input.role === "superadmin" ? "superadmin" : "admin";

    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return NextResponse.json({ error: "ชื่อบัญชีไม่ถูกต้อง" }, { status: 400 });
    }
    if (!name || name.length > 100 || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "กรุณาตรวจชื่อผู้ดูแลและรหัสผ่าน (8–128 ตัวอักษร)" }, { status: 400 });
    }

    const { data, error } = await supabase.functions.invoke("create-admin-account", {
      body: { username, name, password, role },
    });
    if (error) {
      console.error("Admin Edge Function failed", error);
      return NextResponse.json({ error: "ไม่สามารถสร้างบัญชีได้ ตรวจสอบการตั้งค่า Supabase Function แล้วลองอีกครั้ง" }, { status: 502 });
    }
    if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Admin account API failed", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างบัญชีแอดมิน" }, { status: 500 });
  }
}
