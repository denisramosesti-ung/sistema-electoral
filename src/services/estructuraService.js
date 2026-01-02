// services/estructuraService.js
import { supabase } from "../supabaseClient";
import { normalizeCI } from "../utils/estructuraHelpers";

export const cargarEstructuraCompleta = async () => {
  const { data: padron } = await supabase.from("padron").select("*");
  const { data: coords } = await supabase.from("coordinadores").select("*");
  const { data: subs } = await supabase.from("subcoordinadores").select("*");
  const { data: votos } = await supabase.from("votantes").select("*");

  const mapPadron = (ci) =>
    padron.find((p) => normalizeCI(p.ci) === normalizeCI(ci));

  return {
    coordinadores: (coords || []).map((c) => ({ ...c, ...mapPadron(c.ci) })),
    subcoordinadores: (subs || []).map((s) => ({ ...s, ...mapPadron(s.ci) })),
    votantes: (votos || []).map((v) => ({ ...v, ...mapPadron(v.ci) })),
  };
};

export const agregarPersonaService = async (tabla, data) => {
  const { error } = await supabase.from(tabla).insert([data]);
  if (error) throw error;
};

export const eliminarPersonaService = async (tabla, ci, campo = "ci") => {
  const { error } = await supabase.from(tabla).delete().eq(campo, ci);
  if (error) throw error;
};

export const actualizarTelefonoService = async (tabla, ci, telefono) => {
  const { error } = await supabase
    .from(tabla)
    .update({ telefono })
    .eq("ci", ci);

  if (error) throw error;
};