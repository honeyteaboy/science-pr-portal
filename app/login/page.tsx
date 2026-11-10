"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap, ShieldCheck, LockKeyhole, Info, UserRound, ClipboardCheck } from "lucide-react";
import { authenticateAdmin } from "@/lib/admin-auth";

export default function LoginPage() {
  const router = useRouter();
  const [kind, setKind] = useState<"student" | "admin">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const submit = () => {
    setMessage("");
    if (!username.trim() || !password.trim()) {
      setMessage("กรุณากรอกชื่อบัญชีและรหัสผ่าน");
      return;
    }

    if (kind === "admin") {
      const session = authenticateAdmin(username, password);
      if (!session) {
        setMessage("ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }
      router.replace("/admin");
      return;
    }

    if (!/^u\d{13}$/.test(username)) {
      setMessage("รูปแบบบัญชีนักศึกษาตัวอย่างควรเป็น u ตามด้วยตัวเลข 13 หลัก");
      return;
    }
    setMessage("ระบบบัญชีนักศึกษายังเป็นต้นแบบและยังไม่ได้เชื่อมฐานข้อมูล กรุณาทดลองเฉพาะบัญชีแอดมินที่แสดงในหน้าต้นแบบ");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f9fb] px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
          <ArrowLeft size={16} /> กลับหน้าหลัก
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ocean-900 text-white">
            <LockKeyhole size={25} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs font-black tracking-[.2em] text-ocean-700">SCIENCE PR PORTAL</p>
            <h1 className="mt-2 text-2xl font-black">เข้าสู่ระบบ</h1>
            <p className="mt-2 text-sm text-slate-500">แยกบัญชีผู้โพสต์และผู้ตรวจสอบตามหน้าที่</p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setKind("student"); setMessage(""); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold ${kind === "student" ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500"}`}
            >
              <GraduationCap size={17} /> นักศึกษา
            </button>
            <button
              type="button"
              onClick={() => { setKind("admin"); setMessage(""); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold ${kind === "admin" ? "bg-white text-ocean-800 shadow-sm" : "text-slate-500"}`}
            >
              <ShieldCheck size={17} /> บุคลากร / แอดมิน
            </button>
          </div>

          <form
            className="mt-6"
            onSubmit={(event) => { event.preventDefault(); submit(); }}
          >
            <label className="block text-sm font-bold" htmlFor="username">ชื่อบัญชี</label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={kind === "student" ? "u ตามด้วยเลข 13 หลัก" : "กรอกชื่อบัญชี"}
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500"
            />

            <label className="mt-4 block text-sm font-bold" htmlFor="password">รหัสผ่าน</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="กรอกรหัสผ่าน"
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-ocean-500"
            />

            <button type="submit" className="mt-6 w-full rounded-xl bg-ocean-900 px-4 py-3.5 text-sm font-black text-white hover:bg-ocean-800">
              เข้าสู่ระบบ
            </button>
          </form>

          {message && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-800">{message}</p>}

          {kind === "admin" ? (
            <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
              <div className="flex items-center gap-2 font-black text-ocean-900">
                <ClipboardCheck size={17} /> บัญชีทดลองแยกตามตำแหน่ง
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">ผู้ดูแลระบบสูงสุด</p>
                  <p className="mt-1 text-sm font-black">admin</p>
                  <p className="text-xs text-slate-500">admin123</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">เลขาหลักสูตร / ผู้โพสต์</p>
                  <p className="mt-1 text-sm font-black">secretary</p>
                  <p className="text-xs text-slate-500">secretary123</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">ผู้ตรวจสอบ / ผู้อนุมัติ</p>
                  <p className="mt-1 text-sm font-black">reviewer</p>
                  <p className="text-xs text-slate-500">reviewer123</p>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-800">
                <Info size={15} className="mt-0.5 shrink-0" />
                บัญชีเหล่านี้ใช้ทดสอบต้นแบบเท่านั้น รหัสผ่านยังเก็บในเบราว์เซอร์ ไม่ใช่ระบบยืนยันตัวตนที่ปลอดภัยสำหรับใช้งานจริง
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">
              <Info className="mb-1 inline" size={14} /> บัญชีนักศึกษายังไม่เชื่อมกับฐานข้อมูลจริง กรุณาอย่าใช้รหัสนักศึกษาหรือรหัสผ่านจริงในต้นแบบนี้
            </div>
          )}

          <Link href="/admin" className="mt-5 block text-center text-sm font-bold text-ocean-700">
            ไปยังศูนย์จัดการ (ต้องเข้าสู่ระบบก่อน)
          </Link>
        </div>
        <p className="mt-5 text-center text-xs text-slate-400">Science PR Portal · Prototype authentication screen</p>
      </div>
    </main>
  );
}
