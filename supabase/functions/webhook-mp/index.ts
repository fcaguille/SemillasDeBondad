import { createClient } from "npm:@supabase/supabase-js@2";

const MP_API = "https://api.mercadopago.com";
const REF = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\|(\d{9})$/i;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
async function signatureValid(req: Request, dataId: string, secret: string) {
  const header = req.headers.get("x-signature") ?? "";
  const fields = Object.fromEntries(header.split(",").map((part) => {
    const i = part.indexOf("=");
    return [part.slice(0, i).trim(), part.slice(i + 1).trim()];
  }));
  const ts = fields.ts, v1 = fields.v1;
  if (!ts || !v1) return false;
  const requestId = req.headers.get("x-request-id");
  let manifest = "";
  if (dataId) manifest += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  return constantTimeEqual(digest, v1.toLowerCase());
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Método no permitido." });
  try {
    const secret = Deno.env.get("MP_WEBHOOK_SECRET");
    const mpToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!secret || !mpToken) throw new Error("Faltan secretos MP.");
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    // Mercado Pago envía data.id en query string; en notificaciones sin query,
    // usamos el ID del cuerpo para validar el manifiesto y consultar el pago.
    const dataId = String(url.searchParams.get("data.id") ?? body?.data?.id ?? "").trim();
    const signedDataId = dataId;
    const topic = String(body?.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "");
    const action = String(body?.action ?? "");
    const isPaymentEvent = ["payment", "payment.created", "payment.updated"].includes(topic) || ["payment.created", "payment.updated"].includes(action);
    if (!await signatureValid(req, signedDataId, secret)) {
      console.error("Firma de Mercado Pago inválida");
      throw new Error("Firma de webhook inválida.");
    }
    if (!isPaymentEvent || !dataId) {
      return json(200, { resultado: "ignorado", topic, action });
    }

    const response = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(dataId)}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    if (!response.ok) throw new Error(`Mercado Pago respondió ${response.status} al consultar el pago.`);
    const payment = await response.json();
    const match = REF.exec(String(payment.external_reference ?? ""));
    if (!match) throw new Error("external_reference inválida.");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const userId = match[1];

    if (payment.status === "refunded" || payment.status === "charged_back") {
      // Solo una devolución del pago vigente debe descalificar; un aviso tardío
      // de un cobro anterior no debe anular una garantía nueva ya cubierta.
      const { data: pagoActual, error: pagoError } = await admin
        .from("pagos_mercadopago")
        .update({ estatus_mp: payment.status })
        .eq("user_id", userId)
        .eq("mp_payment_id", String(payment.id))
        .select("user_id")
        .maybeSingle();
      if (pagoError) throw pagoError;
      if (!pagoActual) return json(200, { resultado: "devolucion_antigua_ignorada" });

      const { error: perfilError } = await admin.from("perfiles").update({
        estatus_pago: "PENDIENTE",
        descalificado: true,
        motivo_descalificacion: "GARANTIA_DEVUELTA",
      }).eq("user_id", userId);
      if (perfilError) throw perfilError;
      return json(200, { resultado: "descalificado_por_devolucion", estatus: payment.status });
    }

    if (payment.status !== "approved") {
      return json(200, { resultado: "sin_accion", estatus: payment.status });
    }
    if (payment.currency_id !== "MXN" || Number(payment.transaction_amount) < 16) {
      throw new Error("El pago aprobado no cumple el mínimo de $16.00 MXN.");
    }
    const { data, error } = await admin.rpc("registrar_pago_aprobado", {
      p_mp_payment_id: String(payment.id),
      p_user_id: userId,
      p_no_cuenta: match[2],
      p_monto: Number(payment.transaction_amount),
    });
    if (error) throw error;
    return json(200, { resultado: data });
  } catch (error) {
    console.error("webhook-mp; se solicita reintento", error);
    return json(500, { error: "No se pudo procesar la notificación; Mercado Pago puede reintentar." });
  }
});
