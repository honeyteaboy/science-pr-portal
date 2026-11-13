"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft, BarChart3, Bell, CalendarDays, Check, ChevronRight, ClipboardList,
  Eye, FileText, LayoutDashboard, MessageCircle, Plus, Search, Settings,
  ShieldCheck, Trash2, Upload, Users, X, Building2, TrendingUp, Pin, Pencil
} from "lucide-react";

type Tab = "overview" | "announcements" | "students" | "admins" | "departments" | "calendar" | "analytics" | "settings";
type Announcement = {id:string|number;title:string;category:string;department:string;body:string;status:"published"|"draft"|"pending";pinned:boolean;comments:boolean;date:string;eventDate:string;views:number;image?:string;targetCohorts?:string[];urgency?:"normal"|"urgent";actionLine?:string;eventTime?:string;eventLocation?:string;eventLink?:string;links?:{id?:string;label:string;url:string;sort_order?:number}[];channels?:string[];reminderDays?:number[];postAt?:number;activityLog?:string[];approvedBy?:string};
type Student = {id:number;studentCode:string;name:string;department:string;year:number;status:"active"|"inactive"};
type VerifiedStudent = {id:string;email:string|null;full_name:string|null;is_active:boolean;student_cohort_memberships:{cohort:{id:string;code:string;label:string}|null;verified_at:string|null;verified_by:string|null}[]};
type Admin = {id:string|number;username:string;name:string;role:"superadmin"|"editor"|"viewer"};
type AdminSession = {id:number;username:string;name:string;role:"superadmin"|"editor"|"viewer"};
type Department = {id:number;name:string;short:string};

const seedAnnouncements:Announcement[]=[
 {id:1,title:"เปิดรับสมัครทุนการศึกษาสำหรับนักศึกษาคณะวิทยาศาสตร์",category:"ทุนการศึกษา",department:"ประชาสัมพันธ์กลาง",body:"รายละเอียดการสมัครทุนการศึกษาและเอกสารประกอบการสมัคร (ข้อมูลตัวอย่าง)",status:"published",pinned:true,comments:false,date:"2026-11-10",eventDate:"",views:1284},
 {id:2,title:"กำหนดการลงทะเบียนและเพิ่ม-ถอนรายวิชา",category:"การเรียน",department:"งานบริการการศึกษา",body:"แจ้งกำหนดการลงทะเบียน เพิ่มรายวิชา และถอนรายวิชา (ข้อมูลตัวอย่าง)",status:"published",pinned:false,comments:true,date:"2026-11-09",eventDate:"2026-11-20",views:986},
 {id:3,title:"กิจกรรม Science Open House ประจำปี",category:"กิจกรรม",department:"สโมสรนักศึกษา",body:"กิจกรรมเปิดบ้านวิทยาศาสตร์ (ข้อมูลตัวอย่าง)",status:"draft",pinned:false,comments:false,date:"2026-11-08",eventDate:"2026-12-05",views:742},
 {id:4,title:"ประกาศแนวปฏิบัติการใช้ห้องปฏิบัติการ",category:"ประกาศ",department:"สำนักงานคณะ",body:"แนวปฏิบัติการใช้ห้องปฏิบัติการ (ข้อมูลตัวอย่าง)",status:"published",pinned:false,comments:false,date:"2026-11-07",eventDate:"",views:531}
];
const seedStudents:Student[]=[
 {id:1,studentCode:"DEMO-001",name:"นักศึกษาตัวอย่าง 1",department:"วิทยาการคอมพิวเตอร์",year:1,status:"active"},
 {id:2,studentCode:"DEMO-002",name:"นักศึกษาตัวอย่าง 2",department:"คณิตศาสตร์",year:2,status:"active"},
 {id:3,studentCode:"DEMO-003",name:"นักศึกษาตัวอย่าง 3",department:"เคมี",year:3,status:"inactive"}
];
const seedDepartments:Department[]=[
 {id:1,name:"วิทยาการคอมพิวเตอร์",short:"CS"},{id:2,name:"คณิตศาสตร์",short:"MATH"},
 {id:3,name:"เคมี",short:"CHEM"},{id:4,name:"ฟิสิกส์",short:"PHY"},{id:5,name:"ชีววิทยา",short:"BIO"}
];
const tabs:{id:Tab;label:string;icon:ReactNode}[]=[
 {id:"overview",label:"ภาพรวม",icon:<LayoutDashboard size={18}/>},
 {id:"announcements",label:"จัดการประกาศ",icon:<FileText size={18}/>},
 {id:"students",label:"จัดการนักศึกษา",icon:<Users size={18}/>},
 {id:"admins",label:"ผู้ดูแลระบบ",icon:<ShieldCheck size={18}/>},
 {id:"departments",label:"จัดการสาขา",icon:<Building2 size={18}/>},
 {id:"calendar",label:"ปฏิทินกิจกรรม",icon:<CalendarDays size={18}/>},
 {id:"analytics",label:"สถิติและอันดับ",icon:<BarChart3 size={18}/>},
 {id:"settings",label:"ตั้งค่าระบบ",icon:<Settings size={18}/>}
];

function readStore<T>(key:string,fallback:T):T { try { const v=localStorage.getItem(key); return v?JSON.parse(v) as T:fallback; } catch { return fallback; } }
function mapDatabaseAnnouncement(row:any):Announcement {
 const created=row.published_at||row.created_at||new Date().toISOString();
 const latestReview=[...(row.reviews||[])].sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at)))[0];
 const targets=(row.targets||[]).map((x:any)=>x.cohort?.code).filter(Boolean);
 const links=(row.links||[]).slice().sort((a:any,b:any)=>a.sort_order-b.sort_order);
 return {
  id:row.id,title:row.title,category:row.topic?.name||"ประกาศ",department:row.department||"ประชาสัมพันธ์กลาง",
  body:row.body||"",status:row.status,pinned:Boolean(row.pinned),comments:Boolean(row.comments_enabled),
  date:String(created).slice(0,10),eventDate:row.event_date||"",views:Number(row.view_count||0),
  targetCohorts:targets,urgency:row.is_urgent?"urgent":"normal",actionLine:row.action_line||"",
  eventTime:row.event_time||"",eventLocation:row.event_location||"",eventLink:links[0]?.url||"",
  links,channels:row.channels||[],reminderDays:row.reminder_days||[14,7,3],
  image:row.image_url||undefined,postAt:row.scheduled_publish_at?new Date(row.scheduled_publish_at).getTime():undefined,
 };
}
async function fetchDatabaseAnnouncements():Promise<Announcement[]> {
 const response=await fetch("/api/announcements",{cache:"no-store"});
 const payload=await response.json();
 if(!response.ok)throw new Error(payload.error||"โหลดประกาศจากฐานข้อมูลไม่สำเร็จ");
 return (payload.data||[]).map(mapDatabaseAnnouncement);
}
function Stat({label,value,sub,icon}:{label:string;value:string;sub:string;icon:ReactNode}) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{label}</span><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-ocean-700">{icon}</span></div><p className="mt-4 text-3xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-400">{sub}</p></div>; }

export default function AdminPage(){
 const router=useRouter();
 const [currentUser,setCurrentUser]=useState<AdminSession|null>(null);
 const [authReady,setAuthReady]=useState(false);
 const [tab,setTab]=useState<Tab>("overview");
 const [announcements,setAnnouncements]=useState<Announcement[]>(seedAnnouncements);
 const [students,setStudents]=useState<Student[]>(seedStudents);
 const [admins,setAdmins]=useState<Admin[]>([]);
 const [departments,setDepartments]=useState<Department[]>(seedDepartments);
 const [query,setQuery]=useState("");
 const [showForm,setShowForm]=useState(false);
 const [savingAnnouncement,setSavingAnnouncement]=useState(false);
 const [editing,setEditing]=useState<string|number|null>(null);
 const [draft,setDraft]=useState({title:"",category:"ประกาศ",department:"ประชาสัมพันธ์กลาง",body:"",eventDate:"",eventTime:"",eventLocation:"",eventLink:"",pinned:false,comments:false,image:"",targetCohorts:["all"],urgency:"normal" as "normal"|"urgent",actionLine:"",channels:["เว็บไซต์"],reminderDays:[14,7,3]});
 const [studentDraft,setStudentDraft]=useState({studentCode:"",name:"",department:"วิทยาการคอมพิวเตอร์",year:1});
 const [adminDraft,setAdminDraft]=useState({username:"",name:"",password:"",role:"editor" as Admin["role"]});
 const [departmentDraft,setDepartmentDraft]=useState({name:"",short:""});
 const [notice,setNotice]=useState("");
 const [loaded,setLoaded]=useState(false);
 const [clock,setClock]=useState(Date.now());
 const [dataMode,setDataMode]=useState<"demo"|"database">("demo");
 const [dbTopics,setDbTopics]=useState<{id:string;slug:string;name:string}[]>([]);
 const [dbCohorts,setDbCohorts]=useState<{id:string;code:string;label:string}[]>([]);
 const [dbStudents,setDbStudents]=useState<VerifiedStudent[]>([]);
 const [studentCohortSelection,setStudentCohortSelection]=useState<Record<string,string>>({});
 const [linkDrafts,setLinkDrafts]=useState<{label:string;url:string}[]>([{label:"",url:""}]);
 const [publishConfirmation,setPublishConfirmation]=useState<{id:string|number;mode:"publish"|"queue"}|null>(null);

 useEffect(()=>{
  setStudents(readStore("science-admin-students",seedStudents));
  setDepartments(readStore("science-admin-departments",seedDepartments));
  const load=async()=>{
   if(!isSupabaseConfigured()){
    setAnnouncements(readStore("science-admin-announcements",seedAnnouncements));
    const demoSession=readStore<AdminSession|null>("science-demo-admin-session",null);
    if(demoSession && demoSession.role==="superadmin") setCurrentUser(demoSession);
    setAdmins(readStore<Admin[]>("science-demo-admins",[]));
    setLoaded(true);setAuthReady(true);return;
   }
   try{
    const supabase=createClient();
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){
     setAnnouncements(readStore("science-admin-announcements",seedAnnouncements));
     setLoaded(true);setAuthReady(true);return;
    }
    const {data:profile,error:profileError}=await supabase.from("profiles").select("email,full_name,role,is_active").eq("id",user.id).single();
    if(profileError||!profile||!profile.is_active||profile.role==="student"){
     setAnnouncements(readStore("science-admin-announcements",seedAnnouncements));
     setLoaded(true);setAuthReady(true);return;
    }
    const mappedRole=profile.role==="superadmin"?"superadmin":profile.role==="admin"?"editor":"viewer";
    setCurrentUser({id:-1,username:profile.email||user.email||"",name:profile.full_name||user.email||"บุคลากร",role:mappedRole});
    const [{data:staffRows},{data:topicRows},{data:cohortRows}]=await Promise.all([
      supabase.from("profiles").select("id,email,full_name,role").in("role",["admin","superadmin"]),
      supabase.from("topics").select("id,slug,name").eq("is_active",true).order("sort_order"),
      supabase.from("cohorts").select("id,code,label").eq("is_active",true).order("code"),
    ]);
    setAdmins((staffRows||[]).map((item:{id:string;email:string|null;username?:string|null;full_name:string|null;role:string})=>({id:item.id,username:item.username||item.email||"",name:item.full_name||item.username||"บุคลากร",role:item.role==="admin"?"editor":item.role as Admin["role"]})));
    setDbTopics(topicRows||[]);setDbCohorts(cohortRows||[]);
    const studentResponse=await fetch("/api/admin/students",{cache:"no-store"});
    if(studentResponse.ok){const studentPayload=await studentResponse.json();setDbStudents(studentPayload.data||[]);setDbCohorts(studentPayload.cohorts||cohortRows||[]);}
    try{
     const rows=await fetchDatabaseAnnouncements();
     setAnnouncements(rows);setDataMode("database");
    }catch(error){
     console.error("Announcement database load failed",error);
     setAnnouncements(readStore("science-admin-announcements",seedAnnouncements));
     setDataMode("demo");
     setNotice("เชื่อมบัญชีแล้ว แต่ยังอ่านตารางประกาศไม่ได้ ตรวจว่าได้รัน Supabase migration แล้ว");
    }
   }catch(error){
    console.error("Admin authentication check failed",error);
    setAnnouncements(readStore("science-admin-announcements",seedAnnouncements));
    setDataMode("demo");
   }finally{setLoaded(true);setAuthReady(true);}
  };
  void load();
 },[]);
 useEffect(()=>{if(!loaded||dataMode!=="demo")return;localStorage.setItem("science-admin-announcements",JSON.stringify(announcements));},[announcements,loaded,dataMode]);
 useEffect(()=>{if(!loaded)return;localStorage.setItem("science-admin-students",JSON.stringify(students));},[students,loaded]);
 useEffect(()=>{if(!loaded)return;localStorage.setItem("science-admin-departments",JSON.stringify(departments));},[departments,loaded]);
 useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),1000);return()=>window.clearInterval(timer)},[]);
 useEffect(()=>{
  if(dataMode!=="database")return;
  const refresh=()=>void fetchDatabaseAnnouncements().then(setAnnouncements).catch(error=>console.error("Announcement refresh failed",error));
  refresh();const timer=window.setInterval(refresh,15000);
  return()=>window.clearInterval(timer);
 },[dataMode]);
 useEffect(()=>{
  if(dataMode!=="demo")return;
  const publishDue=()=>{
   const current=Date.now();
   setAnnouncements(xs=>{
    let changed=false;
    const next=xs.map(a=>{
     if(a.status==="pending"&&a.postAt&&a.postAt<=current){
      changed=true;
      return {...a,status:"published" as const,postAt:undefined,activityLog:[...(a.activityLog||[]),new Date(current).toLocaleString("th-TH")+" · ครบ 10 นาที ระบบต้นแบบเผยแพร่อัตโนมัติ"]};
     }
     return a;
    });
    return changed?next:xs;
   });
  };
  publishDue();const timer=window.setInterval(publishDue,1000);
  return()=>window.clearInterval(timer);
 },[dataMode]);

 const published=announcements.filter(a=>a.status==="published").length;
 const totalViews=announcements.reduce((sum,a)=>sum+a.views,0);
 const filtered=useMemo(()=>announcements.filter(a=>(a.title+" "+a.category+" "+a.department).toLowerCase().includes(query.toLowerCase())),[announcements,query]);
 const isSuperAdmin=currentUser?.role==="superadmin";
 const canEditAnnouncements=isSuperAdmin||currentUser?.role==="editor";
 const canPublishAnnouncements=Boolean(currentUser&&(currentUser.role==="superadmin"||currentUser.role==="editor"));
 const visibleTabs=!currentUser?tabs.filter(t=>["overview","announcements","calendar"].includes(t.id)):isSuperAdmin?tabs:canEditAnnouncements?tabs.filter(t=>["overview","announcements","students","calendar"].includes(t.id)):tabs.filter(t=>["overview","announcements","calendar"].includes(t.id));
 const flash=(s:string)=>{setNotice(s);window.setTimeout(()=>setNotice(""),2600)};
 const startNew=()=>{if(!canEditAnnouncements){flash("บัญชีนี้ไม่มีสิทธิ์สร้างประกาศ");return}setEditing(null);setLinkDrafts([{label:"",url:""}]);setDraft({title:"",category:"ประกาศ",department:departments[0]?.name||"ประชาสัมพันธ์กลาง",body:"",eventDate:"",eventTime:"",eventLocation:"",eventLink:"",pinned:false,comments:false,image:"",targetCohorts:["all"],urgency:"normal",actionLine:"",channels:["เว็บไซต์"],reminderDays:[14,7,3]});setShowForm(true)};
 const editAnnouncement=(a:Announcement)=>{if(!canEditAnnouncements){flash("บัญชีนี้ไม่มีสิทธิ์แก้ไขประกาศ");return}setEditing(a.id);setLinkDrafts((a.links?.length?a.links.map(x=>({label:x.label,url:x.url})):(a.eventLink?[{label:"ลิงก์ที่เกี่ยวข้อง",url:a.eventLink}]:[{label:"",url:""}])));setDraft({title:a.title,category:a.category,department:a.department,body:a.body,eventDate:a.eventDate,eventTime:a.eventTime||"",eventLocation:a.eventLocation||"",eventLink:a.eventLink||"",pinned:a.pinned,comments:a.comments,image:a.image||"",targetCohorts:a.targetCohorts||["all"],urgency:a.urgency||"normal",actionLine:a.actionLine||"",channels:a.channels||["เว็บไซต์"],reminderDays:a.reminderDays||[]});setShowForm(true)};
 const saveAnnouncement=async()=>{
  if(savingAnnouncement)return;
  setSavingAnnouncement(true);
  try{
  if(!draft.title.trim()||!draft.body.trim()){flash("กรุณากรอกหัวข้อและรายละเอียดประกาศ");return}
  const links=linkDrafts.filter(link=>link.label.trim()||link.url.trim());
  if(links.some(link=>!link.label.trim()||!/^https:\/\//i.test(link.url.trim()))){flash("ลิงก์ทุกช่องต้องมีชื่อ และ URL ต้องขึ้นต้นด้วย https://");return}
  if(dataMode==="database"){
   const topicSlug:Record<string,string>={"ประกาศ":"general","ประกาศทั่วไป":"general","ข่าวสาร":"general","การเรียน":"academic","ทุนการศึกษา":"scholarship","กยศ.":"student-loan","การยื่นเรื่องจบ":"graduation","กิจกรรม":"activities"};
   const wantedSlug=topicSlug[draft.category]||"general";
   const topic=dbTopics.find(x=>x.slug===wantedSlug)||dbTopics.find(x=>x.name===draft.category);
   if(!topic){flash("ไม่พบหัวข้อประกาศนี้ในฐานข้อมูล โปรดตรวจ migration หรือตั้งค่าหัวข้อ");return}
   const selectedCohorts=draft.targetCohorts.includes("all")?dbCohorts:dbCohorts.filter(x=>draft.targetCohorts.includes(x.code));
   if(!selectedCohorts.length){flash("กรุณาเลือกอย่างน้อยหนึ่งรุ่นที่มีอยู่ในฐานข้อมูล");return}
   try{
    const endpoint=editing!==null?"/api/announcements/"+encodeURIComponent(String(editing)):"/api/announcements";
    const response=await fetch(endpoint,{method:editing!==null?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      title:draft.title,body:draft.body,topicId:topic.id,cohortIds:selectedCohorts.map(x=>x.id),
      links:links.map(x=>({label:x.label,url:x.url})),isUrgent:draft.urgency==="urgent",
      eventDate:draft.eventDate||null,eventTime:draft.eventTime||null,eventLocation:draft.eventLocation||null,
      department:draft.department,actionLine:draft.actionLine,channels:draft.channels,
      reminderDays:draft.reminderDays
    })});
    const payload=await response.json();
    if(!response.ok)throw new Error(payload.error||"ไม่สามารถบันทึกประกาศได้");
    setAnnouncements(await fetchDatabaseAnnouncements());
    flash(editing!==null?"แก้ไขฉบับร่างแล้ว บันทึกการแก้ไขแล้ว":"สร้างประกาศฉบับร่างในฐานข้อมูลแล้ว");
    setShowForm(false);setEditing(null);setLinkDrafts([{label:"",url:""}]);return;
   }catch(error){flash(error instanceof Error?error.message:"บันทึกประกาศไม่สำเร็จ");return}
  }
  if(editing!==null){setAnnouncements(xs=>xs.map(a=>a.id===editing?{...a,...draft,eventLink:links[0]?.url||"",links,status:"draft",postAt:undefined,approvedBy:undefined,activityLog:appendLog(a,"แก้ไขเนื้อหาแล้ว บันทึกการแก้ไขแล้ว")}:a));flash("บันทึกประกาศที่แก้ไขแล้ว")}
  else{setAnnouncements(xs=>[{...draft,eventLink:links[0]?.url||"",links,id:Date.now(),status:"draft",date:new Date().toISOString().slice(0,10),views:0},...xs]);flash("เพิ่มประกาศฉบับร่างแล้ว")}
  setShowForm(false);
  }catch(error){flash(error instanceof Error?error.message:"เกิดข้อผิดพลาดระหว่างบันทึกประกาศ");}
  finally{setSavingAnnouncement(false)}
 };
 const appendLog=(a:Announcement,message:string)=>[...(a.activityLog||[]),`${new Date().toLocaleString('th-TH')} · ${message}`];
 const queueAnnouncement=async(id:string|number)=>{
  if(!canEditAnnouncements){flash("เฉพาะเลขาหลักสูตรหรือผู้ดูแลสูงสุดเท่านั้นที่ส่งประกาศเข้าคิวได้");return}
  const item=announcements.find(a=>a.id===id);
  if(dataMode==="database"){
   try{
    const response=await fetch("/api/announcements/"+encodeURIComponent(String(id))+"/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"queue"})});
    const payload=await response.json();if(!response.ok)throw new Error(payload.error||"ส่งเข้าคิวไม่สำเร็จ");
    setAnnouncements(await fetchDatabaseAnnouncements());flash("ส่งประกาศเข้าคิวรอ 10 นาทีฝั่งเซิร์ฟเวอร์แล้ว");return;
   }catch(error){flash(error instanceof Error?error.message:"ส่งเข้าคิวไม่สำเร็จ");return}
  }
  if(!item){flash("ไม่พบประกาศที่ต้องการโพสต์");return}
  const postAt=Date.now()+10*60*1000;
  setAnnouncements(xs=>xs.map(a=>a.id===id?{...a,status:"pending",postAt,activityLog:appendLog(a,"ตั้งเวลาเผยแพร่ล่วงหน้า 10 นาที")}:a));
  flash("ตั้งเวลาเผยแพร่ล่วงหน้า 10 นาทีแล้ว (โหมดตัวอย่าง)");
 };
 const approveNow=async(id:string|number)=>{
  if(!canPublishAnnouncements){flash("กรุณาเข้าสู่ระบบบุคลากรก่อนอนุมัติ");return}
  if(dataMode==="database"){
   try{
    const response=await fetch("/api/announcements/"+encodeURIComponent(String(id))+"/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"publish_now"})});
    const payload=await response.json();if(!response.ok)throw new Error(payload.error||"อนุมัติไม่สำเร็จ");
    setAnnouncements(await fetchDatabaseAnnouncements());flash("อนุมัติและเผยแพร่จากฐานข้อมูลแล้ว");return;
   }catch(error){flash(error instanceof Error?error.message:"อนุมัติไม่สำเร็จ");return}
  }
  const item=announcements.find(a=>a.id===id);
  if(!item){flash("ไม่พบประกาศที่ต้องการอนุมัติ");return}
  setAnnouncements(xs=>xs.map(a=>a.id===id?{...a,status:"published",postAt:undefined,approvedBy:currentUser?.name||"ผู้อนุมัติ",activityLog:appendLog(a, currentUser?.name+" อนุมัติและเผยแพร่ทันที")}:a));
  flash("อนุมัติและเผยแพร่ทันทีแล้ว");
 };
 const suspendAnnouncement=async(id:string|number)=>{
  if(!canPublishAnnouncements){flash("กรุณาเข้าสู่ระบบบุคลากรก่อนระงับ");return}
  if(dataMode==="database"){
   try{
    const response=await fetch("/api/announcements/"+encodeURIComponent(String(id))+"/action",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"suspend"})});
    const payload=await response.json();if(!response.ok)throw new Error(payload.error||"ระงับประกาศไม่สำเร็จ");
    setAnnouncements(await fetchDatabaseAnnouncements());flash("ระงับประกาศแล้ว กลับเป็นฉบับร่าง");return;
   }catch(error){flash(error instanceof Error?error.message:"ระงับประกาศไม่สำเร็จ");return}
  }
  setAnnouncements(xs=>xs.map(a=>a.id===id?{...a,status:"draft",postAt:undefined,activityLog:appendLog(a,"ระงับการโพสต์และส่งกลับเป็นฉบับร่าง")}:a));
  flash("ระงับแล้ว ข่าวกลับเป็นฉบับร่าง");
 };
 const requestPublishConfirmation=(id:string|number,mode:"publish"|"queue")=>setPublishConfirmation({id,mode});
 const confirmPublishAction=()=>{
  if(!publishConfirmation)return;
  if(publishConfirmation.mode==="queue")void queueAnnouncement(publishConfirmation.id);else void approveNow(publishConfirmation.id);
  setPublishConfirmation(null);
 };
 const setStatus=(id:string|number,status:Announcement["status"])=>{if(!canEditAnnouncements){flash("บัญชีนี้ไม่มีสิทธิ์เปลี่ยนสถานะประกาศ");return}setAnnouncements(xs=>xs.map(a=>a.id===id?{...a,status,postAt:undefined,activityLog:appendLog(a,status==="draft"?"ย้ายกลับเป็นฉบับร่าง":"เปลี่ยนสถานะเป็นเผยแพร่")}:a));flash(status==="published"?"เผยแพร่ประกาศแล้ว":"ย้ายเป็นฉบับร่างแล้ว")};
 const toggleAnnouncement=(id:string|number,key:"pinned"|"comments")=>setAnnouncements(xs=>xs.map(a=>a.id===id?{...a,[key]:!a[key]}:a));
 const deleteAnnouncement=(id:string|number)=>{if(!isSuperAdmin){flash("เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่ลบประกาศได้");return}if(confirm("ยืนยันลบประกาศนี้?"))setAnnouncements(xs=>xs.filter(a=>a.id!==id))};
 const handleImage=(file?:File)=>{if(!file)return;if(!file.type.startsWith("image/")){flash("กรุณาเลือกไฟล์รูปภาพ");return}if(file.size>900000){flash("รูปภาพต้องมีขนาดไม่เกิน 900 KB ในต้นแบบนี้");return}const reader=new FileReader();reader.onload=()=>setDraft(d=>({...d,image:String(reader.result)}));reader.readAsDataURL(file)};
 const addStudent=()=>{if(!isSuperAdmin){flash("เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่จัดการบัญชีนักศึกษาได้");return}if(!studentDraft.studentCode.trim()||!studentDraft.name.trim()){flash("กรอกข้อมูลนักศึกษาให้ครบ");return}setStudents(xs=>[{...studentDraft,id:Date.now(),status:"active"},...xs]);setStudentDraft({studentCode:"",name:"",department:departments[0]?.name||"",year:1});flash("เพิ่มข้อมูลตัวอย่างแล้ว")};
 const addAdmin=async()=>{
  if(!isSuperAdmin){flash("เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่เพิ่มบัญชีได้");return}
  const username=adminDraft.username.trim().toLowerCase();
  if(!username||!adminDraft.name.trim()||!adminDraft.password){flash("กรอกชื่อ ชื่อบัญชี และรหัสผ่านให้ครบ");return}
  if(!/^[a-z0-9._-]{3,32}$/.test(username)){flash("ชื่อบัญชีต้องมี 3–32 ตัว ใช้ a-z, 0-9, จุด ขีด หรือขีดล่าง");return}
  if(adminDraft.password.length<8){flash("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");return}
  if(!isSupabaseConfigured()){flash("ต้องเชื่อมต่อ Supabase และตั้งค่า Service Role ก่อนสร้างบัญชีจริง");return}
  try{
   const response=await fetch("/api/admin/accounts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,name:adminDraft.name.trim(),password:adminDraft.password,role:adminDraft.role==="superadmin"?"superadmin":"admin"})});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error||"สร้างบัญชีแอดมินไม่สำเร็จ");
   setAdmins(xs=>[{id:payload.data.id,username:payload.data.username,name:payload.data.name,role:payload.data.role==="admin"?"editor":"superadmin"},...xs]);
   setAdminDraft({username:"",name:"",password:"",role:"editor"});flash("สร้างบัญชีแอดมินจริงใน Supabase แล้ว สามารถเข้าสู่ระบบด้วยชื่อบัญชีและรหัสผ่านได้");
  }catch(error){flash(error instanceof Error?error.message:"สร้างบัญชีแอดมินไม่สำเร็จ")}
 };
 const deleteAdmin=(id:number)=>{if(!isSuperAdmin)return;setAdmins(xs=>xs.filter(a=>a.id!==id));flash("บัญชีในฐานข้อมูลต้องจัดการผ่านการปิดใช้งานโปรไฟล์")};
 const changeStaffRole=async(id:string,role:"admin"|"superadmin")=>{if(!isSuperAdmin){flash("เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่เปลี่ยนบทบาทได้");return}try{const supabase=createClient();const {error}=await supabase.from("profiles").update({role}).eq("id",id);if(error)throw error;setAdmins(xs=>xs.map(a=>a.id===id?{...a,role:role==="admin"?"editor":role}:a));flash("บันทึกบทบาทบุคลากรแล้ว")}catch(error){flash(error instanceof Error?error.message:"ไม่สามารถเปลี่ยนบทบาทได้")}};
 const refreshStudentRoster=async()=>{
  const response=await fetch("/api/admin/students",{cache:"no-store"});
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.error||"โหลดรายชื่อนักศึกษาไม่สำเร็จ");
  setDbStudents(payload.data||[]);
  setDbCohorts(payload.cohorts||[]);
 };
 const verifyStudentCohort=async(profileId:string)=>{
  const cohortId=studentCohortSelection[profileId];
  if(!cohortId){flash("กรุณาเลือกรุ่นก่อนยืนยัน");return}
  try{
   const response=await fetch("/api/admin/students",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileId,cohortId})});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error||"ยืนยันรุ่นไม่สำเร็จ");
   await refreshStudentRoster();flash("ยืนยันรุ่นนักศึกษาแล้ว");
  }catch(error){flash(error instanceof Error?error.message:"ยืนยันรุ่นไม่สำเร็จ")}
 };
 const unverifyStudentCohort=async(profileId:string,cohortId:string)=>{
  if(!confirm("ถอนการยืนยันรุ่นนี้ใช่หรือไม่? นักศึกษาจะไม่ได้รับประกาศที่ส่งเฉพาะรุ่นนี้"))return;
  try{
   const response=await fetch("/api/admin/students",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({profileId,cohortId})});
   const payload=await response.json();
   if(!response.ok)throw new Error(payload.error||"ถอนการยืนยันไม่สำเร็จ");
   await refreshStudentRoster();flash("ถอนการยืนยันรุ่นแล้ว");
  }catch(error){flash(error instanceof Error?error.message:"ถอนการยืนยันไม่สำเร็จ")}
 };
 const addDepartment=()=>{if(!isSuperAdmin){flash("เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่จัดการสาขาได้");return}if(!departmentDraft.name.trim()||!departmentDraft.short.trim()){flash("กรอกชื่อสาขาและตัวย่อ");return}setDepartments(xs=>[{...departmentDraft,id:Date.now()},...xs]);setDepartmentDraft({name:"",short:""});flash("เพิ่มสาขาแล้ว")};

 if(!authReady)return <main className="grid min-h-screen place-items-center bg-[#f4f9fb] text-sm font-semibold text-slate-500">กำลังโหลดระบบหลังบ้าน...</main>;
 const guestPreview=!currentUser;
 const displayName=currentUser?.name||"ผู้เข้าชม";
 return <main className="min-h-screen bg-[#f4f9fb] text-slate-800">
  <div className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
   <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-900 text-white"><Building2 size={22}/></div><div><p className="text-xs font-bold tracking-widest text-ocean-700">SCIENCE PR PORTAL</p><h1 className="text-lg font-black">ศูนย์จัดการระบบ</h1></div></div>
   <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-cyan-50 px-3 py-2 text-xs font-bold text-ocean-800">{guestPreview?"ผู้เข้าชม · โหมดดูข้อมูล":`${currentUser.name} · ${adminRoleLabel(currentUser?.role)}`}</span><Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:border-ocean-400"><ArrowLeft size={16}/> ดูหน้าเว็บไซต์</Link>{currentUser?<button onClick={async()=>{try{if(isSupabaseConfigured())await createClient().auth.signOut();}finally{localStorage.removeItem("science-demo-admin-session");router.replace("/login");router.refresh();}}} className="rounded-xl border border-rose-200 px-3 py-2.5 text-sm font-bold text-rose-700">ออกจากระบบ</button>:<Link href="/login?role=staff" className="rounded-xl bg-ocean-900 px-3 py-2.5 text-sm font-bold text-white">เข้าสู่ระบบหลังบ้าน</Link>}<span className="hidden rounded-full bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-800 sm:inline-flex">{guestPreview?"โหมดผู้เข้าชม":dataMode==="demo"?"Demo Mode · Local":"Supabase Auth"}</span></div>
  </div></div>
  <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
   <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-5">
    <p className="px-3 pb-3 pt-2 text-[11px] font-black uppercase tracking-[.18em] text-slate-400">Workspace</p>
    <nav className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">{visibleTabs.map(t=><button key={t.id} onClick={()=>{setTab(t.id);setShowForm(false)}} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab===t.id?"bg-ocean-900 text-white shadow-sm":"text-slate-600 hover:bg-cyan-50 hover:text-ocean-800"}`}>{t.icon}<span>{t.label}</span>{tab===t.id&&<ChevronRight className="ml-auto hidden lg:block" size={15}/>}</button>)}</nav>
    <div className="mt-4 hidden rounded-2xl bg-cyan-50 p-4 lg:block"><p className="text-xs font-bold text-ocean-900">ยืนยันตัวตนด้วย Supabase</p><p className="mt-1 text-xs leading-5 text-slate-500">{guestPreview?"ดูข้อมูลตัวอย่างได้โดยไม่ต้องเข้าสู่ระบบ การจัดการข้อมูลต้องล็อกอิน":"ข้อมูลประกาศในหน้าปัจจุบันยังเป็นข้อมูลตัวอย่างระหว่างเชื่อมฐานข้อมูล"}</p></div>
   </aside>
   <section className="min-w-0">
    {publishConfirmation&&<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="publish-confirm-title"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Bell size={22}/></div><h3 id="publish-confirm-title" className="text-xl font-black">{publishConfirmation.mode==="publish"?"ยืนยันอนุมัติและเผยแพร่":"ยืนยันตั้งเวลานับถอยหลัง 10 นาที"}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{publishConfirmation.mode==="publish"?"ประกาศจะเผยแพร่ทันทีหลังยืนยัน โดยไม่ต้องรอผู้ตรวจทาน":"ประกาศจะเริ่มนับถอยหลัง 10 นาที และระบบจะเผยแพร่อัตโนมัติเมื่อครบเวลา"}</p><div className="mt-6 flex justify-end gap-2"><button onClick={()=>setPublishConfirmation(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">ยกเลิก</button><button onClick={confirmPublishAction} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">ยืนยัน</button></div></div></div>}
    {notice&&<div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{notice}</div>}
    {tab==="overview"&&<><div className="mb-6"><p className="text-sm font-semibold text-ocean-700">ภาพรวมระบบ / Dashboard</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">สวัสดี {displayName}</h2><p className="mt-2 text-sm text-slate-500">ภาพรวมการประชาสัมพันธ์และการจัดการข้อมูลคณะวิทยาศาสตร์</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="ประกาศทั้งหมด" value={String(announcements.length)} sub={`เผยแพร่แล้ว ${published} รายการ`} icon={<FileText/>}/><Stat label="ยอดเข้าชมรวม" value={totalViews.toLocaleString("th-TH")} sub="รวมยอดจากข้อมูลตัวอย่าง" icon={<Eye/>}/><Stat label="บัญชีนักศึกษา" value={String(students.length)} sub="ข้อมูลจำลอง" icon={<Users/>}/><Stat label="กิจกรรมที่กำหนด" value={String(announcements.filter(a=>a.eventDate).length)} sub="มีวันจัดกิจกรรม" icon={<CalendarDays/>}/></div><div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_.7fr]"><div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="text-lg font-black">ประกาศล่าสุด</h3><p className="text-xs text-slate-400">รายการที่แก้ไขในระบบ</p></div><button onClick={()=>setTab("announcements")} className="text-sm font-bold text-ocean-700">ดูทั้งหมด</button></div><div className="mt-4 divide-y divide-slate-100">{announcements.slice(0,4).map(a=><div key={a.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{a.title}</p><p className="mt-1 text-xs text-slate-400">{a.category} · {a.date}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${a.status==="published"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{a.status==="published"?"เผยแพร่":a.status==="pending"?"รอเผยแพร่":"ฉบับร่าง"}</span></div>)}</div></div><div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><h3 className="text-lg font-black">ทางลัด</h3><div className="mt-4 grid gap-2">{canEditAnnouncements&&<Quick onClick={startNew} icon={<Plus size={17}/>} label="สร้างประกาศใหม่"/>}<Quick onClick={()=>setTab("calendar")} icon={<CalendarDays size={17}/>} label="ดูปฏิทินกิจกรรม"/>{isSuperAdmin&&<><Quick onClick={()=>setTab("analytics")} icon={<TrendingUp size={17}/>} label="ดูสถิติและอันดับ"/><Quick onClick={()=>setTab("students")} icon={<Users size={17}/>} label="จัดการนักศึกษา"/></>}</div></div></div></>}
    {tab==="announcements"&&<><Header title="จัดการประกาศ" desc="จัดการฉบับร่าง อนุมัติและเผยแพร่ได้ทันที หรือเลือกตั้งเวลานับถอยหลัง 10 นาที" action={canEditAnnouncements?<button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-4 py-3 text-sm font-bold text-white"><Plus size={17}/> สร้างประกาศ</button>:undefined}/>{showForm&&canEditAnnouncements&&<div className="mb-5 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h3 className="text-lg font-black">{editing?"แก้ไขประกาศ":"สร้างประกาศใหม่"}</h3><button onClick={()=>setShowForm(false)}><X/></button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="หัวข้อประกาศ"><input value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} className="input" placeholder="ระบุหัวข้อประกาศ"/></Field><Field label="หมวดหมู่"><select value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))} className="input">{["ประกาศ","ประกาศทั่วไป","การเรียน","ทุนการศึกษา","กยศ.","การยื่นเรื่องจบ","กิจกรรม","ข่าวสาร"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="หน่วยงาน / สาขา"><select value={draft.department} onChange={e=>setDraft(d=>({...d,department:e.target.value}))} className="input">{["ประชาสัมพันธ์กลาง",...departments.map(d=>d.name)].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="วันที่จัดกิจกรรม (ถ้ามี)"><input type="date" value={draft.eventDate} onChange={e=>setDraft(d=>({...d,eventDate:e.target.value}))} className="input"/></Field>
<Field label="เวลา / สถานที่"><div className="grid gap-2"><input value={draft.eventTime} onChange={e=>setDraft(d=>({...d,eventTime:e.target.value}))} className="input" placeholder="เวลา เช่น 09:00–16:00"/><input value={draft.eventLocation} onChange={e=>setDraft(d=>({...d,eventLocation:e.target.value}))} className="input" placeholder="สถานที่"/></div></Field><Field label="ลิงก์แนบ (เพิ่มได้หลายลิงก์)" wide><div className="grid gap-2">{linkDrafts.map((link,index)=><div key={index} className="grid gap-2 sm:grid-cols-[.7fr_1.3fr_auto]"><input className="input" value={link.label} onChange={e=>setLinkDrafts(xs=>xs.map((item,i)=>i===index?{...item,label:e.target.value}:item))} placeholder="ชื่อ เช่น แบบฟอร์มสมัคร"/><input className="input" value={link.url} onChange={e=>setLinkDrafts(xs=>xs.map((item,i)=>i===index?{...item,url:e.target.value}:item))} placeholder="https://..."/><button type="button" onClick={()=>setLinkDrafts(xs=>xs.length>1?xs.filter((_,i)=>i!==index):[{label:"",url:""}])} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-rose-600">ลบ</button></div>)}<button type="button" onClick={()=>setLinkDrafts(xs=>[...xs,{label:"",url:""}])} className="w-fit rounded-xl border border-cyan-200 px-3 py-2 text-xs font-bold text-ocean-800">+ เพิ่มลิงก์</button></div><p className="mt-1 text-xs text-slate-400">ระบบจะรับเฉพาะ URL ที่ขึ้นต้นด้วย https://</p></Field>
<Field label="กลุ่มเป้าหมาย (รุ่น)" wide><div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 p-3 text-sm">{["all","66","67","68","69","70"].map(cohort=><label key={cohort} className="flex items-center gap-2"><input type="checkbox" checked={draft.targetCohorts.includes(cohort)} onChange={e=>setDraft(d=>({...d,targetCohorts:cohort==="all"?(e.target.checked?["all"]:[]):e.target.checked?[...d.targetCohorts.filter(x=>x!=="all"),cohort]:d.targetCohorts.filter(x=>x!==cohort)}))}/>{cohort==="all"?"ทุกรุ่น":`รุ่น ${cohort}`}</label>)}</div><p className="mt-1 text-xs text-slate-400">เลือกได้หลายรุ่น เพื่อป้องกันการประกาศไม่ครบกลุ่ม</p></Field>
<Field label="ระดับความเร่งด่วน"><select value={draft.urgency} onChange={e=>setDraft(d=>({...d,urgency:e.target.value as "normal"|"urgent"}))} className="input"><option value="normal">ข่าวปกติ</option><option value="urgent">ข่าวด่วน (ต้องยืนยันก่อนเผยแพร่)</option></select></Field>
<Field label="สิ่งที่นักศึกษาต้องทำ (บรรทัดแรก)" wide><input value={draft.actionLine} onChange={e=>setDraft(d=>({...d,actionLine:e.target.value}))} className="input" placeholder="ใครต้องทำอะไร ภายในเมื่อไร"/></Field>
<Field label="ช่องทางประชาสัมพันธ์"><div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 p-3 text-sm">{["เว็บไซต์","LINE","Facebook"].map(channel=><label key={channel} className="flex items-center gap-2"><input type="checkbox" checked={draft.channels.includes(channel)} onChange={e=>setDraft(d=>({...d,channels:e.target.checked?[...d.channels,channel]:d.channels.filter(x=>x!==channel)}))}/>{channel}</label>)}</div><p className="mt-1 text-xs text-slate-400">LINE / Facebook เป็นตัวอย่างช่องทาง ต้องยืนยันช่องทางที่หลักสูตรใช้จริง</p></Field>
<Field label="แจ้งเตือนล่วงหน้าก่อนกำหนด"><div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 p-3 text-sm">{[14,7,3].map(day=><label key={day} className="flex items-center gap-2"><input type="checkbox" checked={draft.reminderDays.includes(day)} onChange={e=>setDraft(d=>({...d,reminderDays:e.target.checked?[...d.reminderDays,day]:d.reminderDays.filter(x=>x!==day)}))}/>{day} วัน</label>)}</div></Field><Field label="รายละเอียดประกาศ" wide><textarea rows={5} value={draft.body} onChange={e=>setDraft(d=>({...d,body:e.target.value}))} className="input" placeholder="เขียนรายละเอียดประกาศ..."/></Field><Field label="ภาพประกอบ"><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-sm font-semibold text-slate-600"><Upload size={17}/> เลือกรูปภาพ<input type="file" accept="image/*" className="hidden" onChange={e=>handleImage(e.target.files?.[0])}/></label>{draft.image&&<img src={draft.image} alt="ตัวอย่างภาพประกาศ" className="mt-2 h-28 rounded-xl object-cover"/>}</Field></div><div className="mt-4 flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.pinned} onChange={e=>setDraft(d=>({...d,pinned:e.target.checked}))}/> ปักหมุดประกาศ</label><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={draft.comments} onChange={e=>setDraft(d=>({...d,comments:e.target.checked}))}/> เปิดให้แสดงความคิดเห็น</label></div><div className="mt-5 flex justify-end gap-2"><button onClick={()=>setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">ยกเลิก</button><button onClick={()=>void saveAnnouncement()} disabled={savingAnnouncement} className="rounded-xl bg-ocean-900 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{savingAnnouncement?"กำลังบันทึก...":"บันทึกเป็นฉบับร่าง"}</button></div></div>}<div className="mb-4 flex flex-wrap items-center gap-3"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหาประกาศ..." className="input pl-10"/></div><span className="text-xs text-slate-400">{filtered.length} รายการ</span></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">{filtered.map(a=><div key={a.id} className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex min-w-0 gap-3">{a.image?<img src={a.image} alt="" className="h-16 w-16 rounded-xl object-cover"/>:<div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-50 text-ocean-700"><FileText/></div>}<div className="min-w-0"><p className="font-bold leading-6">{a.title}</p><p className="mt-1 text-xs text-slate-400">{a.category} · {a.department} · {a.date} · {a.views.toLocaleString()} views</p>{a.actionLine&&<p className="mt-1 text-xs font-semibold text-ocean-800">{a.actionLine}</p>}{(a.activityLog||[]).length>0&&<p className="mt-1 text-[11px] text-slate-400">ประวัติล่าสุด: {(a.activityLog||[])[(a.activityLog||[]).length-1]}</p>}<div className="mt-2 flex flex-wrap gap-2">{a.pinned&&<Tag>ปักหมุด</Tag>}<Tag>{a.comments?"เปิดคอมเมนต์":"ปิดคอมเมนต์"}</Tag><Tag>{a.status==="published"?"เผยแพร่":a.status==="pending"?"รอเผยแพร่":"ฉบับร่าง"}</Tag>{a.urgency==="urgent"&&<Tag>ด่วน</Tag>}<Tag>กลุ่ม: {(a.targetCohorts||["all"]).includes("all")?"ทุกรุ่น":(a.targetCohorts||[]).map(x=>"รุ่น "+x).join(", ")}</Tag>{(a.reminderDays||[]).length>0&&<Tag>เตือน {(a.reminderDays||[]).join("/")} วัน</Tag>}{a.status==="pending"&&<span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900"><span className="text-[10px] font-bold uppercase tracking-wider">เผยแพร่ในอีก</span><span className="font-mono text-lg font-black tabular-nums">{String(Math.floor(Math.max(0,(a.postAt||clock)-clock)/60000)).padStart(2,"0")}:{String(Math.floor((Math.max(0,(a.postAt||clock)-clock)%60000)/1000)).padStart(2,"0")}</span><span className="text-[10px] font-semibold">นาที : วินาที</span></span>}</div></div></div><div className="flex flex-wrap gap-2">{canEditAnnouncements&&<><button title="แก้ไข" onClick={()=>editAnnouncement(a)} className="iconbtn"><Pencil size={16}/></button><button title="ปักหมุด" onClick={()=>toggleAnnouncement(a.id,"pinned")} className={`iconbtn ${a.pinned?"text-amber-600":""}`}><Pin size={16}/></button><button title="เปิด/ปิดคอมเมนต์" onClick={()=>toggleAnnouncement(a.id,"comments")} className="iconbtn"><MessageCircle size={16}/></button>{a.status==="draft"&&<button onClick={()=>requestPublishConfirmation(a.id,"queue")} className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-bold text-ocean-800">ส่งเข้ารอ 10 นาที</button>}{a.status==="published"&&<button onClick={()=>setStatus(a.id,"draft")} className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-bold text-ocean-800">ย้ายเป็นร่าง</button>}</>}{canPublishAnnouncements&&(a.status==="draft"||a.status==="pending")&&<button onClick={()=>requestPublishConfirmation(a.id,"publish")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">{a.status==="pending"?"อนุมัติและโพสต์ทันที":"อนุมัติทันที"}</button>}{canPublishAnnouncements&&a.status==="pending"&&<button onClick={()=>suspendAnnouncement(a.id)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">ระงับ</button>}{isSuperAdmin&&<button onClick={()=>deleteAnnouncement(a.id)} className="iconbtn text-rose-600"><Trash2 size={16}/></button>}</div></div>)}</div></>}
    {tab==="students"&&<><Header title="จัดการนักศึกษาและรุ่น" desc="ตรวจสอบบัญชีอีเมลและยืนยันรุ่นจากรายชื่อที่หลักสูตรรับรอง"/><div className="mb-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-ocean-900">รุ่นที่ยืนยันในหน้านี้จะถูกใช้เป็นเกณฑ์ส่งประกาศและอีเมล นักศึกษาไม่สามารถเลือกหรือยืนยันรุ่นของตนเองได้ บัญชีจะแสดงที่นี่หลังนักศึกษาเข้าสู่ระบบครั้งแรก</div><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-500">บัญชีนักศึกษาที่ลงทะเบียนแล้ว {dbStudents.length} บัญชี</p><button onClick={()=>refreshStudentRoster().catch(e=>flash(e.message))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">รีเฟรชรายชื่อ</button></div><div className="grid gap-3">{dbStudents.map(student=><div key={student.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{student.full_name||"ยังไม่ได้ระบุชื่อ"}</p><p className="mt-1 break-all text-xs text-slate-500">{student.email||"ไม่มีอีเมล"}</p></div><Tag>{student.is_active?"บัญชีใช้งาน":"บัญชีถูกระงับ"}</Tag></div><div className="mt-4"><p className="text-xs font-bold text-slate-500">รุ่นที่ยืนยันแล้ว</p><div className="mt-2 flex flex-wrap gap-2">{(student.student_cohort_memberships||[]).filter(x=>x.verified_at&&x.cohort).map(item=><span key={item.cohort!.id} className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold text-ocean-900">{item.cohort!.label}<button type="button" onClick={()=>unverifyStudentCohort(student.id,item.cohort!.id)} className="text-rose-600" title="ถอนการยืนยัน">×</button></span>)}{!(student.student_cohort_memberships||[]).some(x=>x.verified_at)&&<span className="text-xs text-amber-700">ยังไม่มีรุ่นที่ยืนยัน — จะยังไม่ได้รับประกาศเฉพาะรุ่น</span>}</div></div>{(isSuperAdmin||currentUser?.role==="editor")&&<div className="mt-4 flex flex-col gap-2 sm:flex-row"><select className="input sm:max-w-xs" value={studentCohortSelection[student.id]||""} onChange={e=>setStudentCohortSelection(v=>({...v,[student.id]:e.target.value}))}><option value="">เลือกรุ่นจากทะเบียนหลักสูตร</option>{dbCohorts.map(cohort=><option key={cohort.id} value={cohort.id}>{cohort.label}</option>)}</select><button onClick={()=>verifyStudentCohort(student.id)} disabled={!studentCohortSelection[student.id]} className="rounded-xl bg-ocean-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">ยืนยันรุ่นนักศึกษา</button></div>}</div>)}</div>{dbStudents.length===0&&<div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm leading-6 text-slate-500">ยังไม่มีบัญชีนักศึกษาในฐานข้อมูล เมื่อผู้เรียนเข้าสู่ระบบด้วยอีเมล บัญชีจะปรากฏให้เจ้าหน้าที่ตรวจสอบที่นี่</div>}</>}{tab==="admins"&&<><Header title="จัดการบัญชีผู้ดูแล" desc="สร้างบัญชีแอดมินโดยตรง ไม่ต้องสมัครสมาชิกหรือยืนยันผ่านอีเมล"/>{isSuperAdmin&&<form onSubmit={e=>{e.preventDefault();void addAdmin()}} className="mb-5 grid gap-3 rounded-3xl border border-cyan-200 bg-white p-5 shadow-sm sm:grid-cols-2"><div className="sm:col-span-2"><h3 className="font-black">เพิ่มบัญชีแอดมินใหม่</h3><p className="mt-1 text-xs text-slate-500">บัญชีจะถูกสร้างใน Supabase Auth โดยใช้ชื่อบัญชีภายใน ไม่ส่งอีเมลยืนยัน</p></div><label className="text-xs font-bold text-slate-600">ชื่อที่แสดง<input className="input mt-2" required value={adminDraft.name} onChange={e=>setAdminDraft(v=>({...v,name:e.target.value}))} placeholder="ชื่อผู้ดูแล"/></label><label className="text-xs font-bold text-slate-600">ชื่อบัญชี<input className="input mt-2" required minLength={3} maxLength={32} autoComplete="off" value={adminDraft.username} onChange={e=>setAdminDraft(v=>({...v,username:e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g,"")}))} placeholder="เช่น admin01"/></label><label className="text-xs font-bold text-slate-600">รหัสผ่าน<input className="input mt-2" required minLength={8} type="password" autoComplete="new-password" value={adminDraft.password} onChange={e=>setAdminDraft(v=>({...v,password:e.target.value}))} placeholder="อย่างน้อย 8 ตัวอักษร"/></label><label className="text-xs font-bold text-slate-600">ระดับสิทธิ์<select className="input mt-2" value={adminDraft.role} onChange={e=>setAdminDraft(v=>({...v,role:e.target.value as Admin["role"]}))}><option value="editor">แอดมิน / ผู้อนุมัติ</option><option value="superadmin">ผู้ดูแลระบบสูงสุด</option></select></label><div className="sm:col-span-2"><button type="submit" className="rounded-xl bg-ocean-900 px-5 py-3 text-sm font-bold text-white"><Plus className="mr-1 inline" size={16}/> สร้างบัญชีแอดมิน</button></div></form>}<div className="mb-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-6 text-ocean-900">เฉพาะผู้ดูแลระบบสูงสุดเท่านั้นที่สร้างบัญชีหรือเปลี่ยนสิทธิ์ได้ ชื่อบัญชีไม่ใช่อีเมลและใช้เข้าสู่ระบบหลังบ้านได้โดยตรง</div><div className="grid gap-3 md:grid-cols-2">{admins.map(a=><div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{a.name}</p><p className="mt-1 text-xs text-slate-400">{a.username}</p><span className="mt-2 inline-block rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-ocean-800">{a.role==="editor"?"แอดมิน / ผู้อนุมัติ":"ผู้ดูแลระบบสูงสุด"}</span></div>{isSuperAdmin&&typeof a.id==="string"&&<select className="input max-w-xs" value={a.role==="editor"?"admin":a.role} onChange={e=>changeStaffRole(a.id as string,e.target.value as "admin"|"superadmin")}><option value="admin">เลขาหลักสูตร / ผู้โพสต์</option><option value="superadmin">ผู้ดูแลระบบสูงสุด</option></select>}</div>)}</div>{admins.length===0&&<div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">ยังไม่มีบุคลากรที่ได้รับสิทธิ์แอดมิน หรือยังไม่ได้เชื่อมต่อ Supabase</div>}<p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">การเปลี่ยนบทบาทนี้จะบันทึกลง profiles ใน Supabase และต้องใช้ RLS policy ที่กำหนดไว้ใน migration ก่อน</p></>}{tab==="departments"&&<><Header title="จัดการสาขา" desc="เพิ่มและดูแลรายชื่อสาขาวิชาในคณะ"/><div className="mb-5 grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_180px_auto]"><input className="input" placeholder="ชื่อสาขา" value={departmentDraft.name} onChange={e=>setDepartmentDraft(s=>({...s,name:e.target.value}))}/><input className="input" placeholder="ตัวย่อ เช่น CS" value={departmentDraft.short} onChange={e=>setDepartmentDraft(s=>({...s,short:e.target.value.toUpperCase()}))}/><button onClick={addDepartment} className="rounded-xl bg-ocean-900 px-4 py-3 text-sm font-bold text-white"><Plus className="mr-1 inline" size={16}/> เพิ่มสาขา</button></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{departments.map(d=><div key={d.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5"><div><span className="text-xs font-black tracking-widest text-ocean-700">{d.short}</span><p className="mt-1 font-bold">{d.name}</p></div><button onClick={()=>setDepartments(xs=>xs.filter(x=>x.id!==d.id))} className="iconbtn text-rose-600"><Trash2 size={16}/></button></div>)}</div></>}
    {tab==="calendar"&&<><Header title="ปฏิทินกิจกรรม" desc="รวมวันจัดกิจกรรมและกำหนดการจากประกาศ"/><div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7"><div className="flex items-center gap-2"><CalendarDays className="text-ocean-700"/><h3 className="font-black">กำหนดการที่มีวันกิจกรรม</h3></div><div className="mt-5 space-y-3">{announcements.filter(a=>a.eventDate).sort((a,b)=>a.eventDate.localeCompare(b.eventDate)).map(a=><div key={a.id} className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-ocean-900 text-white"><span className="text-lg font-black">{new Date(a.eventDate+"T00:00:00").getDate()}</span><span className="text-[10px] uppercase">{new Date(a.eventDate+"T00:00:00").toLocaleDateString("th-TH",{month:"short"})}</span></div><div className="min-w-0 flex-1"><p className="font-bold">{a.title}</p><p className="mt-1 text-xs text-slate-400">{a.department} · {a.eventDate}</p></div>{canEditAnnouncements&&<button onClick={()=>{setTab("announcements");editAnnouncement(a)}} className="text-sm font-bold text-ocean-700">แก้ไขประกาศ</button>}</div>)}{announcements.every(a=>!a.eventDate)&&<p className="py-10 text-center text-sm text-slate-400">ยังไม่มีรายการกิจกรรม เพิ่มวันที่ในหน้าแก้ไขประกาศ</p>}</div></div></>}
    {tab==="analytics"&&<><Header title="สถิติและอันดับ" desc="ตัวอย่างการจัดอันดับยอดเข้าชมและคำค้นหายอดนิยม"/><div className="grid gap-4 sm:grid-cols-2"><Stat label="ยอดเข้าชมรวม" value={totalViews.toLocaleString("th-TH")} sub="ข้อมูลตัวอย่าง" icon={<Eye/>}/><Stat label="ประกาศที่เผยแพร่" value={String(published)} sub="รายการที่มีสถานะเผยแพร่" icon={<Bell/>}/></div><div className="mt-5 grid gap-4 xl:grid-cols-2"><div className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="font-black">ประกาศยอดเข้าชมสูงสุด</h3><div className="mt-4 space-y-4">{[...announcements].sort((a,b)=>b.views-a.views).map((a,i)=><div key={a.id}><div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{i+1}. {a.title}</span><b>{a.views.toLocaleString()}</b></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-ocean-500" style={{width:`${totalViews?Math.max(4,a.views/Math.max(...announcements.map(x=>x.views),1)*100):0}%`}}/></div></div>)}</div></div><div className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="font-black">คำค้นหายอดนิยม (ข้อมูลจำลอง)</h3>{[["ลงทะเบียน",86],["ทุนการศึกษา",72],["ปฏิทินกิจกรรม",54],["ตารางเรียน",41],["ห้องปฏิบัติการ",28]].map(([term,count],i)=><div key={term} className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0"><div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-50 text-xs font-black text-ocean-800">{i+1}</span><span className="text-sm font-semibold">{term}</span></div><span className="text-xs text-slate-400">{count} ครั้ง</span></div>)}</div></div><p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-6 text-amber-900">สถิติในหน้านี้เป็นข้อมูลจำลองเพื่อแสดงรูปแบบรายงาน ยังไม่ได้บันทึกยอดเข้าชมและคำค้นหาจริงจากผู้ใช้งาน</p></>}
    {tab==="settings"&&<><Header title="ตั้งค่าระบบ" desc="ตั้งค่าพื้นฐานของเว็บไซต์ประชาสัมพันธ์"/><div className="space-y-4"><Setting title="โหมดการแสดงผล" desc="รองรับมือถือ แท็บเล็ต และคอมพิวเตอร์" value="Responsive · 600px / 1024px"/><Setting title="สถานะระบบบัญชี" desc="ระบบล็อกอินนักศึกษาและผู้ดูแล" value="Prototype — ยังไม่เชื่อมฐานข้อมูล"/><Setting title="การจัดเก็บข้อมูล" desc="ข้อมูลการทดลองของหน้าแอดมิน" value="Local browser storage"/><Setting title="ระบบอัปโหลดรูปภาพ" desc="รูปประกาศและรูปโปรไฟล์" value="เก็บในเบราว์เซอร์เพื่อทดสอบ"/><Setting title="ความปลอดภัย" desc="รหัสผ่าน การยืนยันตัวตน และบันทึกกิจกรรม" value="ต้องพัฒนาฝั่งเซิร์ฟเวอร์ก่อนใช้งานจริง"/></div><div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5"><h3 className="font-black">บทบาทและแนวปฏิบัติ (ต้นแบบ)</h3><div className="mt-3 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><b className="text-sm">เลขาหลักสูตร / PR Editor</b><p className="mt-1 text-xs leading-5 text-slate-500">รับผิดชอบร่างและลงข่าวทุกประเภท รวมถึงดูแลปฏิทินกลาง</p></div><div className="rounded-xl bg-slate-50 p-3"><b className="text-sm">อาจารย์ / ผู้เกี่ยวข้อง</b><p className="mt-1 text-xs leading-5 text-slate-500">ส่งข่าวต้นทางและยืนยันความถูกต้อง พร้อมคัดกรองก่อนแชร์</p></div></div><p className="mt-3 text-xs leading-5 text-amber-800">ข้อเสนอจากเอกสาร: เกณฑ์ข่าวด่วนภายใน 3 วัน และเตือนล่วงหน้า 14 / 7 / 3 วัน ยังต้องให้หลักสูตรยืนยัน</p><p className="mt-2 text-xs leading-5 text-slate-500">การหน่วงเวลาและโพสต์อัตโนมัติในเวอร์ชันนี้เป็นการจำลอง: ทำงานเมื่อหน้าแอดมินเปิดอยู่หรือกลับมาเปิดอีกครั้ง ยังไม่ใช่ตัวตั้งเวลาฝั่งเซิร์ฟเวอร์ และสิทธิ์ตามบทบาทยังไม่ถูกบังคับจริง</p></div>
<div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900"><b>คำเตือนข้อมูลส่วนบุคคล:</b> อย่านำข้อมูลนักศึกษาจริง รหัสประจำตัวจริง หรือวันเกิดจริงมาใส่ในต้นแบบนี้ ต้องมีการอนุมัติจากหน่วยงานและมาตรการคุ้มครองข้อมูลก่อนใช้งานจริง</div></>}
   </section>
  </div>
  <div className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-400">Science PR Portal · Admin prototype · Data stored locally on this browser</div>
  <style jsx global>{`.input{width:100%;border:1px solid #dbe3e8;border-radius:12px;padding:11px 13px;font-size:14px;outline:none;background:#fff}.input:focus{border-color:#1596b4;box-shadow:0 0 0 3px #d9f3fb}.iconbtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;border-radius:10px;padding:9px;color:#64748b}.iconbtn:hover{background:#f8fafc}.input.pl-10{padding-left:40px}`}</style>
 </main>;
}

function Header({title,desc,action}:{title:string;desc:string;action?:ReactNode}){return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-black sm:text-3xl">{title}</h2><p className="mt-2 text-sm text-slate-500">{desc}</p></div>{action}</div>}
function Field({label,children,wide=false}:{label:string;children:ReactNode;wide?:boolean}){return <label className={wide?"block md:col-span-2":"block"}><span className="mb-2 block text-xs font-bold text-slate-500">{label}</span>{children}</label>}
function Tag({children}:{children:ReactNode}){return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{children}</span>}
function Quick({onClick,icon,label}:{onClick:()=>void;icon:ReactNode;label:string}){return <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left text-sm font-semibold hover:border-cyan-200 hover:bg-cyan-50"><span className="text-ocean-700">{icon}</span>{label}<ChevronRight className="ml-auto text-slate-300" size={16}/></button>}
function Setting({title,desc,value}:{title:string;desc:string;value:string}){return <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{title}</p><p className="mt-1 text-xs text-slate-400">{desc}</p></div><span className="w-fit rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">{value}</span></div>}

function adminRoleLabel(role:Admin["role"]){return role==="editor"?"เลขาหลักสูตร / ผู้โพสต์":role==="superadmin"?"ผู้ดูแลระบบสูงสุด":"อ่านอย่างเดียว"}
