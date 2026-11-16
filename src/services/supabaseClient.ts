import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
if (!url || !key) console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.");
export const SUPABASE_URL = url ?? "";
export const SUPABASE_ANON_KEY = key ?? "";
export const emailDeCuenta = (n: string) => `${n}@fca.semillas.local`;
export const supabase = createClient(SUPABASE_URL || "https://missing.supabase.co", SUPABASE_ANON_KEY || "missing-publishable-key", { auth: { persistSession: true, autoRefreshToken: true, storageKey: "sdb.auth" } });
