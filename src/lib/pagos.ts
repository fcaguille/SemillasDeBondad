/** Punto único de integración futura con Mercado Pago. No inicia cobros en esta fase. */
export async function activarGarantia(): Promise<never> {
 throw new Error("La pasarela de pagos está en etapa final de activación.");
}
export const GARANTIA_MXN = 16;
