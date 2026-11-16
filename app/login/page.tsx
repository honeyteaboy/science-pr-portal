"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Info,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
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
        email:
          kind === "staff"
            ? username.trim().includes("@")
              ? username.trim().toLowerCase()
              : username.trim().toLowerCase() + "@admin.sciencepr.local"
            : email.trim().toLowerCase(),
        password,
      });
      if (authError) throw authError;

      // This redirect is navigation only. Protected pages verify the role server-side.
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
    <main className="min-h-screen bg-[#f3f7fa] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <Link
          href="/"
          className="mb-5 inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900"
        >
          <ArrowLeft size={16} /> กลับหน้าประกาศ
        </Link>

        <section className="grid flex-1 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-36px_rgba(15,45,65,0.28)] lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#102c43] p-7 text-white sm:p-10 lg:min-h-[720px] lg:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-cyan-200/10" />
            <div className="pointer-events-none absolute -right-8 top-20 h-56 w-56 rounded-full border border-cyan-200/10" />
            <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-cyan-200">
                  <span className="text-xl font-black">S</span>
                </div>
                <div>
                  <p className="text-sm font-black tracking-[0.16em]">SCIENCE PR</p>
                  <p className="text-xs text-slate-300">PORTAL · FACULTY OF SCIENCE</p>
                </div>
              </div>

              <div className="mt-12 max-w-lg lg:mt-20">
                <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] text-cyan-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  OFFICIAL INFORMATION HUB
                </p>
                <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  ทุกข่าวสารสำคัญ
                  <span className="mt-1 block text-cyan-200">เชื่อมต่อถึงคุณ</span>
                </h1>
                <p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                  ศูนย์รวมประกาศ ข่าวประชาสัมพันธ์ และกำหนดการของคณะวิทยาศาสตร์
                  เข้าถึงข้อมูลที่เกี่ยวข้องกับคุณได้ในที่เดียว
                </p>
              </div>
            </div>

            <div className="relative mt-10 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <Bell className="mb-5 text-cyan-200" size={20} />
                <p className="text-sm font-bold">ข่าวสารและประกาศ</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">ติดตามข้อมูลจากคณะและหน่วยงาน</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <CalendarDays className="mb-5 text-cyan-200" size={20} />
                <p className="text-sm font-bold">ปฏิทินกิจกรรม</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">ตรวจสอบวันสำคัญและกำหนดการ</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur sm:col-span-2">
                <div className="flex items-center gap-3">
                  <Users className="text-cyan-200" size={21} />
                  <div>
                    <p className="text-sm font-bold">พื้นที่สำหรับนักศึกษาและบุคลากร</p>
                    <p className="mt-1 text-xs text-slate-400">จัดการบัญชีและการแจ้งเตือนตามสิทธิ์ผู้ใช้งาน</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="relative mt-8 border-t border-white/10 pt-5 text-[11px] text-slate-400">
              SCIENCE PR PORTAL · ระบบประชาสัมพันธ์คณะวิทยาศาสตร์
            </p>
          </aside>

          <div className="flex items-center justify-center p-5 sm:p-9 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-7">
                <p className="text-xs font-black tracking-[0.2em] text-cyan-800">WELCOME BACK</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  {mode === "register" ? "สร้างบัญชีนักศึกษา" : "เข้าสู่ระบบ"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {kind === "student"
                    ? "เข้าสู่ระบบเพื่อจัดการโปรไฟล์และรับข่าวสารที่สนใจ"
                    : "พื้นที่เข้าสู่ระบบสำหรับผู้ดูแลและบุคลากร"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() => switchKind("student")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${kind === "student" ? "bg-white text-[#123b56] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <GraduationCap size={17} /> นักศึกษา
                </button>
                <button
                  type="button"
                  onClick={() => switchKind("staff")}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${kind === "staff" ? "bg-white text-[#123b56] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <ShieldCheck size={17} /> แอดมิน / บุคลากร
                </button>
              </div>

              {kind === "student" && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode("login"); clearFeedback(); }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${mode === "login" ? "border-cyan-800 bg-cyan-50 text-cyan-900" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    เข้าสู่ระบบ
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("register"); clearFeedback(); }}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition ${mode === "register" ? "border-cyan-800 bg-cyan-50 text-cyan-900" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    สมัครสมาชิก
                  </button>
                </div>
              )}

              {mode === "register" && kind === "student" ? (
                <form onSubmit={registerStudent} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-bold text-slate-700">ชื่อที่ใช้แสดง</label>
                    <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      autoComplete="name" required placeholder="ชื่อ - นามสกุล"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-slate-700">อีเมล</label>
                    <div className="relative mt-2">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input id="email" type="email" autoComplete="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)} placeholder="student@example.ac.th"
                        className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-bold text-slate-700">ตั้งรหัสผ่าน</label>
                    <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700">ยืนยันรหัสผ่าน</label>
                    <input id="confirmPassword" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} placeholder="กรอกรหัสผ่านอีกครั้ง"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
                  </div>
                  {mode === "login" && (
                <button
                  type="button"
                  onClick={async () => {
                    clearFeedback();
                    const recoveryEmail = kind === "staff" ? username.trim() : email.trim();
                    if (!recoveryEmail) {
                      setError("กรุณากรอกอีเมลบัญชีที่ต้องการรีเซ็ตรหัสผ่านก่อน");
                      return;
                    }
                    const normalizedEmail = recoveryEmail.includes("@")
                      ? recoveryEmail.toLowerCase()
                      : recoveryEmail.toLowerCase() + "@admin.sciencepr.local";
                    setLoading("email");
                    try {
                      const supabase = createClient();
                      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
                        redirectTo: callbackUrl("/reset-password"),
                      });
                      if (resetError) throw resetError;
                      setMessage("หากอีเมลนี้มีบัญชีอยู่ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้ กรุณาตรวจสอบกล่องจดหมายและ Spam");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้");
                    } finally {
                      setLoading(null);
                    }
                  }}
                  disabled={loading !== null}
                  className="w-full text-right text-sm font-semibold text-cyan-800 underline underline-offset-4 disabled:opacity-50"
                >
                  ลืมรหัสผ่าน? ส่งลิงก์รีเซ็ตทางอีเมล
                </button>
              )}
              <button type="submit" disabled={loading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123b56] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#0b2d43] disabled:cursor-not-allowed disabled:opacity-50">
                    {loading === "register" ? <LoaderCircle className="animate-spin" size={17} /> : <UserPlus size={17} />}
                    สมัครบัญชีด้วยอีเมล
                  </button>
                  <p className="text-xs leading-5 text-slate-500">บัญชีที่สมัครด้วยตนเองจะได้รับสิทธิ์นักศึกษาเท่านั้น ไม่สามารถสมัครเป็นผู้ดูแลระบบผ่านหน้านี้ได้</p>
                </form>
              ) : (
                <form onSubmit={signInWithPassword} className="mt-6 space-y-4">
                  {kind === "staff" ? (
                    <div>
                      <label htmlFor="username" className="block text-sm font-bold text-slate-700">ชื่อบัญชีผู้ดูแลหรืออีเมล</label>
                      <input id="username" autoComplete="username" required value={username}
                        onChange={(e) => setUsername(e.target.value)} placeholder="ชื่อบัญชีแอดมิน"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-slate-700">อีเมล</label>
                      <div className="relative mt-2">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input id="email" type="email" autoComplete="email" required value={email}
                          onChange={(e) => setEmail(e.target.value)} placeholder="student@example.ac.th"
                          className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label htmlFor="password" className="block text-sm font-bold text-slate-700">รหัสผ่าน</label>
                    <div className="relative mt-2">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                      <input id="password" type="password" autoComplete="current-password" required value={password}
                        onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่านบัญชีของคุณ"
                        className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123b56] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#0b2d43] disabled:cursor-not-allowed disabled:opacity-50">
                    {loading === "email" ? <LoaderCircle className="animate-spin" size={17} /> : <LockKeyhole size={17} />}
                    {kind === "staff" ? "เข้าสู่ระบบหลังบ้าน" : "เข้าสู่ระบบด้วยอีเมล"}
                  </button>

                  {kind === "staff" && configured && (
                    <>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="h-px flex-1 bg-slate-200" /><span>หรือ</span><span className="h-px flex-1 bg-slate-200" />
                      </div>
                      <button type="button" onClick={signInWithGoogle} disabled={loading !== null}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                        {loading === "google" ? <LoaderCircle className="animate-spin" size={17} /> : <span className="text-lg font-black text-blue-600">G</span>}
                        เข้าสู่ระบบด้วย Google
                      </button>
                      <p className="text-xs leading-5 text-slate-500">ระบบจะตรวจสอบสิทธิ์ผู้ดูแลจากข้อมูลบัญชีในฐานข้อมูล ไม่สามารถกำหนดสิทธิ์ Admin จากหน้าล็อกอินได้</p>
                    </>
                  )}
                </form>
              )}

              {message && <p role="status" className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800"><CheckCircle2 className="mt-1 shrink-0" size={16} />{message}</p>}
              {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-800">{error}</p>}

              {!configured && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
                  <Info className="mb-1 inline" size={14} /> ต้องตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ใน Vercel ก่อนเปิดใช้ระบบบัญชีจริง
                </div>
              )}

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-center text-xs leading-5 text-slate-400">
                  การเข้าสู่ระบบจะใช้ระบบยืนยันตัวตนของ Science PR Portal เท่านั้น
                  <br />ไม่สามารถข้ามการตรวจสอบสิทธิ์เพื่อเข้าหน้าผู้ดูแลได้
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
