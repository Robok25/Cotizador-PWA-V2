import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async req => {
  try {
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
  if (error) {
    console.error("registration-requests database insert failed:", { code: error.code, message: error.message, details: error.details, hint: error.hint });
    if (error.code === "42P01" || error.code === "PGRST205") return reply({ error: "La tabla de solicitudes no está disponible. Verifica que la migración de solicitudes de acceso esté aplicada en Supabase." }, 500);
    if (error.code === "42501") return reply({ error: "Supabase rechazó el registro por permisos. Es necesario revisar la configuración de la función." }, 500);
    return reply({ error: "No se pudo guardar la solicitud en la base de datos. Código: " + (error.code || "desconocido") }, 500);
  }

  return reply({ success: true, message: "Solicitud registrada. El administrador podrá revisarla desde ConveyorQuote.", request_id: data.id });
  } catch (cause) {
    console.error("registration-requests unexpected error:", cause);
    return reply({ error: "Ocurrió un error interno al registrar la solicitud. Intenta nuevamente más tarde." }, 500);
  }
});
