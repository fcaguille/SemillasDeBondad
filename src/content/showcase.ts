import type { CollectiblePlanta } from "@/components/CollectiblePlantCard";

/** Static marketing content for the auth screen (not API data). */
export const PLANTA_EJEMPLO: CollectiblePlanta = {
  id: "SB-8492",
  nombre: "La Capibara Verde",
  no_diseno: 3,
  puntaje_neto: 48,
  creadores: [
    { usuario_id: "ejemplo-1", nickname: "@EcoContador_26", carrera: "contaduria" },
    { usuario_id: "ejemplo-2", nickname: "@AdminSolar", carrera: "administracion" },
  ],
  material: "100% Reciclado",
  sistema_autorriego: true,
  serie: 42,
  serie_total: 500,
};
