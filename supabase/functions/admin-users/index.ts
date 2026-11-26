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

  let body: { action?: string; email?: string; full_name?: string; role?: string; user_id?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Solicitud inválida." }, 400); }
  if (!["create", "update", "delete"].includes(body.action || "")) return json({ error: "Acción no soportada." }, 400);

  if (body.action === "create") {
    const email = body.email?.trim().toLowerCase();
    const fullName = body.full_name?.trim();
    const password = body.password || "";
    const role = body.role === "administrador" ? "administrador" : "vendedor";
    if (!email || !fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Indica nombre y correo válidos." }, 400);
    if (password.length < 12) return json({ error: "La contraseña inicial debe tener al menos 12 caracteres." }, 400);
    const { data, error } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: fullName },
    });
    if (error || !data.user) return json({ error: error?.message || "No se pudo crear el usuario." }, 400);
    const { error: profileUpdateError } = await adminClient.from("profiles").update({ email, full_name: fullName, role }).eq("id", data.user.id);
    if (profileUpdateError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return json({ error: "No se pudo asignar el rol; se revirtió la creación. " + profileUpdateError.message }, 500);
    }
    return json({ success: true, created: data.user.id });
  }

  if (body.action === "delete") {
    const targetId = body.user_id;
    if (!targetId || targetId === user.id) return json({ error: "No puedes eliminar tu propio usuario." }, 400);
    const { count } = await adminClient.from("profiles").select("id", { count: "exact", head: true }).eq("role", "administrador");
    const { data: target } = await adminClient.from("profiles").select("role").eq("id", targetId).maybeSingle();
    if (target?.role === "administrador" && (count || 0) <= 1) return json({ error: "No puedes eliminar al último administrador." }, 400);
    const { error } = await adminClient.auth.admin.deleteUser(targetId);
    if (error) return json({ error: error.message }, 400);
    return json({ success: true, deleted: targetId });
  }

  if (body.action === "update") {
    const targetId = body.user_id;
    const email = body.email?.trim().toLowerCase();
    const fullName = body.full_name?.trim();
    const role = body.role === "administrador" ? "administrador" : "vendedor";
    if (!targetId || !email || !fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Indica nombre y correo válidos." }, 400);
    const { data: targetProfile } = await adminClient.from("profiles").select("role").eq("id", targetId).maybeSingle();
    if (targetProfile?.role === "administrador" && role !== "administrador") {
      const { count } = await adminClient.from("profiles").select("id", { count: "exact", head: true }).eq("role", "administrador");
      if ((count || 0) <= 1) return json({ error: "No puedes quitar el rol al último administrador." }, 400);
    }
    const authUpdates: { email: string; user_metadata: { full_name: string }; password?: string } = { email, user_metadata: { full_name: fullName } };
    if (body.password) { if (body.password.length < 12) return json({ error: "La contraseña debe tener al menos 12 caracteres." }, 400); authUpdates.password = body.password; }
    const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(targetId, authUpdates);
    if (authUpdateError) return json({ error: authUpdateError.message }, 400);
    const { error: profileUpdateError } = await adminClient.from("profiles").update({ email, full_name: fullName, role }).eq("id", targetId);
    if (profileUpdateError) return json({ error: profileUpdateError.message }, 500);
    return json({ success: true, updated: targetId });
  }

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

