import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Método no permitido." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return reply({ error: "Servicio no configurado." }, 500);
  let body: { full_name?: string; email?: string; company?: string; reason?: string; website?: string };
  try { body = await req.json(); } catch { return reply({ error: "Solicitud inválida." }, 400); }
  if (body.website) return reply({ success: true });
  const fullName = (body.full_name || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const company = (body.company || "").trim().slice(0, 150);
  const reason = (body.reason || "").trim().slice(0, 1000);
  if (fullName.length < 2 || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return reply({ error: "Revisa el nombre y el correo electrónico." }, 400);
  }
  const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await db.from("registration_requests").insert({
    full_name: fullName, email, company: company || null, reason: reason || null,
  }).select("id").single();
  if (error) return reply({ error: "No se pudo registrar la solicitud." }, 500);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  if (!resendKey || !adminEmail || !fromEmail) {
    return reply({ success: true, email_sent: false, message: "Solicitud registrada; falta configurar el servicio de correo para notificar al administrador.", request_id: data.id }, 202);
  }
  const html = `<h2>Nueva solicitud de acceso a ConveyorQuote</h2><p><b>Nombre:</b> ${clean(fullName)}</p><p><b>Correo:</b> ${clean(email)}</p><p><b>Empresa:</b> ${clean(company || "No indicada")}</p><p><b>Motivo:</b><br>${clean(reason || "No indicado").replace(/\n/g, "<br>")}</p><p>Solicitud: ${data.id}</p><p>Ingresa a ConveyorQuote para revisar y crear la cuenta si procede.</p>`;
  const mail = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromEmail, to: [adminEmail], subject: "Solicitud de acceso a ConveyorQuote", html }),
  });
  if (!mail.ok) {
    const detail = await mail.text();
    console.error("Resend delivery failed", mail.status, detail);
    return reply({ success: true, email_sent: false, message: "La solicitud quedó registrada, pero no se pudo enviar el correo de aviso.", request_id: data.id }, 202);
  }
  return reply({ success: true, email_sent: true, request_id: data.id });
});
