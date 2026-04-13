import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "../supabaseClient";
import FilterPanel from "./consultarDatos/FilterPanel";
import StatsCardsBI from "./consultarDatos/StatsCardsBI";
import ChartsBI from "./consultarDatos/ChartsBI";
import DataTableBI from "./consultarDatos/DataTableBI";

// ======================= HELPERS =======================

/** Un voto es "Sí" cuando el valor es booleano true */
const isYesVote = (v) => v === true;

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

  // ======================= CARGA ÚNICA DESDE padron_bi =======================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.from("padron_bi").select("*");

      if (err) throw new Error(err.message);
      if (!data) throw new Error("No se recibieron datos.");

      if (data.length > 0) console.log("[v0] padron_bi sample row:", data[0]);
      setRawData(data);
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
    locales:           toOptions(rawData, "local_votacion"),
    universidades:     toOptions(rawData, "universidades"),
    cargosSeccionales: toOptions(rawData, "cargo_seccionales"),
  }), [rawData]);

  // ======================= FILTRADO — usa flags directos de padron_bi =======================
  const filtered = useMemo(() => {
    return rawData.filter((r) => {
      // Flags booleanos directos
      if (filters.abogados            && !r.abogado_flag)             return false;
      if (filters.funcionario_publico  && !r.funcionario_publico_flag) return false;
      if (filters.jubilados            && !r.jubilado_flag)            return false;
      if (filters.tercera_edad         && !r.tercera_edad_flag)        return false;
      if (filters.nuevo_anr            && !r.nuevo_anr_flag)           return false;
      if (filters.exa_san_jose         && !r.exa_san_jose_flag)        return false;

      // Selects de texto
      if (filters.partido        && r.partido        !== filters.partido)        return false;
      if (filters.seccional      && r.seccional      !== filters.seccional)      return false;
      if (filters.local_votacion && r.local_votacion !== filters.local_votacion) return false;
      if (filters.universidades     && r.universidades     !== filters.universidades)     return false;
      if (filters.cargo_seccionales && r.cargo_seccionales !== filters.cargo_seccionales) return false;

      // Edad
      if (filters.edadMin !== "" && (r.edad === null || r.edad < Number(filters.edadMin))) return false;
      if (filters.edadMax !== "" && (r.edad === null || r.edad > Number(filters.edadMax))) return false;

      // Votación
      if (filters.voto_internas_anr_2021 === "si"        && !isYesVote(r.voto_internas_anr_2021))        return false;
      if (filters.voto_internas_anr_2021 === "no"        &&  isYesVote(r.voto_internas_anr_2021))        return false;
      if (filters.voto_internas_plra_2021 === "si"       && !isYesVote(r.voto_internas_plra_2021))       return false;
      if (filters.voto_internas_plra_2021 === "no"       &&  isYesVote(r.voto_internas_plra_2021))       return false;
      if (filters.voto_grl_2021 === "si"                 && !isYesVote(r.voto_grl_2021))                 return false;
      if (filters.voto_grl_2021 === "no"                 &&  isYesVote(r.voto_grl_2021))                 return false;
      if (filters.voto_anr_presidenciales_2022 === "si"  && !isYesVote(r.voto_anr_presidenciales_2022))  return false;
      if (filters.voto_anr_presidenciales_2022 === "no"  &&  isYesVote(r.voto_anr_presidenciales_2022))  return false;
      if (filters.voto_plra_presidenciales_2022 === "si" && !isYesVote(r.voto_plra_presidenciales_2022)) return false;
      if (filters.voto_plra_presidenciales_2022 === "no" &&  isYesVote(r.voto_plra_presidenciales_2022)) return false;
      if (filters.voto_grl_presidenciales_2023 === "si"  && !isYesVote(r.voto_grl_presidenciales_2023))  return false;
      if (filters.voto_grl_presidenciales_2023 === "no"  &&  isYesVote(r.voto_grl_presidenciales_2023))  return false;

      return true;
    });
  }, [rawData, filters]);

  // ======================= METRICS (desde filtered, flags directos) =======================
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
