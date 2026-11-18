import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = "https://bkrytaqwgngrwdympbdr.supabase.co";
const NOTIFICATION_URL = `${SUPABASE_URL}/functions/v1/webhook-mp`;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Método no permitido." });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpToken = Deno.env.get("MP_ACCESS_TOKEN");
    const appBase = Deno.env.get("APP_BASE_URL");
    if (!mpToken || !appBase) throw new Error("Faltan secretos de configuración de Mercado Pago.");
    const base = new URL(appBase);
    if (base.protocol !== "https:" && base.hostname !== "localhost") throw new Error("APP_BASE_URL debe usar HTTPS.");
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json(401, { error: "Inicia sesión para activar tu garantía." });
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: auth, error: authError } = await admin.auth.getUser(jwt);
    if (authError || !auth.user) return json(401, { error: "Tu sesión expiró. Inicia sesión de nuevo." });
    const user = auth.user;
    const { data: perfil, error: perfilError } = await admin.from("perfiles")
      .select("no_cuenta,estatus_pago,descalificado").eq("user_id", user.id).maybeSingle();
    if (perfilError) throw perfilError;
    if (!perfil) return json(404, { error: "No encontramos tu perfil." });
    if (perfil.descalificado) return json(403, { error: "Tu cuenta está suspendida." });
    if (perfil.estatus_pago === "ACTIVO") return json(409, { error: "Tu garantía ya está activa." });

    const retorno = (path: string) => {
      const u = new URL(base.toString());
      u.hash = path;
      return u.toString();
    };
    const preference = {
      items: [{
        id: "garantia-semillas",
        title: "Garantía de participación · Semillas de Bondad ($10.00 MXN)",
        description: "Pago único de $10.00 MXN; $4.95 MXN netos se destinan al pozo común y $5.05 MXN corresponden a la comisión de Mercado Pago, incluidos 3.5% + $4.00 MXN fijos y 16% de IVA sobre la comisión.",
        quantity: 1,
        currency_id: "MXN",
        unit_price: 10.00,
      }],
      external_reference: `${user.id}|${perfil.no_cuenta}`,
      metadata: { user_id: user.id, no_cuenta: perfil.no_cuenta },
      back_urls: {
        success: retorno("/impacto?pago=exitoso"),
        failure: retorno("/registro?pago=error"),
        pending: retorno("/registro?pago=pendiente"),
      },
      auto_return: "approved",
      notification_url: NOTIFICATION_URL,
      statement_descriptor: "SEMILLAS FCA",
    };
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify(preference),
    });
    const mp = await mpResponse.json().catch(() => null);
    if (!mpResponse.ok || !mp?.init_point) {
      console.error("Mercado Pago no creó la preferencia", mpResponse.status, mp);
      throw new Error("Mercado Pago no pudo crear el checkout.");
    }
    return json(200, { init_point: mp.init_point, preferencia_id: mp.id });
  } catch (error) {
    console.error("crear-preferencia-mp", error);
    return json(500, { error: "No pudimos iniciar el pago. Inténtalo de nuevo." });
  }
});
