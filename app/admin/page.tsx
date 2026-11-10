import Link from "next/link";
import { ArrowLeft, BarChart3, FileText, Settings, Users } from "lucide-react";

export default function AdminPage() {
  return <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-800">
    <div className="mx-auto max-w-5xl">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ocean-600"><ArrowLeft size={16}/> กลับหน้าประชาสัมพันธ์</Link>
      <div className="mt-8 rounded-3xl bg-gradient-to-r from-slate-900 to-ocean-900 p-8 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-200">Management console</p><h1 className="mt-2 text-3xl font-black">ระบบจัดการแอดมิน</h1><p className="mt-2 max-w-xl text-sm leading-7 text-slate-300">พื้นที่สำหรับผู้ดูแลระบบ จัดการข่าวสาร สาขา และติดตามสถิติการเข้าชม</p></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Panel icon={<FileText/>} title="จัดการข่าวสาร" desc="เพิ่ม แก้ไข ปักหมุด และจัดการสถานะประกาศ"/>
        <Panel icon={<BarChart3/>} title="สถิติและอันดับ" desc="ดูยอดเข้าชม จัดอันดับข่าว และคำค้นหายอดนิยม"/>
        <Panel icon={<Users/>} title="จัดการนักศึกษาและผู้ดูแล" desc="จัดการบัญชีและสิทธิ์การเข้าถึง"/>
        <Panel icon={<Settings/>} title="ตั้งค่าระบบ" desc="จัดการสาขาและข้อมูลพื้นฐาน"/>
      </div>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900"><strong>หมายเหตุ:</strong> หน้านี้เป็นโครง UI เท่านั้น ยังไม่มีระบบยืนยันตัวตนหรือเชื่อมฐานข้อมูล ห้ามใช้กับข้อมูลนักศึกษาจริงจนกว่าจะติดตั้งระบบ auth, database และตรวจสอบมาตรการ PDPA แล้ว</div>
    </div>
  </main>;
}
function Panel({icon,title,desc}:{icon:React.ReactNode;title:string;desc:string}) { return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-4 text-ocean-600">{icon}</div><h2 className="font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p><span className="mt-5 inline-block text-xs font-bold text-amber-600">กำลังพัฒนา</span></div>; }
