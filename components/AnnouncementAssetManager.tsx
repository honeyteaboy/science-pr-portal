"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileImage, FolderOpen, LoaderCircle, Upload, X } from "lucide-react";

type GalleryImage = { name: string; url: string; createdAt?: string };

export function AnnouncementAssetManager({
  selectedImage,
  onSelectImage,
  onExtractedText,
  onError,
}: {
  selectedImage: string;
  onSelectImage: (url: string) => void;
  onExtractedText: (text: string) => void;
  onError: (message: string) => void;
}) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadGallery = async () => {
    setLoadingGallery(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("announcement-media")
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      const images = (data || [])
        .filter((file) => file.id && !file.name.startsWith("."))
        .map((file) => ({
          name: file.name,
          url: supabase.storage.from("announcement-media").getPublicUrl(file.name).data.publicUrl,
          createdAt: file.created_at,
        }));
      setGallery(images);
    } catch (error) {
      onError(error instanceof Error ? error.message : "โหลดคลังภาพไม่สำเร็จ");
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    if (galleryOpen) void loadGallery();
  }, [galleryOpen]);

  const uploadImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("เลือกได้เฉพาะไฟล์รูปภาพ");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      onError("รูปภาพต้องมีขนาดไม่เกิน 15 MB");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("กรุณาเข้าสู่ระบบแอดมินก่อนอัปโหลดรูป");
      const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-90) || "image";
      const path = `${Date.now()}-${user.id.slice(0, 8)}-${safeName}`;
      const { error } = await supabase.storage.from("announcement-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const url = supabase.storage.from("announcement-media").getPublicUrl(path).data.publicUrl;
      onSelectImage(url);
      await loadGallery();
    } catch (error) {
      onError(error instanceof Error ? error.message : "อัปโหลดรูปภาพไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-ocean-400">
          {uploading ? <LoaderCircle size={17} className="animate-spin" /> : <Upload size={17} />}
          {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูปจากเครื่อง"}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploading} onChange={(event) => { void uploadImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        </label>
        <button type="button" onClick={() => setGalleryOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-ocean-800 hover:bg-ocean-50">
          <FolderOpen size={17} /> {galleryOpen ? "ปิดคลังภาพ" : "Browse คลังภาพ"}
        </button>
        {selectedImage && <button type="button" onClick={() => onSelectImage("")} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-3 text-sm font-semibold text-rose-700"><X size={16} /> เอารูปออก</button>}
      </div>
      {selectedImage && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="mb-2 text-xs font-bold text-slate-500">ภาพที่จะใช้ในประกาศ</p><img src={selectedImage} alt="ภาพประกอบประกาศ" className="max-h-56 w-full rounded-xl object-contain" /></div>}
      {galleryOpen && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between"><div><p className="font-bold text-slate-800">คลังภาพประกาศ</p><p className="text-xs text-slate-500">เลือกภาพที่เคยอัปโหลดไว้</p></div><button type="button" onClick={() => void loadGallery()} className="text-xs font-bold text-ocean-700">รีเฟรช</button></div>
        {loadingGallery ? <div className="flex items-center gap-2 py-6 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" /> กำลังโหลดภาพ...</div> : gallery.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{gallery.map((image) => <button type="button" key={image.name} onClick={() => onSelectImage(image.url)} className={`overflow-hidden rounded-xl border bg-white text-left transition hover:border-ocean-500 ${selectedImage === image.url ? "border-ocean-600 ring-2 ring-ocean-100" : "border-slate-200"}`}><img src={image.url} alt={image.name} className="h-28 w-full object-cover" /><span className="block truncate px-2 py-2 text-[11px] font-medium text-slate-600">{image.name}</span></button>)}</div> : <div className="py-8 text-center text-sm text-slate-500"><FileImage className="mx-auto mb-2" />ยังไม่มีภาพในคลัง</div>}
      </div>}
    </div>
  );
}

export function AnnouncementDocumentImporter({
  onExtractedText,
  onError,
}: {
  onExtractedText: (text: string) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const extract = async (file?: File) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      onError("รองรับไฟล์ PDF และรูปภาพ JPG, PNG, WEBP");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      onError("ไฟล์ต้องมีขนาดไม่เกิน 20 MB");
      return;
    }
    setBusy(true);
    setProgress("กำลังอ่านไฟล์...");
    let worker: { recognize: (input: unknown) => Promise<any>; terminate: () => Promise<unknown> } | null = null;
    try {
      let extracted = "";
      if (isPdf) {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), disableWorker: true }).promise;
        if (pdf.numPages > 30) throw new Error("รองรับ PDF ไม่เกิน 30 หน้าในหนึ่งครั้ง");
        const pageTexts: string[] = [];
        const pagesNeedingOcr: Array<{ page: any; number: number }> = [];
        for (let number = 1; number <= pdf.numPages; number += 1) {
          setProgress(`กำลังอ่านข้อความ PDF หน้า ${number}/${pdf.numPages}...`);
          const page = await pdf.getPage(number);
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => "str" in item ? item.str : "").join(" ").trim();
          pageTexts.push(text);
          if (text.length < 12) pagesNeedingOcr.push({ page, number });
        }
        extracted = pageTexts.filter(Boolean).join("\n\n");
        if (pagesNeedingOcr.length) {
          setProgress("พบหน้าที่เป็นภาพ กำลังอ่านข้อความด้วย OCR...");
          const { createWorker } = await import("tesseract.js");
          worker = await createWorker("tha+eng");
          const ocrTexts: string[] = [];
          for (const item of pagesNeedingOcr) {
            setProgress(`กำลัง OCR PDF หน้า ${item.number}/${pdf.numPages}...`);
            const viewport = item.page.getViewport({ scale: 1.5 });
            const canvas = document.createElement("canvas");
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext("2d");
            if (!context) continue;
            await item.page.render({ canvasContext: context, viewport }).promise;
            const result = await worker.recognize(canvas);
            if (result.data.text?.trim()) ocrTexts.push(result.data.text.trim());
          }
          if (ocrTexts.length) extracted = [extracted, ...ocrTexts].filter(Boolean).join("\n\n");
        }
      } else {
        setProgress("กำลังอ่านข้อความจากรูปภาพด้วย OCR...");
        const { createWorker } = await import("tesseract.js");
        worker = await createWorker("tha+eng");
        const result = await worker.recognize(file);
        extracted = result.data.text?.trim() || "";
      }
      if (!extracted.trim()) throw new Error("ไม่พบข้อความที่อ่านได้ในไฟล์นี้ ลองใช้ไฟล์ที่คมชัดขึ้น");
      onExtractedText(extracted.trim());
      setProgress("อ่านข้อความสำเร็จแล้ว เพิ่มลงในรายละเอียดให้แก้ไขต่อได้");
    } catch (error) {
      onError(error instanceof Error ? error.message : "อ่านข้อความจากไฟล์ไม่สำเร็จ");
      setProgress("");
    } finally {
      if (worker) await worker.terminate();
      setBusy(false);
    }
  };

  return <div className="rounded-2xl border border-dashed border-ocean-200 bg-ocean-50/60 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="font-bold text-slate-800">นำข้อความจากเอกสารมาใส่รายละเอียด</p><p className="mt-1 text-xs leading-5 text-slate-500">อ่าน PDF และ OCR จากรูปภาพ รองรับภาษาไทยและอังกฤษ จากนั้นแก้ไขข้อความก่อนบันทึกได้</p></div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-ocean-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-ocean-800">
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
        {busy ? "กำลังอ่านข้อความ..." : "เลือก PDF / รูปภาพ"}
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" disabled={busy} onChange={(event) => { void extract(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      </label>
    </div>
    {progress && <p className="mt-3 text-xs font-semibold text-ocean-800">{progress}</p>}
  </div>;
}
