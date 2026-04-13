import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "../supabaseClient";
import FilterPanel from "./consultarDatos/FilterPanel";
import StatsCardsBI from "./consultarDatos/StatsCardsBI";
import ChartsBI from "./consultarDatos/ChartsBI";
import DataTableBI from "./consultarDatos/DataTableBI";

// ======================= HELPERS =======================

/** Devuelve false para null, undefined, '', 'false', 'null', '0' */
const hasTextValue = (v) => {
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s !== "" && s !== "false" && s !== "null" && s !== "0";
};

/** Devuelve true para 'S', 'SI', 'TRUE', '1', true */
const isYesVote = (v) => {
  if (v === true || v === 1) return true;
  const s = String(v || "").trim().toUpperCase();
  return s === "S" || s === "SI" || s === "TRUE" || s === "1";
};

/** Limpia acentos, trim y uppercase para comparación segura */
const normalizeText = (text) => {
  if (!text) return "";
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
};

// ======================= FILTROS POR DEFECTO =======================
const DEFAULT_FILTERS = {
  // Checkboxes
  abogados:            false,
  funcionario_publico: false,
  jubilados:           false,
  tercera_edad:        false,
  nuevo_anr:           false,
  exa_san_jose:        false,
  // Selects de texto
  partido:             "",
  seccional:           "",
  local_votacion:      "",
  universidades:       "",
  cargo_seccionales:   "",
  // Rango de edad
  edadMin:             "",
  edadMax:             "",
  // Votación — "" | "si" | "no"
  voto_internas_anr_2021:          "",
  voto_internas_plra_2021:         "",
  voto_grl_2021:                   "",
  voto_anr_presidenciales_2022:    "",
  voto_plra_presidenciales_2022:   "",
  voto_grl_presidenciales_2023:    "",
};

// ======================= OPTION BUILDER =======================
const toOptions = (arr, key) =>
  [...new Set(arr.map((r) => r[key]).filter((v) => v != null && v !== ""))].sort();

export default function ConsultarDatos({ onBack }) {
  const [rawData, setRawData]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filters, setFilters]     = useState(DEFAULT_FILTERS);

  // ======================= CARGA UNIFICADA =======================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Ejecutar las 4 consultas en paralelo
      const [
        { data: padronData,    error: e1 },
        { data: detalleData,   error: e2 },
        { data: detBiData,     error: e3 },
        { data: nuevoAnrData,  error: e4 },
      ] = await Promise.all([
        supabase.from("padron").select("ci, nombre, apellido, seccional, local_votacion"),
        supabase.from("padron_detalle").select("ci, abogados, jubilados, funcionario_publico, exa_san_jose, edad, partido, mesa, orden, local_votacion"),
        supabase.from("padron_detalle_bi").select("ci, universidades, cargo_seccionales, voto_internas_anr_2021, voto_internas_plra_2021, voto_grl_2021, voto_anr_presidenciales_2022, voto_plra_presidenciales_2022, voto_grl_presidenciales_2023"),
        supabase.from("padron_nuevo_anr").select("ci"),
      ]);

      if (e1) throw new Error(`padron: ${e1.message}`);
      if (e2) { console.error("[v0] padron_detalle error:", e2.message); }
      if (e3) { console.error("[v0] padron_detalle_bi error:", e3.message); }
      if (e4) { console.error("[v0] padron_nuevo_anr error:", e4.message); }

      if (!padronData) throw new Error("No se recibieron datos del padrón.");

      // Construir mapas por CI para O(1) lookup
      const detalleMap = {};
      (detalleData || []).forEach((r) => { detalleMap[r.ci] = r; });

      const detBiMap = {};
      (detBiData || []).forEach((r) => { detBiMap[r.ci] = r; });

      const nuevoAnrSet = new Set((nuevoAnrData || []).map((r) => r.ci));

      // Construir dataset enriquecido
      const merged = padronData.map((r) => {
        const det   = detalleMap[r.ci]  || {};
        const detBi = detBiMap[r.ci]    || {};

        const edadNum = det.edad
          ? (typeof det.edad === "number" ? det.edad : parseInt(det.edad, 10))
          : null;

        // Local de votación: priorizar padron, fallback detalle, normalizado
        const localRaw = r.local_votacion || det.local_votacion || null;
        const localNorm = normalizeText(localRaw);

        return {
          ci:            r.ci,
          nombre:        r.nombre,
          apellido:      r.apellido,
          seccional:     r.seccional,
          local_votacion: localRaw,
          _localNorm:    localNorm,  // para comparación interna
          edad:          isNaN(edadNum) ? null : edadNum,
          partido:       det.partido || null,
          mesa:          det.mesa ?? null,
          orden:         det.orden ?? null,
          universidades:       detBi.universidades    || null,
          cargo_seccionales:   detBi.cargo_seccionales || null,

          // ---- FLAGS calculados ----
          abogado_flag:           hasTextValue(det.abogados),
          jubilado_flag:          hasTextValue(det.jubilados),
          funcionario_publico_flag: hasTextValue(det.funcionario_publico),
          exa_san_jose_flag:      hasTextValue(det.exa_san_jose),
          nuevo_anr_flag:         nuevoAnrSet.has(r.ci),
          tercera_edad_flag:      typeof edadNum === "number" && !isNaN(edadNum) && edadNum >= 60,

          // ---- Votación (crudo) ----
          voto_internas_anr_2021:        detBi.voto_internas_anr_2021        ?? null,
          voto_internas_plra_2021:       detBi.voto_internas_plra_2021       ?? null,
          voto_grl_2021:                 detBi.voto_grl_2021                 ?? null,
          voto_anr_presidenciales_2022:  detBi.voto_anr_presidenciales_2022  ?? null,
          voto_plra_presidenciales_2022: detBi.voto_plra_presidenciales_2022 ?? null,
          voto_grl_presidenciales_2023:  detBi.voto_grl_presidenciales_2023  ?? null,
        };
      });

      setRawData(merged);
    } catch (e) {
      console.error("[v0] ConsultarDatos load error:", e);
      setError(e.message || "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ======================= SELECT OPTIONS =======================
  const options = useMemo(() => ({
    partidos:          toOptions(rawData, "partido"),
    seccionales:       [...new Set(rawData.map((r) => r.seccional).filter((v) => v != null && v !== ""))].sort((a, b) => Number(a) - Number(b)),
    locales:           [...new Set(rawData.map((r) => r._localNorm).filter(Boolean))].sort(),
    universidades:     toOptions(rawData, "universidades"),
    cargosSeccionales: toOptions(rawData, "cargo_seccionales"),
  }), [rawData]);

  // ======================= FILTRADO UNIFICADO =======================
  const filtered = useMemo(() => {
    return rawData.filter((r) => {
      // Flags booleanos
      if (filters.abogados            && !r.abogado_flag)             return false;
      if (filters.funcionario_publico  && !r.funcionario_publico_flag) return false;
      if (filters.jubilados            && !r.jubilado_flag)            return false;
      if (filters.tercera_edad         && !r.tercera_edad_flag)        return false;
      if (filters.nuevo_anr            && !r.nuevo_anr_flag)           return false;
      if (filters.exa_san_jose         && !r.exa_san_jose_flag)        return false;

      // Partido
      if (filters.partido && r.partido !== filters.partido) return false;

      // Seccional: comparar como número
      if (filters.seccional !== "" && Number(r.seccional) !== Number(filters.seccional)) return false;

      // Local de votación: comparar normalizado
      if (filters.local_votacion && r._localNorm !== normalizeText(filters.local_votacion)) return false;

      // Selects opcionales
      if (filters.universidades     && r.universidades     !== filters.universidades)     return false;
      if (filters.cargo_seccionales && r.cargo_seccionales !== filters.cargo_seccionales) return false;

      // Edad
      if (filters.edadMin !== "" && (r.edad === null || r.edad < Number(filters.edadMin))) return false;
      if (filters.edadMax !== "" && (r.edad === null || r.edad > Number(filters.edadMax))) return false;

      // Votación
      if (filters.voto_internas_anr_2021 === "si"  && !isYesVote(r.voto_internas_anr_2021))        return false;
      if (filters.voto_internas_anr_2021 === "no"  &&  isYesVote(r.voto_internas_anr_2021))        return false;
      if (filters.voto_internas_plra_2021 === "si" && !isYesVote(r.voto_internas_plra_2021))       return false;
      if (filters.voto_internas_plra_2021 === "no" &&  isYesVote(r.voto_internas_plra_2021))       return false;
      if (filters.voto_grl_2021 === "si"           && !isYesVote(r.voto_grl_2021))                 return false;
      if (filters.voto_grl_2021 === "no"           &&  isYesVote(r.voto_grl_2021))                 return false;
      if (filters.voto_anr_presidenciales_2022 === "si"  && !isYesVote(r.voto_anr_presidenciales_2022))  return false;
      if (filters.voto_anr_presidenciales_2022 === "no"  &&  isYesVote(r.voto_anr_presidenciales_2022))  return false;
      if (filters.voto_plra_presidenciales_2022 === "si" && !isYesVote(r.voto_plra_presidenciales_2022)) return false;
      if (filters.voto_plra_presidenciales_2022 === "no" &&  isYesVote(r.voto_plra_presidenciales_2022)) return false;
      if (filters.voto_grl_presidenciales_2023 === "si"  && !isYesVote(r.voto_grl_presidenciales_2023))  return false;
      if (filters.voto_grl_presidenciales_2023 === "no"  &&  isYesVote(r.voto_grl_presidenciales_2023))  return false;

      return true;
    });
  }, [rawData, filters]);

  // ======================= METRICS (siempre desde filtered) =======================
  const metrics = useMemo(() => ({
    total:        filtered.length,
    abogados:     filtered.filter((r) => r.abogado_flag).length,
    funcionarios: filtered.filter((r) => r.funcionario_publico_flag).length,
    jubilados:    filtered.filter((r) => r.jubilado_flag).length,
    terceraEdad:  filtered.filter((r) => r.tercera_edad_flag).length,
    nuevoAnr:     filtered.filter((r) => r.nuevo_anr_flag).length,
  }), [filtered]);

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  // ======================= RENDER =======================
  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="bg-brand-700 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors border-0 bg-transparent p-0 shadow-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <span className="text-white/30 select-none">|</span>
          <h1 className="text-white font-semibold text-base">Consultar Datos</h1>
          <div className="ml-auto flex items-center gap-2">
            {loading && <RefreshCw className="w-4 h-4 text-white/70 animate-spin" />}
            {!loading && (
              <span className="text-xs text-white/60">
                {rawData.length.toLocaleString("es-PY")} registros cargados
                {filtered.length !== rawData.length && (
                  <span className="ml-1 text-white/80 font-medium">
                    · {filtered.length.toLocaleString("es-PY")} filtrados
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando datos del padrón...</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
            <strong>Error al cargar datos:</strong> {error}
          </div>
        </div>
      )}

      {/* CONTENT */}
      {!loading && !error && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          <StatsCardsBI metrics={metrics} />
          <div className="flex flex-col lg:flex-row gap-5">
            <div className="lg:w-64 shrink-0">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                options={options}
              />
            </div>
            <div className="flex-1 flex flex-col gap-5 min-w-0">
              <ChartsBI filtered={filtered} />
              <DataTableBI data={filtered} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
