"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, BarChart3, Bell, CalendarDays, Check, ChevronRight, Clock3,
  FileText, LayoutDashboard, MessageCircle, Pencil, Pin, Plus, RotateCcw,
  Search, Settings, ShieldCheck, Trash2, Users, X, Building2
} from "lucide-react";

type Tab = "overview" | "announcements" | "students" | "admins" | "departments" | "calendar" | "analytics" | "settings";
type Status = "draft" | "pending" | "published";
type Announcement = {
  id: string;
  title: string;
  category: string;
  department: string;
  body: string;
  actionLine: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  target: string;
  urgent: boolean;
  pinned: boolean;
  comments: boolean;
  status: Status;
  views: number;
  createdAt: string;
  postAt?: number;
};
type Student = { id: string; code: string; name: string; department: string; year: number; active: boolean };
type Admin = { id: string; username: string; name: string; role: "superadmin" | "editor" | "viewer" };
type Department = { id: string; name: string; short: string };

const STORAGE = {
  announcements: "science-pr-public-demo-announcements-v1",
  students: "science-pr-public-demo-students-v1",
  admins: "science-pr-public-demo-admins-v1",
  departments: "science-pr-public-demo-departments-v1",
};

const initialAnnouncements: Announcement[] = [
  { id: "ann-1", title: "เปิดรับสมัครทุนการศึกษาสำหรับนักศึกษาคณะวิทยาศาสตร์", category: "ทุนการศึกษา", department: "ประชาสัมพันธ์กลาง", body: "รายละเอียดการสมัครทุนการศึกษาและเอกสารประกอบการสมัคร (ข้อมูลตัวอย่าง)", actionLine: "ตรวจสอบคุณสมบัติและเตรียมเอกสารประกอบการสมัคร", eventDate: "", eventTime: "", eventLocation: "", target: "ทุกรุ่น", urgent: false, pinned: true, comments: false, status: "published", views: 1284, createdAt: "2026-11-10" },
  { id: "ann-2", title: "กำหนดการลงทะเบียนและเพิ่ม-ถอนรายวิชา", category: "การเรียน", department: "งานบริการการศึกษา", body: "แจ้งกำหนดการลงทะเบียน เพิ่มรายวิชา และถอนรายวิชา (ข้อมูลตัวอย่าง)", actionLine: "ตรวจสอบกำหนดการก่อนทำรายการ", eventDate: "2026-11-20", eventTime: "09:00", eventLocation: "ระบบทะเบียนออนไลน์", target: "ทุกรุ่น", urgent: false, pinned: false, comments: true, status: "published", views: 986, createdAt: "2026-11-09" },
  { id: "ann-3", title: "กิจกรรม Science Open House ประจำปี", category: "กิจกรรม", department: "สโมสรนักศึกษา", body: "กิจกรรมเปิดบ้านวิทยาศาสตร์สำหรับนักเรียนและผู้สนใจ (ข้อมูลตัวอย่าง)", actionLine: "ลงทะเบียนเข้าร่วมกิจกรรมล่วงหน้า", eventDate: "2026-12-05", eventTime: "08:30", eventLocation: "อาคารคณะวิทยาศาสตร์", target: "รุ่น 69", urgent: false, pinned: false, comments: false, status: "draft", views: 742, createdAt: "2026-11-08" },
  { id: "ann-4", title: "ประกาศแนวปฏิบัติการใช้ห้องปฏิบัติการ", category: "ประกาศ", department: "สำนักงานคณะ", body: "แนวปฏิบัติการใช้ห้องปฏิบัติการและความปลอดภัย (ข้อมูลตัวอย่าง)", actionLine: "อ่านแนวปฏิบัติก่อนเข้าใช้งาน", eventDate: "", eventTime: "", eventLocation: "", target: "ทุกรุ่น", urgent: true, pinned: false, comments: false, status: "published", views: 531, createdAt: "2026-11-07" },
];

const initialStudents: Student[] = [
  { id: "stu-1", code: "DEMO-001", name: "นักศึกษาตัวอย่าง 1", department: "วิทยาการคอมพิวเตอร์", year: 1, active: true },
  { id: "stu-2", code: "DEMO-002", name: "นักศึกษาตัวอย่าง 2", department: "คณิตศาสตร์", year: 2, active: true },
  { id: "stu-3", code: "DEMO-003", name: "นักศึกษาตัวอย่าง 3", department: "เคมี", year: 3, active: false },
];

const initialAdmins: Admin[] = [
  { id: "adm-1", username: "demo.superadmin", name: "ผู้ดูแลเดโม", role: "superadmin" },
  { id: "adm-2", username: "demo.editor", name: "เจ้าหน้าที่ประชาสัมพันธ์ (เดโม)", role: "editor" },
];

const initialDepartments: Department[] = [
  { id: "dep-1", name: "วิทยาการคอมพิวเตอร์", short: "CS" },
  { id: "dep-2", name: "คณิตศาสตร์", short: "MATH" },
  { id: "dep-3", name: "เคมี", short: "CHEM" },
  { id: "dep-4", name: "ฟิสิกส์", short: "PHY" },
  { id: "dep-5", name: "ชีววิทยา", short: "BIO" },
];

const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "ภาพรวม", icon: <LayoutDashboard size={18} /> },
  { id: "announcements", label: "จัดการประกาศ", icon: <FileText size={18} /> },
  { id: "students", label: "จัดการนักศึกษา", icon: <Users size={18} /> },
  { id: "admins", label: "ผู้ดูแลระบบ", icon: <ShieldCheck size={18} /> },
  { id: "departments", label: "จัดการสาขา", icon: <Building2 size={18} /> },
  { id: "calendar", label: "ปฏิทินกิจกรรม", icon: <CalendarDays size={18} /> },
  { id: "analytics", label: "สถิติและอันดับ", icon: <BarChart3 size={18} /> },
  { id: "settings", label: "ตั้งค่าระบบ", icon: <Settings size={18} /> },
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ label, value, helper, icon }: { label: string; value: string; helper: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
        {label}<span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-800">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{helper}</p>
    </div>
  );
}

export default function AdminDemoPage() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [clock, setClock] = useState(Date.now());
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    title: "", category: "ประกาศ", department: "ประชาสัมพันธ์กลาง", body: "",
    actionLine: "", eventDate: "", eventTime: "", eventLocation: "", target: "ทุกรุ่น",
    urgent: false, pinned: false, comments: false,
  });
  const [studentDraft, setStudentDraft] = useState({ code: "", name: "", department: "วิทยาการคอมพิวเตอร์", year: 1 });
  const [adminDraft, setAdminDraft] = useState({ username: "", name: "", password: "", role: "editor" as Admin["role"] });
  const [departmentDraft, setDepartmentDraft] = useState({ name: "", short: "" });

  useEffect(() => {
    setAnnouncements(readLocal(STORAGE.announcements, initialAnnouncements));
    setStudents(readLocal(STORAGE.students, initialStudents));
    setAdmins(readLocal(STORAGE.admins, initialAdmins));
    setDepartments(readLocal(STORAGE.departments, initialDepartments));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE.announcements, JSON.stringify(announcements));
    localStorage.setItem(STORAGE.students, JSON.stringify(students));
    localStorage.setItem(STORAGE.admins, JSON.stringify(admins));
    localStorage.setItem(STORAGE.departments, JSON.stringify(departments));
  }, [ready, announcements, students, admins, departments]);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setAnnouncements((items) => {
      let changed = false;
      const next = items.map((item) => {
        if (item.status === "pending" && item.postAt && item.postAt <= clock) {
          changed = true;
          return { ...item, status: "published" as const, postAt: undefined };
        }
        return item;
      });
      return changed ? next : items;
    });
  }, [clock]);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const publishedCount = announcements.filter((item) => item.status === "published").length;
  const totalViews = announcements.reduce((sum, item) => sum + item.views, 0);
  const filteredAnnouncements = useMemo(
    () => announcements.filter((item) => (item.title + " " + item.category + " " + item.department).toLowerCase().includes(query.toLowerCase())),
    [announcements, query],
  );

  const blankDraft = () => ({
    title: "", category: "ประกาศ", department: departments[0]?.name || "ประชาสัมพันธ์กลาง", body: "",
    actionLine: "", eventDate: "", eventTime: "", eventLocation: "", target: "ทุกรุ่น",
    urgent: false, pinned: false, comments: false,
  });

  const startNewAnnouncement = () => {
    setEditingId(null);
    setDraft(blankDraft());
    setFormOpen(true);
    setTab("announcements");
  };

  const editAnnouncement = (item: Announcement) => {
    setEditingId(item.id);
    setDraft({
      title: item.title, category: item.category, department: item.department, body: item.body,
      actionLine: item.actionLine, eventDate: item.eventDate, eventTime: item.eventTime,
      eventLocation: item.eventLocation, target: item.target, urgent: item.urgent,
      pinned: item.pinned, comments: item.comments,
    });
    setFormOpen(true);
    setTab("announcements");
  };

  const saveAnnouncement = () => {
    if (!draft.title.trim() || !draft.body.trim()) {
      notify("กรุณากรอกหัวข้อและรายละเอียดประกาศ");
      return;
    }
    if (editingId) {
      setAnnouncements((items) => items.map((item) => item.id === editingId
        ? { ...item, ...draft, status: "draft", postAt: undefined }
        : item));
      notify("บันทึกการแก้ไขในข้อมูลเดโมแล้ว");
    } else {
      setAnnouncements((items) => [{
        id: "ann-" + Date.now(), ...draft, status: "draft", views: 0, createdAt: todayKey(),
      }, ...items]);
      notify("เพิ่มประกาศฉบับร่างในข้อมูลเดโมแล้ว");
    }
    setFormOpen(false);
    setEditingId(null);
  };

  const publishNow = (id: string) => {
    if (!window.confirm("ยืนยันอนุมัติและเผยแพร่ประกาศตัวอย่างนี้ทันทีหรือไม่?")) return;
    setAnnouncements((items) => items.map((item) => item.id === id
      ? { ...item, status: "published", postAt: undefined }
      : item));
    notify("เผยแพร่ประกาศในโหมดเดโมแล้ว");
  };

  const queueForTenMinutes = (id: string) => {
    if (!window.confirm("เริ่มนับถอยหลัง 10 นาทีสำหรับประกาศตัวอย่างนี้หรือไม่?")) return;
    setAnnouncements((items) => items.map((item) => item.id === id
      ? { ...item, status: "pending", postAt: Date.now() + 10 * 60 * 1000 }
      : item));
    notify("เริ่มนับถอยหลัง 10 นาทีแล้ว (ทำงานระหว่างเปิดหน้าเดโม)");
  };

  const resetDemo = () => {
    if (!window.confirm("ล้างการเปลี่ยนแปลงในเดโมและคืนค่าข้อมูลตัวอย่างเริ่มต้นหรือไม่?")) return;
    localStorage.removeItem(STORAGE.announcements);
    localStorage.removeItem(STORAGE.students);
    localStorage.removeItem(STORAGE.admins);
    localStorage.removeItem(STORAGE.departments);
    setAnnouncements(initialAnnouncements);
    setStudents(initialStudents);
    setAdmins(initialAdmins);
    setDepartments(initialDepartments);
    setQuery("");
    setFormOpen(false);
    setEditingId(null);
    setTab("overview");
    notify("คืนค่าข้อมูลเดโมเริ่มต้นแล้ว");
  };

  const addStudent = () => {
    if (!studentDraft.code.trim() || !studentDraft.name.trim()) {
      notify("กรุณากรอกรหัสและชื่อนักศึกษา");
      return;
    }
    setStudents((items) => [{ id: "stu-" + Date.now(), ...studentDraft, active: true }, ...items]);
    setStudentDraft({ code: "", name: "", department: departments[0]?.name || "", year: 1 });
    notify("เพิ่มนักศึกษาตัวอย่างแล้ว");
  };

  const addAdmin = () => {
    const username = adminDraft.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(username) || !adminDraft.name.trim() || adminDraft.password.length < 8) {
      notify("กรุณาตรวจชื่อบัญชี ชื่อผู้ดูแล และรหัสผ่านทดลอง (อย่างน้อย 8 ตัว)");
      return;
    }
    if (admins.some((item) => item.username.toLowerCase() === username)) {
      notify("ชื่อบัญชีนี้มีอยู่ในชุดข้อมูลเดโมแล้ว");
      return;
    }
    setAdmins((items) => [{ id: "adm-" + Date.now(), username, name: adminDraft.name.trim(), role: adminDraft.role }, ...items]);
    setAdminDraft({ username: "", name: "", password: "", role: "editor" });
    notify("เพิ่มบัญชีผู้ดูแลตัวอย่างแล้ว (ไม่ใช่บัญชีล็อกอินจริง)");
  };

  const addDepartment = () => {
    if (!departmentDraft.name.trim() || !departmentDraft.short.trim()) {
      notify("กรุณากรอกชื่อสาขาและตัวย่อ");
      return;
    }
    setDepartments((items) => [{ id: "dep-" + Date.now(), name: departmentDraft.name.trim(), short: departmentDraft.short.trim().toUpperCase() }, ...items]);
    setDepartmentDraft({ name: "", short: "" });
    notify("เพิ่มสาขาตัวอย่างแล้ว");
  };

  const removeAnnouncement = (id: string) => {
    if (!window.confirm("ยืนยันลบประกาศตัวอย่างนี้หรือไม่?")) return;
    setAnnouncements((items) => items.filter((item) => item.id !== id));
    notify("ลบประกาศในข้อมูลเดโมแล้ว");
  };

  const countdown = (postAt?: number) => {
    if (!postAt) return "10:00";
    const seconds = Math.max(0, Math.ceil((postAt - clock) / 1000));
    return Math.floor(seconds / 60).toString().padStart(2, "0") + ":" + (seconds % 60).toString().padStart(2, "0");
  };

  if (!ready) {
    return <main className="grid min-h-screen place-items-center bg-[#f4f9fb] text-sm font-semibold text-slate-500">กำลังเตรียมข้อมูลเดโม...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f4f9fb] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-900 text-white"><Building2 size={22} /></div>
            <div><p className="text-xs font-bold tracking-widest text-ocean-700">SCIENCE PR PORTAL</p><h1 className="text-lg font-black">ศูนย์จัดการระบบ · DEMO</h1></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">ผู้ดูแลเดโม · จำลองสิทธิ์เต็ม</span>
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-ocean-400"><ArrowLeft size={16} /> หน้าเว็บไซต์</Link>
            <button onClick={resetDemo} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2.5 text-sm font-bold text-amber-800"><RotateCcw size={15} /> รีเซ็ตเดโม</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-4 pt-5 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          <b>โหมดเดโมเต็มรูปแบบ:</b> ทุกเมนูและปุ่มจัดการทำงานกับข้อมูลตัวอย่าง และบันทึกเฉพาะในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่มีการสร้างบัญชีจริง ไม่มีการแก้ไขประกาศจริง และไม่มีการเขียนข้อมูลลง Supabase
        </div>
        {notice && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-5">
          <p className="px-3 pb-3 pt-2 text-[11px] font-black uppercase tracking-[.18em] text-slate-400">Workspace</p>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
            {tabs.map((item) => (
              <button key={item.id} onClick={() => { setTab(item.id); setFormOpen(false); }} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab === item.id ? "bg-ocean-900 text-white" : "text-slate-600 hover:bg-cyan-50 hover:text-ocean-800"}`}>
                {item.icon}<span>{item.label}</span>{tab === item.id && <ChevronRight className="ml-auto hidden lg:block" size={15} />}
              </button>
            ))}
          </nav>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500"><b className="text-slate-700">Demo workspace</b><br />Local browser storage · ไม่เชื่อมฐานข้อมูลจริง</div>
        </aside>

        <section className="min-w-0">
          {tab === "overview" && <>
            <div className="mb-6"><p className="text-sm font-semibold text-ocean-700">ภาพรวมระบบ / Dashboard</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">สวัสดี ผู้ดูแลเดโม</h2><p className="mt-2 text-sm text-slate-500">พื้นที่ทดลองการจัดการประกาศและข้อมูลประชาสัมพันธ์</p></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="ประกาศทั้งหมด" value={String(announcements.length)} helper={`เผยแพร่แล้ว ${publishedCount} รายการ`} icon={<FileText />} />
              <StatCard label="ยอดเข้าชมจำลอง" value={totalViews.toLocaleString("th-TH")} helper="ตัวเลขตัวอย่าง" icon={<BarChart3 />} />
              <StatCard label="นักศึกษาตัวอย่าง" value={String(students.length)} helper="ข้อมูลในเครื่องนี้" icon={<Users />} />
              <StatCard label="กิจกรรมที่กำหนด" value={String(announcements.filter((item) => item.eventDate).length)} helper="มีวันจัดกิจกรรม" icon={<CalendarDays />} />
            </div>
            <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">ประกาศล่าสุด</h3><div className="mt-3 divide-y divide-slate-100">{announcements.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-slate-400">{item.category} · {item.createdAt}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold">{item.status === "published" ? "เผยแพร่" : item.status === "pending" ? "รอเวลา" : "ฉบับร่าง"}</span></div>)}</div></div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-black">ทางลัด</h3><div className="mt-4 grid gap-2">
                <button onClick={startNewAnnouncement} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left text-sm font-semibold hover:bg-cyan-50"><Plus size={17} /> สร้างประกาศใหม่</button>
                <button onClick={() => setTab("students")} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left text-sm font-semibold hover:bg-cyan-50"><Users size={17} /> จัดการนักศึกษา</button>
                <button onClick={() => setTab("calendar")} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left text-sm font-semibold hover:bg-cyan-50"><CalendarDays size={17} /> ดูปฏิทินกิจกรรม</button>
              </div></div>
            </div>
          </>}

          {tab === "announcements" && <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black sm:text-3xl">จัดการประกาศ</h2><p className="mt-2 text-sm text-slate-500">เพิ่ม แก้ไข ลบ อนุมัติ และตั้งเวลาประกาศจำลอง</p></div><button onClick={startNewAnnouncement} className="inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-4 py-3 text-sm font-bold text-white"><Plus size={17} /> สร้างประกาศ</button></div>
            {formOpen && <div className="mb-5 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><h3 className="text-lg font-black">{editingId ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}</h3><button onClick={() => setFormOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-xs font-bold text-slate-600">หัวข้อประกาศ<input className="input mt-2" value={draft.title} onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))} placeholder="ระบุหัวข้อประกาศ" /></label>
                <label className="text-xs font-bold text-slate-600">หมวดหมู่<select className="input mt-2" value={draft.category} onChange={(e) => setDraft((v) => ({ ...v, category: e.target.value }))}>{["ประกาศ", "การเรียน", "ทุนการศึกษา", "กิจกรรม", "ข่าวสาร", "กยศ."].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className="text-xs font-bold text-slate-600">หน่วยงาน / สาขา<select className="input mt-2" value={draft.department} onChange={(e) => setDraft((v) => ({ ...v, department: e.target.value }))}>{["ประชาสัมพันธ์กลาง", ...departments.map((item) => item.name)].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className="text-xs font-bold text-slate-600">กลุ่มเป้าหมาย<select className="input mt-2" value={draft.target} onChange={(e) => setDraft((v) => ({ ...v, target: e.target.value }))}>{["ทุกรุ่น", "รุ่น 66", "รุ่น 67", "รุ่น 68", "รุ่น 69", "รุ่น 70"].map((value) => <option key={value}>{value}</option>)}</select></label>
                <label className="text-xs font-bold text-slate-600">วันที่จัดกิจกรรม<input className="input mt-2" type="date" value={draft.eventDate} onChange={(e) => setDraft((v) => ({ ...v, eventDate: e.target.value }))} /></label>
                <label className="text-xs font-bold text-slate-600">เวลา<input className="input mt-2" type="time" value={draft.eventTime} onChange={(e) => setDraft((v) => ({ ...v, eventTime: e.target.value }))} /></label>
                <label className="text-xs font-bold text-slate-600">สถานที่<input className="input mt-2" value={draft.eventLocation} onChange={(e) => setDraft((v) => ({ ...v, eventLocation: e.target.value }))} placeholder="สถานที่จัดกิจกรรม" /></label>
                <label className="text-xs font-bold text-slate-600">สิ่งที่ต้องทำ<input className="input mt-2" value={draft.actionLine} onChange={(e) => setDraft((v) => ({ ...v, actionLine: e.target.value }))} placeholder="เช่น ลงทะเบียนล่วงหน้า" /></label>
                <label className="md:col-span-2 text-xs font-bold text-slate-600">รายละเอียดประกาศ<textarea rows={5} className="input mt-2" value={draft.body} onChange={(e) => setDraft((v) => ({ ...v, body: e.target.value }))} placeholder="เขียนรายละเอียดประกาศ..." /></label>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.urgent} onChange={(e) => setDraft((v) => ({ ...v, urgent: e.target.checked }))} /> ข่าวด่วน</label>
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.pinned} onChange={(e) => setDraft((v) => ({ ...v, pinned: e.target.checked }))} /> ปักหมุด</label>
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.comments} onChange={(e) => setDraft((v) => ({ ...v, comments: e.target.checked }))} /> เปิดคอมเมนต์</label>
              </div>
              <div className="mt-5 flex justify-end gap-2"><button onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">ยกเลิก</button><button onClick={saveAnnouncement} className="rounded-xl bg-ocean-900 px-5 py-2.5 text-sm font-bold text-white">บันทึกเป็นฉบับร่าง</button></div>
            </div>}
            <div className="mb-4 flex items-center gap-3"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input className="input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาประกาศ..." /></div><span className="text-xs text-slate-400">{filteredAnnouncements.length} รายการ</span></div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">{filteredAnnouncements.map((item) => <div key={item.id} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{item.title}</p>{item.pinned && <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">ปักหมุด</span>}{item.urgent && <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">ด่วน</span>}</div><p className="mt-1 text-xs text-slate-400">{item.category} · {item.department} · {item.createdAt} · {item.views.toLocaleString()} views</p><div className="mt-2 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2.5 py-1">{item.status === "published" ? "เผยแพร่" : item.status === "pending" ? "รอเผยแพร่" : "ฉบับร่าง"}</span><span className="rounded-full bg-slate-100 px-2.5 py-1">กลุ่ม: {item.target}</span><span className="rounded-full bg-slate-100 px-2.5 py-1">{item.comments ? "เปิดคอมเมนต์" : "ปิดคอมเมนต์"}</span>{item.status === "pending" && <span className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900"><Clock3 size={13} /> <b className="font-mono text-base">{countdown(item.postAt)}</b></span>}</div></div>
              <div className="flex flex-wrap gap-2">
                <button title="แก้ไข" onClick={() => editAnnouncement(item)} className="iconbtn"><Pencil size={16} /></button>
                <button title="ปักหมุด/ยกเลิก" onClick={() => setAnnouncements((items) => items.map((x) => x.id === item.id ? { ...x, pinned: !x.pinned } : x))} className="iconbtn"><Pin size={16} /></button>
                <button title="เปิด/ปิดคอมเมนต์" onClick={() => setAnnouncements((items) => items.map((x) => x.id === item.id ? { ...x, comments: !x.comments } : x))} className="iconbtn"><MessageCircle size={16} /></button>
                {item.status === "draft" && <button onClick={() => queueForTenMinutes(item.id)} className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-bold text-ocean-800">รอ 10 นาที</button>}
                {item.status !== "published" && <button onClick={() => publishNow(item.id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">อนุมัติทันที</button>}
                {item.status === "pending" && <button onClick={() => setAnnouncements((items) => items.map((x) => x.id === item.id ? { ...x, status: "draft", postAt: undefined } : x))} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">ยกเลิกเวลา</button>}
                {item.status === "published" && <button onClick={() => setAnnouncements((items) => items.map((x) => x.id === item.id ? { ...x, status: "draft", postAt: undefined } : x))} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">กลับเป็นร่าง</button>}
                <button onClick={() => removeAnnouncement(item.id)} className="iconbtn text-rose-600"><Trash2 size={16} /></button>
              </div>
            </div>)}</div>
          </>}

          {tab === "students" && <>
            <div className="mb-5"><h2 className="text-2xl font-black sm:text-3xl">จัดการนักศึกษา</h2><p className="mt-2 text-sm text-slate-500">เพิ่ม แก้ไขสถานะ และลบข้อมูลนักศึกษาตัวอย่าง</p></div>
            <div className="mb-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1fr_1fr_100px_auto]">
              <input className="input" placeholder="รหัสนักศึกษา" value={studentDraft.code} onChange={(e) => setStudentDraft((v) => ({ ...v, code: e.target.value }))} />
              <input className="input" placeholder="ชื่อ-นามสกุล" value={studentDraft.name} onChange={(e) => setStudentDraft((v) => ({ ...v, name: e.target.value }))} />
              <select className="input" value={studentDraft.department} onChange={(e) => setStudentDraft((v) => ({ ...v, department: e.target.value }))}>{departments.map((item) => <option key={item.id}>{item.name}</option>)}</select>
              <select className="input" value={studentDraft.year} onChange={(e) => setStudentDraft((v) => ({ ...v, year: Number(e.target.value) }))}>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>ปี {year}</option>)}</select>
              <button onClick={addStudent} className="rounded-xl bg-ocean-900 px-4 py-2.5 text-sm font-bold text-white">เพิ่ม</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">{students.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-2"><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.code} · {item.department} · ปี {item.year}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{item.active ? "ใช้งาน" : "ระงับ"}</span></div><div className="mt-4 flex gap-2"><button onClick={() => setStudents((items) => items.map((x) => x.id === item.id ? { ...x, active: !x.active } : x))} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold">{item.active ? "ระงับบัญชี" : "เปิดใช้งาน"}</button><button onClick={() => { if (window.confirm("ลบนักศึกษาตัวอย่างนี้หรือไม่?")) setStudents((items) => items.filter((x) => x.id !== item.id)); }} className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600">ลบ</button></div></div>)}</div>
          </>}

          {tab === "admins" && <>
            <div className="mb-5"><h2 className="text-2xl font-black sm:text-3xl">จัดการบัญชีผู้ดูแล</h2><p className="mt-2 text-sm text-slate-500">เพิ่มบัญชีทดลองและเปลี่ยนบทบาทเพื่อทดสอบหน้าจอ</p></div>
            <div className="mb-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-600">ชื่อที่แสดง<input className="input mt-2" value={adminDraft.name} onChange={(e) => setAdminDraft((v) => ({ ...v, name: e.target.value }))} placeholder="ชื่อผู้ดูแล" /></label>
              <label className="text-xs font-bold text-slate-600">ชื่อบัญชี<input className="input mt-2" value={adminDraft.username} onChange={(e) => setAdminDraft((v) => ({ ...v, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "") }))} placeholder="เช่น demo.editor2" /></label>
              <label className="text-xs font-bold text-slate-600">รหัสผ่านทดลอง<input className="input mt-2" type="password" value={adminDraft.password} onChange={(e) => setAdminDraft((v) => ({ ...v, password: e.target.value }))} placeholder="อย่างน้อย 8 ตัว (ไม่ถูกบันทึก)" /></label>
              <label className="text-xs font-bold text-slate-600">ระดับสิทธิ์<select className="input mt-2" value={adminDraft.role} onChange={(e) => setAdminDraft((v) => ({ ...v, role: e.target.value as Admin["role"] }))}><option value="editor">แอดมิน / ผู้อนุมัติ</option><option value="superadmin">ผู้ดูแลระบบสูงสุด</option><option value="viewer">ผู้ชม</option></select></label>
              <div className="sm:col-span-2"><button onClick={addAdmin} className="rounded-xl bg-ocean-900 px-5 py-3 text-sm font-bold text-white"><Plus className="mr-1 inline" size={16} /> เพิ่มบัญชีทดลอง</button></div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">{admins.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"><div><p className="font-bold">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.username}</p><span className="mt-2 inline-block rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-ocean-800">{item.role === "superadmin" ? "ผู้ดูแลระบบสูงสุด" : item.role === "editor" ? "แอดมิน / ผู้อนุมัติ" : "ผู้ชม"}</span></div><div className="flex items-center gap-2"><select className="input" value={item.role} onChange={(e) => setAdmins((items) => items.map((x) => x.id === item.id ? { ...x, role: e.target.value as Admin["role"] } : x))}><option value="editor">แอดมิน / ผู้อนุมัติ</option><option value="superadmin">ผู้ดูแลระบบสูงสุด</option><option value="viewer">ผู้ชม</option></select><button onClick={() => { if (window.confirm("ลบบัญชีจำลองนี้หรือไม่?")) setAdmins((items) => items.filter((x) => x.id !== item.id)); }} className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600">ลบ</button></div></div>)}</div>
          </>}

          {tab === "departments" && <>
            <div className="mb-5"><h2 className="text-2xl font-black sm:text-3xl">จัดการสาขา</h2><p className="mt-2 text-sm text-slate-500">เพิ่มและลบรายชื่อสาขาวิชาในชุดข้อมูลจำลอง</p></div>
            <div className="mb-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_180px_auto]"><input className="input" placeholder="ชื่อสาขา" value={departmentDraft.name} onChange={(e) => setDepartmentDraft((v) => ({ ...v, name: e.target.value }))} /><input className="input" placeholder="ตัวย่อ เช่น CS" value={departmentDraft.short} onChange={(e) => setDepartmentDraft((v) => ({ ...v, short: e.target.value.toUpperCase() }))} /><button onClick={addDepartment} className="rounded-xl bg-ocean-900 px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} className="mr-1 inline" /> เพิ่มสาขา</button></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{departments.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"><div><span className="text-xs font-black tracking-widest text-ocean-700">{item.short}</span><p className="mt-1 font-bold">{item.name}</p></div><button onClick={() => { if (window.confirm("ลบสาขาตัวอย่างนี้หรือไม่?")) setDepartments((items) => items.filter((x) => x.id !== item.id)); }} className="iconbtn text-rose-600"><Trash2 size={16} /></button></div>)}</div>
          </>}

          {tab === "calendar" && <>
            <div className="mb-5"><h2 className="text-2xl font-black sm:text-3xl">ปฏิทินกิจกรรม</h2><p className="mt-2 text-sm text-slate-500">วันกิจกรรมจะเชื่อมกับวันที่ในประกาศตัวอย่าง</p></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7"><div className="flex items-center gap-2"><CalendarDays className="text-ocean-700" /><h3 className="font-black">กำหนดการที่มีวันกิจกรรม</h3></div><div className="mt-5 space-y-3">{announcements.filter((item) => item.eventDate).sort((a, b) => a.eventDate.localeCompare(b.eventDate)).map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ocean-900 text-white"><span className="text-lg font-black">{new Date(item.eventDate + "T00:00:00").getDate()}</span><span className="text-[10px]">{new Date(item.eventDate + "T00:00:00").toLocaleDateString("th-TH", { month: "short" })}</span></div><div className="min-w-0 flex-1"><p className="font-bold">{item.title}</p><p className="mt-1 text-xs text-slate-400">{item.department} · {item.eventDate} {item.eventTime} · {item.eventLocation}</p></div><button onClick={() => editAnnouncement(item)} className="text-sm font-bold text-ocean-700">แก้ไขประกาศ</button></div>)}{announcements.every((item) => !item.eventDate) && <p className="py-10 text-center text-sm text-slate-400">ยังไม่มีรายการกิจกรรม</p>}</div></div>
          </>}

          {tab === "analytics" && <>
            <div className="mb-5"><h2 className="text-2xl font-black sm:text-3xl">สถิติและอันดับ</h2><p className="mt-2 text-sm text-slate-500">ข้อมูลสถิติจำลองสำหรับทดลองการแสดงผล</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><StatCard label="ยอดเข้าชมรวม" value={totalViews.toLocaleString("th-TH")} helper="ข้อมูลตัวอย่าง" icon={<BarChart3 />} /><StatCard label="ประกาศที่เผยแพร่" value={String(publishedCount)} helper="สถานะเผยแพร่" icon={<Bell />} /></div>
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5"><h3 className="font-black">ประกาศยอดเข้าชมสูงสุด</h3><div className="mt-4 space-y-4">{[...announcements].sort((a, b) => b.views - a.views).map((item, index) => <div key={item.id}><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{index + 1}. {item.title}</span><b>{item.views.toLocaleString()}</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-ocean-500" style={{ width: `${totalViews ? Math.max(4, item.views / Math.max(...announcements.map((x) => x.views), 1) * 100) : 0}%` }} /></div></div>)}</div></div>
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">ตัวเลขเข้าชมเป็นข้อมูลจำลอง ไม่ใช่สถิติจากผู้ใช้งานเว็บไซต์จริง</p>
          </>}

          {tab === "settings" && <>
            <div className="mb-5"><h2 className="text-2xl font-black sm:text-3xl">ตั้งค่าระบบ</h2><p className="mt-2 text-sm text-slate-500">แสดงสถานะการทำงานของพื้นที่ทดลอง</p></div>
            <div className="space-y-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">โหมดการทำงาน</p><p className="mt-1 text-xs text-slate-400">เปิดให้ทดลองใช้เมนูและการจัดการทั้งหมด</p></div><span className="w-fit rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">Demo · Local only</span></div>
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">ที่จัดเก็บข้อมูล</p><p className="mt-1 text-xs text-slate-400">แยก storage namespace จากหน้าแอดมินจริง</p></div><span className="w-fit rounded-full bg-slate-100 px-3 py-2 text-xs font-bold">localStorage</span></div>
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">การเชื่อมต่อ Supabase</p><p className="mt-1 text-xs text-slate-400">หน้าเดโมไม่เรียก API หรือเขียนข้อมูลลงฐานข้อมูล</p></div><span className="w-fit rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">แยกจากระบบจริง</span></div>
            </div>
            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5"><h3 className="font-black">รีเซ็ตข้อมูลทดลอง</h3><p className="mt-2 text-sm text-slate-500">ลบการเปลี่ยนแปลงที่ทำในเบราว์เซอร์นี้และคืนข้อมูลตัวอย่างเริ่มต้น</p><button onClick={resetDemo} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700"><RotateCcw size={16} /> คืนค่าเริ่มต้น</button></div>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><b>ข้อจำกัดการจำลอง:</b> ตัวนับถอยหลัง 10 นาทีทำงานในขณะที่เปิดหน้าเดโมอยู่หรือกลับมาเปิดหน้าเดโมอีกครั้ง ไม่ใช่ตัวตั้งเวลาฝั่งเซิร์ฟเวอร์</div>
          </>}
        </section>
      </div>

      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-400">Science PR Portal · Interactive Admin Demo · ข้อมูลจำลองในเบราว์เซอร์เท่านั้น</footer>
      <style jsx global>{`.input{width:100%;border:1px solid #dbe3e8;border-radius:12px;padding:11px 13px;font-size:14px;outline:none;background:#fff}.input:focus{border-color:#1596b4;box-shadow:0 0 0 3px #d9f3fb}.iconbtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;border-radius:10px;padding:9px;color:#64748b}.iconbtn:hover{background:#f8fafc}.input.pl-10{padding-left:40px}`}</style>
    </main>
  );
}
