/**
 * Mercado Pago Checkout Pro — client side.
 *
 * Flow: backend creates a preference (POST /checkout/preferences with
 * back_urls → {origin}/pago/retorno, external_reference = usuario.id,
 * auto_return = "approved") and returns `init_point`. We redirect; MP returns
 * to /pago/retorno?payment_id&status&external_reference&preference_id and the
 * backend confirms via webhook + GET /v1/payments/{id} before activating.
 */
export function redirigirACheckout(initPoint: string) {
  window.location.assign(initPoint);
}

export function leerRetorno(search: URLSearchParams) {
  return {
    payment_id: search.get("payment_id") ?? search.get("collection_id"),
    status: search.get("status") ?? search.get("collection_status"),
    external_reference: search.get("external_reference"),
    preference_id: search.get("preference_id"),
  };
}
