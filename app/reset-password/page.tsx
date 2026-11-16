"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setError("ระบบยังไม่ได้เชื่อมต่อ Supabase");
      return;
    }
    const supabase = createClient();
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError || !data.session) {
        setError("ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่");
      } else {
        setReady(true);
      }
    });
    return () => { active = false; };
  }, [configured]);

  const updatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut();
      setPassword("");
      setConfirmPassword("");
      setReady(false);
      setMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณากลับไปเข้าสู่ระบบด้วยรหัสผ่านใหม่");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาขอลิงก์ใหม่");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f9fb] px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black tracking-[.2em] text-cyan-800">SCIENCE PR PORTAL</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900">ตั้งรหัสผ่านใหม่</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ</p>

        {ready && !message && (
          <form onSubmit={updatePassword} className="mt-6 space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-bold text-slate-700">รหัสผ่านใหม่</label>
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-bold text-slate-700">ยืนยันรหัสผ่านใหม่</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-700" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-[#123b56] px-4 py-3.5 text-sm font-black text-white disabled:opacity-50">
              {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </button>
          </form>
        )}

        {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-800">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">{message}</p>}

        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-cyan-800 underline underline-offset-4">
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </section>
    </main>
  );
}
