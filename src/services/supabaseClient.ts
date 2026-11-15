import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

export const SUPABASE_URL = `https://${projectId}.supabase.co`;
export const SUPABASE_ANON_KEY = publicAnonKey;
/** Edge Function base (supabase/functions/server). */
export const API_BASE = `${SUPABASE_URL}/functions/v1/make-server-451763c1`;

/** Browser client — used only for Supabase Auth (session persisted in localStorage). */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "sdb.auth" },
});

/** Supabase Auth needs an email; students sign in with their 9-digit account number. */
export const emailDeCuenta = (numeroCuenta: string) =>
  `${numeroCuenta}@alumnos.semillasdebondad.app`;
