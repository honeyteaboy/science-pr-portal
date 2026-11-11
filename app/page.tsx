"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Eye, Search, ShieldCheck, TrendingUp, Users, UserCircle, Instagram, Facebook, Youtube } from "lucide-react";

type Notice = { id: string | number; title: string; category: string; department: string; date: string; eventDate?: string; views: number; pinned?: boolean; tone: string; excerpt: string; targetCohorts?:string[]; urgency?:"normal"|"urgent"; actionLine?:string; reminderDays?:number[]; eventTime?:string; eventLocation?:string; eventLink?:string };
type StoredNotice = {id:string|number;title:string;category:string;department:string;body:string;status:"published"|"draft"|"pending";pinned:boolean;date:string;eventDate:string;views:number;targetCohorts?:string[];urgency?:"normal"|"urgent";actionLine?:string;reminderDays?:number[];eventTime?:string;eventLocation?:string;eventLink?:string};
const seedNotices: Notice[] = [
  { id: 1, title: "เปิดรับสมัครทุนการศึกษาสำหรับนักศึกษาคณะวิทยาศาสตร์", category: "ทุนการศึกษา", department: "ประชาสัมพันธ์กลาง", date: "2026-11-10", views: 1284, pinned: true, tone: "blue", excerpt: "แจ้งกำหนดการและรายละเอียดการยื่นขอรับทุนการศึกษาประจำปีการศึกษา" },
  { id: 2, title: "กำหนดการลงทะเบียนและเพิ่ม-ถอนรายวิชา", category: "การเรียน", department: "งานบริการการศึกษา", date: "2026-11-09", eventDate: "2026-11-20", views: 986, tone: "mint", excerpt: "ตรวจสอบช่วงเวลาลงทะเบียน เงื่อนไข และกำหนดการสำคัญของภาคการศึกษา" },
  { id: 3, title: "กิจกรรม Science Open House ประจำปี", category: "กิจกรรม", department: "สโมสรนักศึกษา", date: "2026-11-08", eventDate: "2026-12-05", views: 742, tone: "gold", excerpt: "ชวนนักศึกษาและผู้สนใจร่วมกิจกรรมเปิดบ้านวิทยาศาสตร์" },
  { id: 4, title: "ประกาศแนวปฏิบัติการใช้ห้องปฏิบัติการ", category: "ประกาศ", department: "สำนักงานคณะ", date: "2026-11-07", views: 531, tone: "violet", excerpt: "แนวทางการเข้าใช้พื้นที่และข้อควรปฏิบัติเพื่อความปลอดภัย" }
];
const categories = ["ทั้งหมด", "ประกาศทั่วไป", "ประกาศ", "การเรียน", "ทุนการศึกษา", "กยศ.", "การยื่นเรื่องจบ", "กิจกรรม"];
const weekdays = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
const dateKey = (date: Date) => [date.getFullYear(), String(date.getMonth()+1).padStart(2,"0"), String(date.getDate()).padStart(2,"0")].join("-");
const prettyDate = (value: string) => new Date(value+"T00:00:00").toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"});
const daysUntil = (value:string) => Math.ceil((new Date(value+"T00:00:00").getTime()-new Date(new Date().toDateString()).getTime())/86400000);

export default function HomePage() {
  const [notices, setNotices] = useState<Notice[]>(seedNotices);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(),new Date().getMonth(),1));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [targetCohort, setTargetCohort] = useState("all");

  useEffect(() => {
    let active = true;
    const mapDatabaseNotice = (row: any): Notice => {
      const publishedDate = row.published_at || row.created_at;
      const date = publishedDate ? new Date(publishedDate).toISOString().slice(0, 10) : dateKey(new Date());
      const cohorts = (row.targets || [])
        .map((target: any) => target.cohort?.code)
        .filter((code: unknown): code is string => typeof code === "string");
      const links = row.links || [];
      return {
        id: row.id,
        title: row.title,
        category: row.topic?.name || "ประกาศ",
        department: row.department || "ประชาสัมพันธ์กลาง",
        date,
        eventDate: row.event_date || "",
        views: Number(row.view_count || 0),
        pinned: Boolean(row.pinned),
        tone: "blue",
        excerpt: row.action_line || row.body || "",
        targetCohorts: cohorts.length ? cohorts : [],
        urgency: row.is_urgent ? "urgent" : "normal",
        actionLine: row.action_line || "",
        reminderDays: row.reminder_days || [],
        eventTime: row.event_time || "",
        eventLocation: row.event_location || "",
        eventLink: links[0]?.url || "",
      };
    };

    const syncAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements", { cache: "no-store" });
        if (!response.ok) throw new Error("Database is not ready");
        const payload = await response.json();
        if (active && Array.isArray(payload.data)) {
          const published = payload.data
            .filter((item: any) => item.status === "published")
            .map(mapDatabaseNotice);
          setNotices(published);
          return;
        }
      } catch {
        // Keep the existing demo data visible until Supabase is configured and migrated.
      }

      try {
        const raw = localStorage.getItem("science-admin-announcements");
        if (!raw) return;
        const saved = JSON.parse(raw) as StoredNotice[];
        const mapped = saved.filter(a => a.status === "published").map((a): Notice => ({
          id: a.id, title: a.title, category: a.category, department: a.department, date: a.date,
          eventDate: a.eventDate || "", views: a.views || 0, pinned: a.pinned, tone: "blue",
          excerpt: a.body || "", targetCohorts: a.targetCohorts || ["all"], urgency: a.urgency || "normal",
          actionLine: a.actionLine || "", reminderDays: a.reminderDays || [], eventTime: a.eventTime || "",
          eventLocation: a.eventLocation || "", eventLink: a.eventLink || ""
        }));
        if (active) setNotices(mapped);
      } catch {
        // Keep the starter notices if both database and local demo storage are unavailable.
      }
    };

    void syncAnnouncements();
    window.addEventListener("focus", syncAnnouncements);
    window.addEventListener("storage", syncAnnouncements);
    return () => {
      active = false;
      window.removeEventListener("storage", syncAnnouncements);
      window.removeEventListener("focus", syncAnnouncements);
    };
  }, []);

  const filtered = useMemo(() => notices.filter(n => (category === "ทั้งหมด" || n.category === category) && (n.title + n.excerpt + n.department).toLowerCase().includes(query.toLowerCase())), [notices,query,category]);
  const ranked = [...notices].sort((a,b) => b.views-a.views);
  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(),month.getMonth(),1);
    const offset = (first.getDay()+6)%7;
    const count = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
    return Array.from({length:Math.ceil((offset+count)/7)*7},(_,i)=>i-offset+1);
  },[month]);
  const calendarNotices = notices.filter(n=>targetCohort==="all"||!n.targetCohorts||n.targetCohorts.includes("all")||n.targetCohorts.includes(targetCohort));
  const eventDates = new Set(calendarNotices.filter(n=>n.eventDate).map(n=>n.eventDate as string));
  const selectedEvents = calendarNotices.filter(n=>n.eventDate===selectedDate);
  const upcomingReminders = calendarNotices.filter(n=>n.eventDate && (n.reminderDays||[]).includes(daysUntil(n.eventDate)) && daysUntil(n.eventDate)>=0);
  const changeMonth = (amount:number) => setMonth(m=>new Date(m.getFullYear(),m.getMonth()+amount,1));

  return <main className="min-h-screen bg-[#f5fafc] text-slate-800">
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-600 text-white"><span className="text-lg font-black">S</span></div><div><p className="font-bold tracking-tight">SCIENCE <span className="text-ocean-600">PR PORTAL</span></p><p className="text-xs text-slate-500">ระบบประชาสัมพันธ์คณะวิทยาศาสตร์</p></div></div>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex"><a href="#news" className="hover:text-ocean-600">ข่าวประชาสัมพันธ์</a><a href="#calendar" className="hover:text-ocean-600">ปฏิทินกิจกรรม</a><a href="#popular" className="hover:text-ocean-600">ยอดนิยม</a></nav>
        <div className="flex items-center gap-2"><a href="/login" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-ocean-400">เข้าสู่ระบบ</a><a href="/student" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-ocean-400"><Users size={16}/> ฟีดนักศึกษา</a><a href="/profile" className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-ocean-400 sm:inline-flex"><UserCircle size={17}/> โปรไฟล์</a><a href="/admin" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600"><ShieldCheck size={16}/> แอดมิน</a></div>
      </div>
    </header>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0c6078] via-[#087f9d] to-[#16a3b8] text-white">
      <div className="absolute -right-20 -top-32 h-96 w-96 rounded-full border border-white/15"/><div className="absolute right-28 top-20 h-64 w-64 rounded-full border border-white/15"/>
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.2fr_.8fr] md:items-center md:py-24">
        <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-medium"><span className="h-2 w-2 rounded-full bg-emerald-300"/> SCIENCE FACULTY · OFFICIAL UPDATES</div><h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-6xl">ทุกข่าวสารสำคัญ<br/><span className="text-cyan-200">ของชาววิทยาศาสตร์</span></h1><p className="mt-5 max-w-xl text-base leading-8 text-cyan-50/90">ติดตามประกาศ กิจกรรม และกำหนดการต่าง ๆ จากคณะวิทยาศาสตร์ได้ในที่เดียว</p><a href="#news" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-ocean-900 shadow-lg transition hover:-translate-y-0.5">ดูข่าวประชาสัมพันธ์ <ChevronRight size={18}/></a></div>
        <div className="grid grid-cols-2 gap-3"><div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur"><Bell className="mb-8 text-cyan-200"/><p className="text-3xl font-black">ข่าวสาร</p><p className="mt-1 text-sm text-cyan-50/80">อัปเดตจากทุกสาขา</p></div><div className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur"><CalendarDays className="mb-8 text-cyan-200"/><p className="text-3xl font-black">กิจกรรม</p><p className="mt-1 text-sm text-cyan-50/80">ไม่พลาดทุกกำหนดการ</p></div><div className="col-span-2 rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur"><div className="flex items-center justify-between"><div><p className="text-sm text-cyan-50/80">ศูนย์รวมข้อมูลข่าวสาร</p><p className="mt-1 text-xl font-bold">Science Communication Hub</p></div><TrendingUp size={34} className="text-cyan-200"/></div></div></div>
      </div>
    </section>
    <section className="mx-auto grid max-w-7xl gap-4 px-5 py-7 sm:grid-cols-3"><Stat icon={<Eye size={19}/>} label="ยอดเข้าชมข่าวทั้งหมด" value={notices.reduce((sum,n)=>sum+n.views,0).toLocaleString("th-TH")}/><Stat icon={<Users size={19}/>} label="หน่วยงานที่ร่วมประชาสัมพันธ์" value="หลายสาขา"/><Stat icon={<TrendingUp size={19}/>} label="ข่าวยอดนิยม" value={ranked[0]?.title.length>22?ranked[0].title.slice(0,22)+"…":ranked[0]?.title||"-"}/></section>

    <section id="calendar" className="mx-auto max-w-7xl scroll-mt-6 px-5 pb-10">
      <div className="mb-5"><p className="text-sm font-bold uppercase tracking-[.2em] text-ocean-600">Events calendar</p><h2 className="mt-2 text-3xl font-black tracking-tight">ปฏิทินประกาศและกิจกรรม</h2><p className="mt-2 text-sm text-slate-500">วันที่มีประกาศกำหนดกิจกรรมจะแสดงจุดสีฟ้า เลือกวันที่เพื่อดูรายละเอียด</p><div className="mt-4 flex flex-wrap items-center gap-3"><label htmlFor="calendar-cohort" className="text-sm font-semibold text-slate-600">แสดงปฏิทินของ</label><select id="calendar-cohort" value={targetCohort} onChange={e=>setTargetCohort(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-ocean-500"><option value="all">ทุกรุ่น</option>{["66","67","68","69","70"].map(x=><option key={x} value={x}>รุ่น {x}</option>)}</select></div></div>
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-slate-400">เดือนที่แสดง</p><h3 className="mt-1 text-xl font-black">{month.toLocaleDateString("th-TH",{month:"long",year:"numeric"})}</h3></div><div className="flex gap-2"><button aria-label="เดือนก่อนหน้า" onClick={()=>changeMonth(-1)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronLeft size={18}/></button><button aria-label="เดือนถัดไป" onClick={()=>changeMonth(1)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronRight size={18}/></button></div></div>
          <div className="grid grid-cols-7 gap-1">{weekdays.map(d=><div key={d} className="py-2 text-center text-xs font-bold text-slate-400">{d}</div>)}
            {calendarDays.map((day,i)=>{const valid=day>0&&day<=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();const key=valid?dateKey(new Date(month.getFullYear(),month.getMonth(),day)):"";const hasEvent=!!key&&eventDates.has(key);const selected=key===selectedDate;return <button key={i} disabled={!valid} onClick={()=>setSelectedDate(key)} className={`relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm font-semibold transition sm:min-h-14 ${!valid?"text-transparent":selected?"bg-ocean-700 text-white shadow-md":hasEvent?"bg-cyan-50 text-ocean-800 hover:bg-cyan-100":"text-slate-600 hover:bg-slate-50"}`}><span>{valid?day:""}</span>{hasEvent&&<span className={`mt-1 h-1.5 w-1.5 rounded-full ${selected?"bg-white":"bg-cyan-600"}`}/>}</button>})}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 rounded-full bg-cyan-600"/> วันที่มีประกาศ/กิจกรรม</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 sm:p-5"><div className="flex items-center gap-2 text-ocean-700"><CalendarDays size={18}/><p className="text-sm font-bold">รายการวันที่เลือก</p></div><h3 className="mt-2 text-lg font-black">{prettyDate(selectedDate)}</h3>
          {selectedEvents.length? <div className="mt-4 space-y-3">{selectedEvents.map(n=><a key={n.id} href={`/announcement/${n.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300 hover:shadow-sm"><div className="flex items-center gap-2"><span className="text-[11px] font-bold text-ocean-700">{n.category}</span>{n.urgency==="urgent"&&<span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">ด่วน</span>}</div><p className="mt-1 text-sm font-bold leading-6">{n.title}</p>{n.actionLine&&<p className="mt-1 text-xs font-semibold leading-5 text-ocean-800">{n.actionLine}</p>}<p className="mt-2 text-xs text-slate-400">{[n.department,n.eventTime,n.eventLocation].filter(Boolean).join(" · ")}</p></a>)}</div>:<div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center"><p className="text-sm font-semibold text-slate-500">วันนี้ยังไม่มีประกาศที่กำหนดวันกิจกรรม</p><p className="mt-1 text-xs text-slate-400">เมื่อแอดมินเพิ่มวันที่ในประกาศ รายการจะแสดงที่นี่อัตโนมัติ</p></div>}
        </div>
      </div>
      {upcomingReminders.length>0&&<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-black text-amber-900"><Bell size={17}/> แจ้งเตือนกำหนดการใกล้ถึง</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{upcomingReminders.map(n=><div key={n.id} className="rounded-xl bg-white/80 p-3"><p className="text-sm font-bold text-slate-800">{n.title}</p><p className="mt-1 text-xs text-amber-800">ครบกำหนดอีก {daysUntil(n.eventDate||"")} วัน · {(n.targetCohorts||["all"]).includes("all")?"ทุกรุ่น":(n.targetCohorts||[]).map(x=>"รุ่น "+x).join(", ")}</p></div>)}</div></div>}
    </section>

    <section id="news" className="mx-auto max-w-7xl px-5 pb-16 pt-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-ocean-600">Latest announcements</p><h2 className="mt-2 text-3xl font-black tracking-tight">ข่าวประชาสัมพันธ์</h2><p className="mt-2 text-sm text-slate-500">ค้นหาและติดตามข่าวสารล่าสุดจากคณะ</p></div><div className="relative w-full md:max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหาข่าวสาร..." className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-ocean-500 focus:ring-4 focus:ring-ocean-100"/></div></div>
      <div className="mt-6 flex flex-wrap gap-2">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${category===c?"bg-ocean-600 text-white shadow-md shadow-ocean-600/20":"border border-slate-200 bg-white text-slate-600 hover:border-ocean-300 hover:text-ocean-700"}`}>{c}</button>)}</div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">{filtered.map(n=><a href={`/announcement/${n.id}`} key={n.id} className="group block rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"><div className="flex items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${n.tone==="blue"?"bg-blue-50 text-blue-700":n.tone==="mint"?"bg-emerald-50 text-emerald-700":n.tone==="gold"?"bg-amber-50 text-amber-700":"bg-violet-50 text-violet-700"}`}>{n.category}</span><div className="flex items-center gap-2">{n.urgency==="urgent"&&<span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-700">ด่วน</span>}{n.pinned&&<span className="text-xs font-bold text-amber-600">★ ปักหมุด</span>}</div></div><h3 className="mt-5 text-xl font-bold leading-8 group-hover:text-ocean-700">{n.title}</h3>{n.actionLine&&<p className="mt-2 rounded-xl bg-cyan-50 px-3 py-2 text-sm font-semibold leading-6 text-ocean-800">{n.actionLine}</p>}<p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-500">{n.excerpt}</p><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400"><span>{n.department} · {prettyDate(n.date)}</span><span className="inline-flex items-center gap-1"><Eye size={14}/>{n.views.toLocaleString("th-TH")}</span></div></a>)}</div>
      {filtered.length===0&&<div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-500">ไม่พบข่าวที่ตรงกับการค้นหา</div>}
    </section>
    <section id="popular" className="bg-white py-14"><div className="mx-auto max-w-7xl px-5"><p className="text-sm font-bold uppercase tracking-[.2em] text-ocean-600">Trending now</p><h2 className="mt-2 text-2xl font-black">ข่าวที่มีผู้เข้าชมสูงสุด</h2><div className="mt-6 grid gap-3 md:grid-cols-4">{ranked.map((n,i)=><div key={n.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between"><span className="text-2xl font-black text-ocean-600">0{i+1}</span><span className="text-xs text-slate-400">{n.views.toLocaleString()} views</span></div><p className="mt-4 text-sm font-semibold leading-6">{n.title}</p></div>)}</div></div></section>
    <footer className="bg-slate-950 px-5 py-8 text-center text-sm text-slate-400"><div className="flex flex-wrap items-center justify-center gap-5">{process.env.NEXT_PUBLIC_FACULTY_INSTAGRAM_URL&&<a href={process.env.NEXT_PUBLIC_FACULTY_INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram คณะ" className="inline-flex items-center gap-2 hover:text-white"><Instagram size={19}/> Instagram</a>}{process.env.NEXT_PUBLIC_FACULTY_FACEBOOK_URL&&<a href={process.env.NEXT_PUBLIC_FACULTY_FACEBOOK_URL} target="_blank" rel="noreferrer" aria-label="Facebook คณะ" className="inline-flex items-center gap-2 hover:text-white"><Facebook size={19}/> Facebook</a>}{process.env.NEXT_PUBLIC_FACULTY_YOUTUBE_URL&&<a href={process.env.NEXT_PUBLIC_FACULTY_YOUTUBE_URL} target="_blank" rel="noreferrer" aria-label="YouTube คณะ" className="inline-flex items-center gap-2 hover:text-white"><Youtube size={19}/> YouTube</a>}</div><p className="mt-4">SCIENCE PR PORTAL · คณะวิทยาศาสตร์</p></footer>
  </main>;
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) { return <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid h-11 w-11 place-items-center rounded-xl bg-ocean-50 text-ocean-600">{icon}</div><div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 truncate text-lg font-black">{value}</p></div></div>; }
