"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check, LoaderCircle, Mail, ShieldCheck, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Topic = { id: string; slug: string; name: string };
type Membership = { cohort?: { code: string; label: string } | null; verified_at: string };
type PreferencesPayload = {
  profile?: { email?: string; full_name?: string; role?: string };
  preferences?: { topic_ids?: string[]; email_enabled?: boolean; important_email_enabled?: boolean };
  memberships?: Membership[];
  topics?: Topic[];
  emailConsent?: boolean;
};

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [emailConsent, setEmailConsent] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [importantEmailEnabled, setImportantEmailEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/student/preferences", { cache: "no-store" });
      const payload = (await response.json()) as PreferencesPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error || "กรุณาเข้าสู่ระบบนักศึกษาก่อน");
      if (payload.profile?.role !== "student") throw new Error("หน้านี้สำหรับบัญชีนักศึกษาเท่านั้น");
      setEmail(payload.profile.email || "");
      setName(payload.profile.full_name || "");
      setTopics(payload.topics || []);
      setSelectedTopics(payload.preferences?.topic_ids || []);
      setEmailEnabled(Boolean(payload.preferences?.email_enabled));
      setImportantEmailEnabled(payload.preferences?.important_email_enabled !== false);
      setMemberships(payload.memberships || []);
      setEmailConsent(Boolean(payload.emailConsent));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleTopic = (id: string) => {
    setSelectedTopics((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/student/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIds: selectedTopics,
          emailEnabled,
          importantEmailEnabled,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "บันทึกการตั้งค่าไม่สำเร็จ");
      setMessage("บันทึกการตั้งค่าการรับข่าวแล้ว");
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกการตั้งค่าไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const updateConsent = async (consented: boolean) => {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/student/email-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consented }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "บันทึกความยินยอมไม่สำเร็จ");
      if (!consented) setEmailEnabled(false);
      setEmailConsent(consented);
      setMessage(consented ? "บันทึกความยินยอมรับอีเมลแล้ว" : "ถอนความยินยอมแล้ว และปิดการส่งอีเมล");
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกความยินยอมไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#f5fafc] px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
            <ArrowLeft size={17} /> กลับหน้าหลัก
          </Link>
          {!loading && !error && (
            <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">
              <LogOut size={16} /> ออกจากระบบ
            </button>
          )}
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-ocean-700">STUDENT ACCOUNT</p>
          <h1 className="mt-2 text-3xl font-black">โปรไฟล์และการรับข่าวสาร</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">จัดการหัวข้อประกาศที่สนใจ และเลือกว่าจะรับอีเมลจากหลักสูตรหรือไม่</p>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/> กำลังโหลดข้อมูลนักศึกษา...</div>
          ) : error ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
              {error}
              <Link href="/login" className="mt-3 block font-bold underline">ไปหน้าเข้าสู่ระบบ</Link>
            </div>
          ) : (
            <>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">บัญชีอีเมล</p>
                  <p className="mt-1 break-all font-semibold">{email}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400">ชื่อที่แสดง</p>
                  <p className="mt-1 font-semibold">{name || "ยังไม่ได้ระบุชื่อ"}</p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                <div className="flex items-center gap-2 font-black text-ocean-900"><ShieldCheck size={18}/> รุ่นที่หลักสูตรยืนยันแล้ว</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {memberships.length ? memberships.map((membership) => (
                    <span key={membership.cohort?.code || membership.verified_at} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-ocean-900">
                      {membership.cohort?.label || membership.cohort?.code || "รุ่นที่ยืนยันแล้ว"}
                    </span>
                  )) : <p className="text-sm text-slate-600">ยังไม่มีข้อมูลรุ่นที่ได้รับการยืนยัน กรุณาติดต่อหลักสูตรเพื่อตรวจสอบรุ่นก่อนรับข่าวเฉพาะกลุ่ม</p>}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center gap-2"><Bell className="text-ocean-700" size={19}/><h2 className="text-lg font-black">หัวข้อประกาศที่สนใจ</h2></div>
                <p className="mt-1 text-sm text-slate-500">ฟีดข่าวและการส่งอีเมลจะพิจารณาจากหัวข้อที่เลือกประกอบกับรุ่นที่ได้รับการยืนยัน</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {topics.map((topic) => (
                    <label key={topic.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-cyan-300">
                      <input type="checkbox" checked={selectedTopics.includes(topic.id)} onChange={() => toggleTopic(topic.id)} className="h-4 w-4 accent-cyan-700"/>
                      <span className="text-sm font-semibold">{topic.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center gap-2"><Mail className="text-ocean-700" size={19}/><h2 className="text-lg font-black">การแจ้งเตือนทางอีเมล</h2></div>
                <p className="mt-2 text-sm leading-6 text-slate-600">อนุญาตให้หลักสูตรส่งประกาศสำคัญมายังอีเมลบัญชีนี้เท่านั้น ระบบไม่อ่านกล่องจดหมาย ไม่ขอสิทธิ์ Gmail และไม่ส่งอีเมลแทนคุณ</p>
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold">สถานะความยินยอม: {emailConsent ? "ยินยอมแล้ว" : "ยังไม่ยินยอม"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!emailConsent ? (
                      <button disabled={saving} onClick={() => updateConsent(true)} className="rounded-xl bg-ocean-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">ยินยอมรับประกาศทางอีเมล</button>
                    ) : (
                      <button disabled={saving} onClick={() => updateConsent(false)} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-700 disabled:opacity-50">ถอนความยินยอม</button>
                    )}
                  </div>
                </div>
                <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <span className="text-sm font-semibold">เปิดรับอีเมลประกาศ</span>
                  <input type="checkbox" checked={emailEnabled} disabled={!emailConsent} onChange={(event) => setEmailEnabled(event.target.checked)} className="h-4 w-4 accent-cyan-700"/>
                </label>
                <label className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <span className="text-sm font-semibold">รับอีเมลประกาศสำคัญ/ข่าวด่วน</span>
                  <input type="checkbox" checked={importantEmailEnabled} disabled={!emailConsent || !emailEnabled} onChange={(event) => setImportantEmailEnabled(event.target.checked)} className="h-4 w-4 accent-cyan-700"/>
                </label>
                <p className="mt-2 text-xs leading-5 text-slate-500">สามารถถอนความยินยอมได้ทุกเมื่อ การถอนจะปิดการส่งอีเมลในระบบ</p>
              </div>

              {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
              {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
              <button disabled={saving} onClick={savePreferences} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-700 px-5 py-3.5 font-bold text-white hover:bg-ocean-800 disabled:opacity-50">
                {saving ? <LoaderCircle className="animate-spin" size={17}/> : <Check size={17}/>} บันทึกการตั้งค่า
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
