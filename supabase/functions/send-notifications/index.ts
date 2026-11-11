import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type QueueRow = {
  id: string;
  announcement_id: string;
  profile_id: string;
  recipient_email: string;
  attempts: number;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://science-pr-portal.vercel.app").replace(/\/$/, "");

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function retryAt(attempts: number): string {
  const minutes = Math.min(60, 2 ** Math.min(attempts, 6));
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY || !EMAIL_FROM) {
    return new Response(JSON.stringify({ error: "Email worker environment is not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: claimed, error: claimError } = await supabase.rpc("claim_notification_outbox", {
    p_limit: 30,
  });

  if (claimError) {
    return new Response(JSON.stringify({ error: claimError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of (claimed || []) as QueueRow[]) {
    try {
      const [{ data: consent }, { data: preferences }, { data: announcement, error: announcementError }] =
        await Promise.all([
          supabase
            .from("email_consents")
            .select("id")
            .eq("profile_id", job.profile_id)
            .eq("email", job.recipient_email)
            .eq("consented", true)
            .is("withdrawn_at", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("student_preferences")
            .select("email_enabled")
            .eq("profile_id", job.profile_id)
            .maybeSingle(),
          supabase
            .from("announcements")
            .select("id,title,body,is_urgent,deadline_at,topic:topics(name)")
            .eq("id", job.announcement_id)
            .eq("status", "published")
            .maybeSingle(),
        ]);

      if (!consent || !preferences?.email_enabled || !announcement) {
        await supabase.from("notification_outbox").update({
          status: "skipped",
          last_error: announcementError?.message || "Consent or email preference is no longer active",
        }).eq("id", job.id);
        skipped += 1;
        continue;
      }

      const title = String(announcement.title || "ประกาศจากหลักสูตร");
      const body = String(announcement.body || "");
      const subject = announcement.is_urgent ? "[ข่าวด่วน] " + title : title;
      const detailUrl = SITE_URL + "/announcement/" + announcement.id;
      const safeTitle = escapeHtml(title);
      const safeBody = escapeHtml(body).replace(/\n/g, "<br/>");
      const urgency = announcement.is_urgent
        ? '<span style="display:inline-block;padding:5px 10px;border-radius:999px;background:#ffe4e6;color:#be123c;font-weight:700;font-size:12px">ข่าวด่วน</span>'
        : "";

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + RESEND_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [job.recipient_email],
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#172033">
              <p style="font-size:12px;font-weight:800;letter-spacing:2px;color:#0e7490">SCIENCE PR PORTAL</p>
              ${urgency}
              <h1 style="font-size:24px;line-height:1.4">${safeTitle}</h1>
              <div style="font-size:15px;line-height:1.8;color:#475569">${safeBody}</div>
              <p style="margin-top:28px"><a href="${detailUrl}" style="display:inline-block;background:#075985;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">อ่านประกาศฉบับเต็ม</a></p>
              <p style="margin-top:28px;font-size:12px;color:#64748b">อีเมลนี้ส่งตามการยินยอมรับประกาศของคุณ สามารถยกเลิกรับอีเมลได้จากหน้าโปรไฟล์ของระบบ</p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error("Resend API: " + errorText.slice(0, 700));
      }

      const { error: updateError } = await supabase
        .from("notification_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", job.id);
      if (updateError) throw updateError;
      sent += 1;
    } catch (error) {
      await supabase.from("notification_outbox").update({
        status: "failed",
        next_attempt_at: retryAt(job.attempts),
        last_error: error instanceof Error ? error.message.slice(0, 1000) : "Unknown email error",
      }).eq("id", job.id);
      failed += 1;
    }
  }

  return new Response(JSON.stringify({ claimed: (claimed || []).length, sent, skipped, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
