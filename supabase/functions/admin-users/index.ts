import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json({ error: "Sesión no válida." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "La función no tiene configuradas sus variables internas." }, 500);

  const token = authorization.slice(7);
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return json({ error: "No se pudo validar la sesión." }, 401);

  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profile, error: profileError } = await adminClient.from("profiles").select("role").eq("id", user.id).single();
  if (profileError || profile?.role !== "administrador") return json({ error: "Se requieren permisos de administrador." }, 403);

  let body: { action?: string; email?: string; full_name?: string; role?: string };
  try { body = await req.json(); } catch { return json({ error: "Solicitud inválida." }, 400); }
  if (body.action !== "invite") return json({ error: "Acción no soportada." }, 400);

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim();
  const role = body.role === "administrador" ? "administrador" : "vendedor";
  if (!email || !fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Indica un nombre y correo electrónico válidos." }, 400);

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });
  if (error) return json({ error: error.message }, 400);

  if (data.user) {
    const { error: updateError } = await adminClient.from("profiles").update({ full_name: fullName, role }).eq("id", data.user.id);
    if (updateError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return json({ error: "No se pudo asignar el rol inicial: " + updateError.message }, 500);
    }
  }
  return json({ success: true, invited: email });
});
