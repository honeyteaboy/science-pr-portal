"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck, GraduationCap, Info, LoaderCircle, LockKeyhole, UserPlus } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type AccountKind = "student" | "staff";
type ScreenMode = "login" | "register";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [kind, setKind] = useState<AccountKind>("student");
  const [mode, setMode] = useState<ScreenMode>("login");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | "register" | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("role") === "staff") setKind("staff");
  }, []);

  const callbackUrl = (next: string) =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const signInWithPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    if (kind === "staff" && !configured) {
      setError("ระบบบัญชีผู้ดูแลยังไม่พร้อมใช้งาน กรุณาตั้งค่า Supabase ก่อน");
      return;
    }
    if (!configured) {
      setError("ระบบยังไม่ได้เชื่อม Supabase กรุณาตั้งค่าระบบก่อน");
      return;
    }
    if (!(kind === "staff" ? username.trim() : email.trim()) || !password) {
      setError("กรุณากรอกชื่อบัญชีและรหัสผ่านให้ครบ");
      return;
    }

    setLoading("email");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: kind === "staff" ? (username.trim().includes("@") ? username.trim().toLowerCase() : username.trim().toLowerCase() + "@admin.sciencepr.local") : email.trim().toLowerCase(),
        password,
      });
      if (authError) throw authError;

      // The destination is not an authorization check. /admin still verifies the DB role.
      window.location.assign(kind === "staff" ? "/admin" : "/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(null);
    }
  };

  const registerStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();
    if (!configured) {
      setError("ระบบยังไม่ได้เชื่อม Supabase กรุณาตั้งค่าระบบก่อน");
      return;
    }
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading("register");
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: callbackUrl("/profile"),
        },
      });
      if (authError) throw authError;

      if (data.session) {
        window.location.assign("/profile");
        return;
      }
      setMessage("สมัครบัญชีเรียบร้อยแล้ว กรุณาเปิดอีเมลเพื่อยืนยันบัญชี จากนั้นกลับมาเข้าสู่ระบบ");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถสมัครบัญชีได้");
    } finally {
      setLoading(null);
    }
  };

  const signInWithGoogle = async () => {
    clearFeedback();
    if (!configured) {
      setError("ระบบยังไม่ได้เชื่อม Supabase กรุณาตั้งค่าระบบก่อน");
      return;
    }

    setLoading("google");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl("/admin"),
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

  const switchKind = (next: AccountKind) => {
    setKind(next);
    setMode("login");
    clearFeedback();
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f9fb] px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
          <ArrowLeft size={16} /> กลับหน้าประกาศ
        </Link>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ocean-900 text-white">
            <ShieldCheck size={25} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs font-black tracking-[.2em] text-ocean-700">SCIENCE PR PORTAL</p>
            <h1 className="mt-2 text-2xl font-black">
              {mode === "register" ? "สมัครบัญชีนักศึกษา" : "เข้าสู่ระบบ"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              อ่านประกาศได้โดยไม่ต้องเข้าสู่ระบบ สมัครด้วยอีเมลเพื่อปรับหัวข้อและการแจ้งเตือน
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => switchKind("student")}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold ${kind === "student" ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500"}`}>
              <GraduationCap size={17} /> นักศึกษา
            </button>
            <button type="button" onClick={() => switchKind("staff")}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold ${kind === "staff" ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500"}`}>
              <ShieldCheck size={17} /> แอดมิน / บุคลากร
            </button>
          </div>

          {kind === "student" && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setMode("login"); clearFeedback(); }}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${mode === "login" ? "border-ocean-700 bg-cyan-50 text-ocean-800" : "border-slate-200 text-slate-500"}`}>
                เข้าสู่ระบบ
              </button>
              <button type="button" onClick={() => { setMode("register"); clearFeedback(); }}
                className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${mode === "register" ? "border-ocean-700 bg-cyan-50 text-ocean-800" : "border-slate-200 text-slate-500"}`}>
                สมัครสมาชิก
              </button>
            </div>
          )}

          {mode === "register" && kind === "student" ? (
            <form onSubmit={registerStudent} className="mt-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold">ชื่อที่ใช้แสดง</label>
                <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name" required placeholder="ชื่อ - นามสกุล"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold">อีเมล</label>
                <input id="email" type="email" autoComplete="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="student@example.ac.th"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-bold">ตั้งรหัสผ่าน</label>
                <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold">ยืนยันรหัสผ่าน</label>
                <input id="confirmPassword" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)} placeholder="กรอกรหัสผ่านอีกครั้ง"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500" />
              </div>
              <button type="submit" disabled={loading !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-900 px-4 py-3.5 text-sm font-black text-white hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-50">
                {loading === "register" ? <LoaderCircle className="animate-spin" size={17} /> : <UserPlus size={17} />}
                สมัครบัญชีด้วยอีเมล
              </button>
              <p className="text-xs leading-5 text-slate-500">บัญชีที่สมัครด้วยตนเองจะได้สิทธิ์นักศึกษาเท่านั้น ไม่สามารถสมัครเป็นแอดมินผ่านหน้านี้ได้</p>
            </form>
          ) : (
            <form onSubmit={signInWithPassword} className="mt-6 space-y-4">
              {kind === "staff" ? (
                <div>
                  <label htmlFor="username" className="block text-sm font-bold">ชื่อบัญชีผู้ดูแลหรืออีเมล</label>
                  <input id="username" autoComplete="username" required value={username}
                    onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อบัญชีแอดมิน"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500" />
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className="block text-sm font-bold">อีเมล</label>
                  <input id="email" type="email" autoComplete="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="student@example.ac.th"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500" />
                </div>
              )}
              <div>
                <label htmlFor="password" className="block text-sm font-bold">รหัสผ่าน</label>
                <input id="password" type="password" autoComplete="current-password" required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่านบัญชีของคุณ"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500" />
              </div>
              <button type="submit" disabled={loading !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-900 px-4 py-3.5 text-sm font-black text-white hover:bg-ocean-800 disabled:cursor-not-allowed disabled:opacity-50">
                {loading === "email" ? <LoaderCircle className="animate-spin" size={17} /> : <LockKeyhole size={17} />}
                {kind === "staff" ? "เข้าสู่ระบบหลังบ้าน" : "เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน"}
              </button>
              {kind === "staff" && configured && (
                <>
                  <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200"/><span>หรือ</span><span className="h-px flex-1 bg-slate-200"/></div>
                  <button type="button" onClick={signInWithGoogle} disabled={!configured || loading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-50">
                    {loading === "google" ? <LoaderCircle className="animate-spin" size={17} /> : <span className="text-lg font-black">G</span>}
                    เข้าสู่ระบบด้วย Google
                  </button>
                  <p className="text-xs leading-5 text-slate-500">บัญชีแอดมินที่สร้างจากหลังบ้านใช้ชื่อบัญชีและรหัสผ่าน ส่วนบุคลากรเดิมยังเข้าสู่ระบบด้วยอีเมลได้ ระบบตรวจ Role จากฐานข้อมูลทุกครั้ง</p>
                </>
              )}
            </form>
          )}

          {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">{message}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-800">{error}</p>}

          {!configured && !(kind === "staff" && mode === "login") && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
              <Info className="mb-1 inline" size={14} /> ต้องตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ใน Vercel ก่อนเปิดใช้ระบบบัญชี
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-cyan-50 p-4 text-xs leading-6 text-ocean-900">
            <b>ความเป็นส่วนตัว:</b> ระบบใช้เฉพาะอีเมลสำหรับยืนยันบัญชีและส่งประกาศเมื่อคุณยินยอม ไม่อ่านกล่องจดหมาย Gmail และไม่ขอสิทธิ์เข้าถึงอีเมลอื่น
          </div>
        </section>
        <p className="mt-5 text-center text-xs text-slate-400">Science PR Portal · {kind === "staff" && !configured ? "Demo Admin Login" : "Supabase Auth"}</p>
      </div>
    </main>
  );
}
