import { supabase } from "@/services/supabaseClient";

export const GARANTIA_MXN = 16;

/** Solicita al servidor una preferencia Checkout Pro y redirige al checkout alojado por Mercado Pago. */
export async function activarGarantia(): Promise<void> {
  const { data, error } = await supabase.functions.invoke("crear-preferencia-mp", { body: {} });
  if (error) throw new Error("No pudimos conectar con Mercado Pago. Verifica tu sesión e inténtalo de nuevo.");
  const initPoint = (data as { init_point?: string } | null)?.init_point;
  if (!initPoint || !/^https:\/\/([\w-]+\.)?mercadopago\.com(\.mx)?\//i.test(initPoint)) {
    throw new Error("Mercado Pago no devolvió un enlace de pago válido.");
  }
  window.location.assign(initPoint);
}
