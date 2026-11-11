"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, ShieldCheck, GraduationCap, Info, LoaderCircle } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<"student" | "staff">("student");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const configured = isSupabaseConfigured();

  const callbackUrl = () => {
    const next = kind === "staff" ? "/admin" : "/";
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  };

  const signInWithEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!configured) {
      setError("ยังไม่ได้เชื่อม Supabase กรุณาตั้งค่า URL และ Publishable Key ก่อน");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setLoading("email");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: callbackUrl() },
      });
      if (authError) throw authError;
      setMessage("ส่งลิงก์ยืนยันการเข้าสู่ระบบไปยังอีเมลแล้ว กรุณาเปิดลิงก์เพื่อเข้าสู่ระบบ");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถส่งลิงก์เข้าสู่ระบบได้");
    } finally {
      setLoading(null);
    }
  };

  const signInWithGoogle = async () => {
    setError("");
    setMessage("");
    if (!configured) {
      setError("ยังไม่ได้เชื่อม Supabase กรุณาตั้งค่า URL และ Publishable Key ก่อน");
      return;
    }

    setLoading("google");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl(),
          scopes: "openid email profile",
          queryParams: { prompt: "select_account" },
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
      setLoading(null);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f9fb] px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
          <ArrowLeft size={16} /> กลับหน้าหลัก
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ocean-900 text-white">
            <ShieldCheck size={25} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs font-black tracking-[.2em] text-ocean-700">SCIENCE PR PORTAL</p>
            <h1 className="mt-2 text-2xl font-black">เข้าสู่ระบบ</h1>
            <p className="mt-2 text-sm text-slate-500">ยืนยันตัวตนด้วยอีเมล ไม่ใช้รหัสผ่านที่ระบบกำหนดเอง</p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setKind("student"); setError(""); setMessage(""); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold ${kind === "student" ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500"}`}
            >
              <GraduationCap size={17} /> นักศึกษา
            </button>
            <button
              type="button"
              onClick={() => { setKind("staff"); setError(""); setMessage(""); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold ${kind === "staff" ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500"}`}
            >
              <ShieldCheck size={17} /> บุคลากร
            </button>
          </div>

          {kind === "student" ? (
            <form onSubmit={signInWithEmail} className="mt-6">
              <label htmlFor="email" className="block text-sm font-bold">อีเมล</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="student@example.ac.th"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500"
              />
              <button
                type="submit"
                disabled={!configured || loading !== null}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-900 px-4 py-3.5 text-sm font-black text-white hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "email" ? <LoaderCircle className="animate-spin" size={17} /> : <Mail size={17} />}
                ส่งลิงก์เข้าสู่ระบบทางอีเมล
              </button>
            </form>
          ) : (
            <div className="mt-6">
              <p className="text-sm leading-6 text-slate-600">
                บุคลากรเข้าสู่ระบบด้วย Google ที่ได้รับอนุญาต บทบาทแอดมินและผู้ตรวจสอบจะถูกกำหนดจากฐานข้อมูลโดยผู้ดูแลระบบ ไม่สามารถเลือกสิทธิ์เองได้
              </p>
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={!configured || loading !== null}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "google" ? <LoaderCircle className="animate-spin" size={17} /> : <span className="text-lg font-black">G</span>}
                เข้าสู่ระบบด้วย Google
              </button>
            </div>
          )}

          {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">{message}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-800">{error}</p>}

          {!configured && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
              <Info className="mb-1 inline" size={14} /> โค้ดระบบล็อกอินจริงถูกเตรียมไว้แล้ว แต่ยังไม่สามารถใช้งานได้จนกว่าจะสร้าง Supabase Project และตั้งค่า NEXT_PUBLIC_SUPABASE_URL กับ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ใน Vercel
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-cyan-50 p-4 text-xs leading-6 text-ocean-900">
            <b>ความเป็นส่วนตัว:</b> การเข้าสู่ระบบ Google ขอเฉพาะข้อมูลระบุตัวตนและอีเมล (openid, email, profile) ไม่ขอสิทธิ์อ่านกล่องจดหมาย Gmail ส่วนการยินยอมรับประกาศทางอีเมลจะแยกเป็นการตั้งค่าอีกขั้นหนึ่ง
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-slate-400">Science PR Portal · Supabase Auth</p>
      </div>
    </main>
  );
}
