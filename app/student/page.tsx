"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CalendarDays, ExternalLink, Filter, LoaderCircle, Settings2, AlertTriangle } from "lucide-react";

type FeedItem = {
  id: string;
  title: string;
  body: string;
  is_urgent: boolean;
  published_at: string | null;
  deadline_at: string | null;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  topic?: { id: string; slug: string; name: string } | null;
  targets?: Array<{ cohort?: { id: string; code: string; label: string } | null }>;
  links?: Array<{ id: string; label: string; url: string; sort_order: number }>;
};

export default function StudentFeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifiedCohortCount, setVerifiedCohortCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/student/feed", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "ไม่สามารถโหลดประกาศได้");
        if (!active) return;
        setItems(payload.data || []);
        setVerifiedCohortCount(payload.verifiedCohortCount || 0);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "ไม่สามารถโหลดประกาศได้");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#f5fafc] px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={17}/> กลับหน้าหลัก</Link>
          <Link href="/profile" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"><Settings2 size={16}/> ตั้งค่าการรับข่าว</Link>
        </div>
        <header className="mt-7">
          <p className="text-xs font-black tracking-[.2em] text-ocean-700">STUDENT ANNOUNCEMENTS</p>
          <h1 className="mt-2 text-3xl font-black">ประกาศสำหรับคุณ</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">แสดงข่าวที่ตรงกับรุ่นที่หลักสูตรยืนยันและหัวข้อที่คุณสนใจ</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-ocean-800"><Filter size={14}/> ยืนยันรุ่นแล้ว {verifiedCohortCount} รุ่น</div>
        </header>

        {loading ? (
          <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/> กำลังโหลดประกาศ...</div>
        ) : error ? (
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">{error}<Link href="/login" className="mt-2 block font-bold underline">เข้าสู่ระบบนักศึกษา</Link></div>
        ) : items.length === 0 ? (
          <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <Bell className="mx-auto text-slate-300" size={34}/>
            <h2 className="mt-3 text-lg font-black">ยังไม่มีประกาศที่ตรงกับคุณ</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {verifiedCohortCount === 0
                ? "ระบบยังไม่มีรุ่นที่หลักสูตรยืนยันให้บัญชีนี้ กรุณาติดต่อหลักสูตรเพื่อตรวจสอบข้อมูลรุ่น"
                : "เมื่อมีประกาศที่ตรงกับรุ่นและหัวข้อที่ติดตาม ระบบจะแสดงที่หน้านี้"}
            </p>
            <Link href="/profile" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-4 py-2.5 text-sm font-bold text-white">ตั้งค่าหัวข้อที่สนใจ</Link>
          </div>
        ) : (
          <div className="mt-7 space-y-4">
            {items.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {item.is_urgent && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700"><AlertTriangle size={13}/> ข่าวด่วน</span>}
                  {item.topic?.name && <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-ocean-800">{item.topic.name}</span>}
                  <span className="text-xs text-slate-400">{item.published_at ? new Date(item.published_at).toLocaleString("th-TH") : ""}</span>
                </div>
                <h2 className="mt-3 text-xl font-black leading-8">{item.title}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.body}</p>
                {item.event_date && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays size={14}/> {new Date(item.event_date+"T00:00:00").toLocaleDateString("th-TH")}</span>{item.event_time && <span>เวลา {item.event_time}</span>}{item.event_location && <span>สถานที่ {item.event_location}</span>}</div>}
                {item.deadline_at && <p className="mt-2 text-xs font-bold text-rose-700">กำหนดส่ง: {new Date(item.deadline_at).toLocaleString("th-TH")}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(item.targets || []).map((target, index) => target.cohort && <span key={target.cohort.id || index} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{target.cohort.label}</span>)}
                </div>
                {(item.links || []).length > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><p className="mb-2 text-xs font-black text-slate-500">ลิงก์และเอกสารที่เกี่ยวข้อง</p><div className="flex flex-col gap-2">{(item.links || []).sort((a,b)=>a.sort_order-b.sort_order).map((link)=><a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-ocean-700 hover:underline">{link.label}<ExternalLink size={14}/></a>)}</div></div>}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
