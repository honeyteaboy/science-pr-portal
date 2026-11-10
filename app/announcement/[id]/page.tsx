"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Eye, MessageCircle, Send, UserCircle } from "lucide-react";

type ArticleData = {title:string;category:string;department:string;date:string;views:number;excerpt:string;body:string[];image?:string;targetCohorts?:string[];urgency?:"normal"|"urgent";actionLine?:string;eventDate?:string;eventTime?:string;eventLocation?:string;eventLink?:string;comments?:boolean};
const articles: Record<string,ArticleData> = {
  "1": { title:"เปิดรับสมัครทุนการศึกษาสำหรับนักศึกษาคณะวิทยาศาสตร์",category:"ทุนการศึกษา",department:"ประชาสัมพันธ์กลาง",date:"10 พ.ย. 2569",views:1284,excerpt:"แจ้งกำหนดการและรายละเอียดการยื่นขอรับทุนการศึกษาประจำปีการศึกษา",body:["คณะวิทยาศาสตร์ประชาสัมพันธ์การเปิดรับสมัครทุนการศึกษาสำหรับนักศึกษาที่มีคุณสมบัติตามเกณฑ์ที่กำหนด","ผู้สนใจควรตรวจสอบคุณสมบัติ เอกสารประกอบ และกำหนดเวลาการยื่นใบสมัครจากประกาศฉบับจริงของหน่วยงานที่รับผิดชอบ","หมายเหตุ: เนื้อหานี้เป็นข้อมูลตัวอย่างสำหรับทดสอบระบบ โปรดแทนที่ด้วยรายละเอียดที่ได้รับการยืนยันก่อนเผยแพร่จริง"] },
  "2": { title:"กำหนดการลงทะเบียนและเพิ่ม-ถอนรายวิชา",category:"การเรียน",department:"งานบริการการศึกษา",date:"9 พ.ย. 2569",views:986,excerpt:"ตรวจสอบช่วงเวลาลงทะเบียน เงื่อนไข และกำหนดการสำคัญของภาคการศึกษา",body:["รวบรวมกำหนดการลงทะเบียน เพิ่มรายวิชา และถอนรายวิชาเพื่อให้นักศึกษาติดตามได้สะดวก","โปรดตรวจสอบกำหนดการและเงื่อนไขล่าสุดจากระบบทะเบียนหรือประกาศทางการของมหาวิทยาลัย","หมายเหตุ: เนื้อหานี้เป็นข้อมูลตัวอย่างสำหรับทดสอบระบบ"] },
  "3": { title:"กิจกรรม Science Open House ประจำปี",category:"กิจกรรม",department:"สโมสรนักศึกษา",date:"8 พ.ย. 2569",views:742,excerpt:"ชวนนักศึกษาและผู้สนใจร่วมกิจกรรมเปิดบ้านวิทยาศาสตร์",body:["กิจกรรมเปิดบ้านวิทยาศาสตร์เปิดโอกาสให้ผู้เข้าร่วมเรียนรู้ผลงาน ห้องปฏิบัติการ และกิจกรรมของแต่ละสาขา","รายละเอียดวัน เวลา สถานที่ และการลงทะเบียนจะต้องได้รับการยืนยันจากผู้จัดงานก่อนประกาศ","หมายเหตุ: เนื้อหานี้เป็นข้อมูลตัวอย่างสำหรับทดสอบระบบ"] },
  "4": { title:"ประกาศแนวปฏิบัติการใช้ห้องปฏิบัติการ",category:"ประกาศ",department:"สำนักงานคณะ",date:"7 พ.ย. 2569",views:531,excerpt:"แนวทางการเข้าใช้พื้นที่และข้อควรปฏิบัติเพื่อความปลอดภัย",body:["นักศึกษาควรปฏิบัติตามข้อกำหนดของห้องปฏิบัติการและคำแนะนำของผู้ดูแลอย่างเคร่งครัด","ก่อนเข้าใช้พื้นที่ควรศึกษาคู่มือและแนวปฏิบัติเฉพาะของห้องปฏิบัติการนั้น ๆ","หมายเหตุ: เนื้อหานี้เป็นข้อมูลตัวอย่างสำหรับทดสอบระบบ"] }
};

type Comment = {id:number;name:string;text:string;date:string};
export default function AnnouncementDetail({params}:{params:{id:string}}) {
 const [article,setArticle]=useState<ArticleData|null>(articles[params.id]||null);
 const [comments,setComments]=useState<Comment[]>([]);
 const [enabled,setEnabled]=useState(false);
 const [text,setText]=useState("");
 const [profile,setProfile]=useState({name:"ผู้ใช้งานตัวอย่าง",avatar:""});
 useEffect(()=>{
   const read=(key:string,fallback:any)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}};
   const saved=read("science-admin-announcements",[]);
   const live=saved.find((x:any)=>String(x.id)===params.id&&x.status==="published");
   if(live){setArticle({title:live.title,category:live.category,department:live.department,date:live.date?new Date(live.date+"T00:00:00").toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"}):"",views:live.views||0,excerpt:live.actionLine||live.body?.slice(0,160)||"",body:(live.body||"").split(/\\n+/).filter(Boolean),image:live.image,targetCohorts:live.targetCohorts||["all"],urgency:live.urgency||"normal",actionLine:live.actionLine||"",eventDate:live.eventDate||"",eventTime:live.eventTime||"",eventLocation:live.eventLocation||"",eventLink:live.eventLink||"",comments:!!live.comments});}else{setArticle(articles[params.id]||null);}
   setComments(read("science-comments-"+params.id,[]));
   setEnabled(live?!!live.comments:read("science-comments-enabled-"+params.id,false));
   setProfile(read("science-profile",{name:"ผู้ใช้งานตัวอย่าง",avatar:""}));
 },[params.id]);
 const submit=()=>{if(!text.trim())return;const next=[...comments,{id:Date.now(),name:profile.name||"ผู้ใช้งาน",text:text.trim(),date:new Date().toLocaleString("th-TH")}];setComments(next);localStorage.setItem("science-comments-"+params.id,JSON.stringify(next));setText("")};
 if(!article)return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-3xl rounded-3xl bg-white p-8"><h1 className="text-2xl font-bold">ไม่พบประกาศนี้</h1><Link href="/" className="mt-4 inline-block text-ocean-700">กลับหน้าหลัก</Link></div></main>;
 return <main className="min-h-screen bg-[#f5fafc] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
  <div className="mx-auto max-w-4xl">
   <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ocean-700"><ArrowLeft size={17}/> กลับหน้าประกาศ</Link><Link href="/profile" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><UserCircle size={17}/> โปรไฟล์</Link></div>
   <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="bg-gradient-to-r from-[#0c6078] to-[#16a3b8] px-6 py-10 text-white sm:px-10 sm:py-14"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">{article.category}</span>{article.urgency==="urgent"&&<span className="rounded-full bg-rose-500/90 px-3 py-1.5 text-xs font-black">ข่าวด่วน</span>}</div><h1 className="mt-5 text-2xl font-black leading-tight sm:text-4xl">{article.title}</h1><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-cyan-50"><span>{article.department}</span><span className="inline-flex items-center gap-1"><CalendarDays size={15}/>{article.date}</span><span className="inline-flex items-center gap-1"><Eye size={15}/>{article.views.toLocaleString("th-TH")} views</span><span>กลุ่มเป้าหมาย: {(article.targetCohorts||["all"]).includes("all")?"ทุกรุ่น":(article.targetCohorts||[]).map(x=>"รุ่น "+x).join(", ")}</span></div></div>
    <div className="px-6 py-8 sm:px-10 sm:py-10">{article.image&&<img src={article.image} alt="" className="mb-6 max-h-[420px] w-full rounded-2xl object-cover"/>}{article.actionLine&&<p className="mb-5 rounded-xl bg-cyan-50 p-4 text-base font-bold leading-7 text-ocean-800">{article.actionLine}</p>}<p className="border-l-4 border-ocean-500 pl-4 text-lg font-semibold leading-8 text-slate-700">{article.excerpt}</p><div className="mt-7 space-y-5 text-base leading-8 text-slate-600">{article.body.map((p,i)=><p key={i}>{p}</p>)}</div>{article.eventDate&&<div className="mt-7 rounded-2xl bg-slate-50 p-4"><h3 className="font-black">กำหนดการ</h3><p className="mt-2 text-sm">{new Date(article.eventDate+"T00:00:00").toLocaleDateString("th-TH",{day:"numeric",month:"long",year:"numeric"})} {article.eventTime&&"· "+article.eventTime}</p>{article.eventLocation&&<p className="mt-1 text-sm">สถานที่: {article.eventLocation}</p>}{article.eventLink&&<a href={article.eventLink} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-ocean-700 underline">เปิดลิงก์ที่เกี่ยวข้อง</a>}</div>}</div>
   </article>
   <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-ocean-50 text-ocean-700"><MessageCircle/></div><div><h2 className="text-xl font-black">ความคิดเห็น</h2><p className="text-sm text-slate-500">{comments.length} ความคิดเห็น</p></div></div>
    {!enabled?<div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">ประกาศนี้ปิดการแสดงความคิดเห็นโดยผู้ดูแลระบบ</div>:<><div className="mt-5 flex gap-3"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">{profile.avatar?<img src={profile.avatar} alt="รูปโปรไฟล์" className="h-full w-full object-cover"/>:<UserCircle className="h-full w-full p-2 text-slate-400"/>}</div><div className="min-w-0 flex-1"><textarea value={text} onChange={e=>setText(e.target.value)} rows={3} maxLength={500} placeholder="เขียนความคิดเห็นอย่างสุภาพ..." className="w-full resize-y rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-ocean-500 focus:ring-4 focus:ring-cyan-50"/><div className="mt-2 flex justify-between"><Link href="/profile" className="text-xs font-semibold text-ocean-700">แก้ไขโปรไฟล์</Link><button onClick={submit} disabled={!text.trim()} className="inline-flex items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Send size={14}/> ส่งความคิดเห็น</button></div></div></div></>}
    <div className="mt-6 space-y-3">{comments.map(c=><div key={c.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex flex-wrap justify-between gap-2"><span className="font-bold text-slate-800">{c.name}</span><span className="text-xs text-slate-400">{c.date}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{c.text}</p></div>)}</div>
   </section>
   <p className="py-6 text-center text-xs text-slate-400">Science PR Portal · หน้าทดลองแสดงรายละเอียดประกาศ</p>
  </div>
 </main>;
}
