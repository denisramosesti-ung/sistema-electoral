import { createClient } from "@supabase/supabase-js";

// VITE usa import.meta.env (NO process.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Logs de diagnóstico para debug en producción
console.log("[v0] ENV DEBUG:", {
  url: SUPABASE_URL,
  key: SUPABASE_ANON_KEY ? "***PRESENTE***" : undefined,
  allEnvKeys: Object.keys(import.meta.env)
});

// Validación explícita de variables de entorno
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("[v0] ENV VARIABLES MISSING", {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY,
    availableKeys: Object.keys(import.meta.env)
  });
  throw new Error("Supabase env vars missing. Check Vercel env vars are named VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
