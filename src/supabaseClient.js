import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validación explícita de variables de entorno
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("ENV VARIABLES MISSING", {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY
  });
  throw new Error("Supabase env vars missing");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
