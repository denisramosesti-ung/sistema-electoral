import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "../supabaseClient";
import FilterPanel    from "./consultarDatos/FilterPanel";
import StatsCardsBI   from "./consultarDatos/StatsCardsBI";
import ChartsBI       from "./consultarDatos/ChartsBI";
import DataTableBI    from "./consultarDatos/DataTableBI";

// ======================= HELPERS =======================

/** Normaliza un registro crudo de padron_bi a tipos consistentes */
const normalizeRow = (r) => ({
  ...r,
  // Numérico
  edad:  r.edad  != null ? Number(r.edad)  : null,
  mesa:  r.mesa  != null ? Number(r.mesa)  : null,
  orden: r.orden != null ? Number(r.orden) : null,
  // Flags booleanos
  abogado_flag:             r.abogado_flag             === true,
  jubilado_flag:            r.jubilado_flag             === true,
  funcionario_publico_flag: r.funcionario_publico_flag  === true,
  tercera_edad_flag:        r.tercera_edad_flag          === true,
  nuevo_anr_flag:           r.nuevo_anr_flag             === true,
  exa_san_jose_flag:        r.exa_san_jose_flag          === true,
  // Votos booleanos
  voto_internas_anr_2021:        r.voto_internas_anr_2021        === true,
  voto_internas_plra_2021:       r.voto_internas_plra_2021       === true,
  voto_grl_2021:                 r.voto_grl_2021                 === true,
  voto_anr_presidenciales_2022:  r.voto_anr_presidenciales_2022  === true,
  voto_plra_presidenciales_2022: r.voto_plra_presidenciales_2022 === true,
  voto_grl_presidenciales_2023:  r.voto_grl_presidenciales_2023  === true,
});

/** Valores únicos no nulos de una clave, ordenados */
const toOptions = (data, key) =>
  [...new Set(data.map((r) => r[key]).filter((v) => v != null && v !== ""))].sort();

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
  entidad_publica:     "",  // nuevo filtro basado en funcionario_publico (texto)
  // Edad
  edadMin: "",
  edadMax: "",
  // Votación — "" | "si" | "no"
  voto_internas_anr_2021:        "",
  voto_internas_plra_2021:       "",
  voto_grl_2021:                 "",
  voto_anr_presidenciales_2022:  "",
  voto_plra_presidenciales_2022: "",
  voto_grl_presidenciales_2023:  "",
};

// ======================= COMPONENTE PRINCIPAL =======================
export default function ConsultarDatos({ onBack }) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // ======================= CARGA Y NORMALIZACIÓN =======================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.from("padron_bi").select("*");

      if (err) throw new Error(err.message);
      if (!data) throw new Error("No se recibieron datos.");

      // DEBUG: datos originales
      console.log("[v0] DATA ORIGINAL:", data.length);
      console.log("[v0] Ejemplo item ORIGINAL:", data[0]);
      console.log("[v0] TIPO voto_internas_anr_2021:", typeof data[0]?.voto_internas_anr_2021, "valor:", data[0]?.voto_internas_anr_2021);
      console.log("[v0] TIPO edad:", typeof data[0]?.edad, "valor:", data[0]?.edad);
      console.log("[v0] TIPO abogado_flag:", typeof data[0]?.abogado_flag, "valor:", data[0]?.abogado_flag);

      // Normalizar TODOS los tipos al cargar — una sola vez
      const normalized = data.map(normalizeRow);

      // DEBUG: datos normalizados
      console.log("[v0] DATA NORMALIZADA:", normalized.length);
      console.log("[v0] Ejemplo item NORMALIZADO:", normalized[0]);
      console.log("[v0] TIPO voto_internas_anr_2021 (norm):", typeof normalized[0]?.voto_internas_anr_2021, "valor:", normalized[0]?.voto_internas_anr_2021);
      console.log("[v0] TIPO edad (norm):", typeof normalized[0]?.edad, "valor:", normalized[0]?.edad);

      setRawData(normalized);
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
    partidos:         toOptions(rawData, "partido"),
    seccionales:      toOptions(rawData, "seccional"),
    entidadesPublicas: toOptions(rawData, "funcionario_publico"),
  }), [rawData]);

  // ======================= FILTRADO =======================
  const filtered = useMemo(() => {
    // DEBUG: inicio del filtrado
    console.log("[v0] INICIO FILTRADO - rawData.length:", rawData.length);
    console.log("[v0] FILTROS ACTIVOS:", JSON.stringify(filters));

    const result = rawData.filter((r, index) => {
      // DEBUG: solo logear los primeros 3 items
      if (index < 3) {
        console.log("[v0] Evaluando item", index, "- voto_internas_anr_2021:", r.voto_internas_anr_2021, "edad:", r.edad);
      }
      // Flags (boolean directo)
      if (filters.abogados            && !r.abogado_flag)             return false;
      if (filters.funcionario_publico  && !r.funcionario_publico_flag) return false;
      if (filters.jubilados            && !r.jubilado_flag)            return false;
      if (filters.tercera_edad         && !r.tercera_edad_flag)        return false;
      if (filters.nuevo_anr            && !r.nuevo_anr_flag)           return false;
      if (filters.exa_san_jose         && !r.exa_san_jose_flag)        return false;

      // Partido (string)
      if (filters.partido && r.partido !== filters.partido) return false;

      // Seccional (comparar como Number)
      if (filters.seccional && Number(r.seccional) !== Number(filters.seccional)) return false;

      // Entidad Pública (basado en funcionario_publico texto)
      if (filters.entidad_publica && r.funcionario_publico !== filters.entidad_publica) return false;

      // Edad (Number)
      const edad = r.edad !== null ? Number(r.edad) : 0;
      if (filters.edadMin !== "" && edad < Number(filters.edadMin)) return false;
      if (filters.edadMax !== "" && edad > Number(filters.edadMax)) return false;

      // Votación (boolean: true === votó, false === no votó)
      if (filters.voto_internas_anr_2021 === "si"        && r.voto_internas_anr_2021        !== true) return false;
      if (filters.voto_internas_anr_2021 === "no"        && r.voto_internas_anr_2021        === true) return false;
      if (filters.voto_internas_plra_2021 === "si"       && r.voto_internas_plra_2021       !== true) return false;
      if (filters.voto_internas_plra_2021 === "no"       && r.voto_internas_plra_2021       === true) return false;
      if (filters.voto_grl_2021 === "si"                 && r.voto_grl_2021                 !== true) return false;
      if (filters.voto_grl_2021 === "no"                 && r.voto_grl_2021                 === true) return false;
      if (filters.voto_anr_presidenciales_2022 === "si"  && r.voto_anr_presidenciales_2022  !== true) return false;
      if (filters.voto_anr_presidenciales_2022 === "no"  && r.voto_anr_presidenciales_2022  === true) return false;
      if (filters.voto_plra_presidenciales_2022 === "si" && r.voto_plra_presidenciales_2022 !== true) return false;
      if (filters.voto_plra_presidenciales_2022 === "no" && r.voto_plra_presidenciales_2022 === true) return false;
      if (filters.voto_grl_presidenciales_2023 === "si"  && r.voto_grl_presidenciales_2023  !== true) return false;
      if (filters.voto_grl_presidenciales_2023 === "no"  && r.voto_grl_presidenciales_2023  === true) return false;

      return true;
    });

    // DEBUG: resultado del filtrado
    console.log("[v0] DATA FILTRADA:", result.length);

    return result;
  }, [rawData, filters]);

  // ======================= METRICS (desde filtered, booleanos directos) =======================
  const metrics = useMemo(() => ({
    total:        filtered.length,
    abogados:     filtered.filter((r) => r.abogado_flag).length,
    funcionarios: filtered.filter((r) => r.funcionario_publico_flag).length,
    jubilados:    filtered.filter((r) => r.jubilado_flag).length,
    terceraEdad:  filtered.filter((r) => r.tercera_edad_flag).length,
    nuevoAnr:     filtered.filter((r) => r.nuevo_anr_flag).length,
  }), [filtered]);

  // ======================= RENDER =======================
  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="bg-brand-700 shadow-md sticky top-0 z-40">
        <div className="max-w-full px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors border-0 bg-transparent p-0 shadow-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <span className="text-white/30 select-none">|</span>
          <h1 className="text-white font-semibold text-base">Consultar Datos</h1>
          {loading && <RefreshCw className="w-4 h-4 text-white/70 animate-spin ml-2" />}
        </div>
      </header>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando datos...</p>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* CONTENIDO */}
      {!loading && !error && (
        <div className="flex gap-0">
          {/* Panel de filtros lateral */}
          <aside className="w-72 shrink-0 p-4 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
              options={options}
            />
          </aside>

          {/* Contenido principal */}
          <main className="flex-1 min-w-0 p-4 flex flex-col gap-5">
            {/* DEBUG VISUAL */}
            <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 text-sm">
              <strong>DEBUG:</strong> Total Original: {rawData.length} | Total Filtrado: {filtered.length}
            </div>

            <StatsCardsBI metrics={metrics} />
            <ChartsBI filtered={filtered} />
            <DataTableBI data={filtered} />
          </main>
        </div>
      )}
    </div>
  );
}
