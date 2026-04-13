import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "../supabaseClient";
import FilterPanel from "./consultarDatos/FilterPanel";
import StatsCardsBI from "./consultarDatos/StatsCardsBI";
import ChartsBI from "./consultarDatos/ChartsBI";
import DataTableBI from "./consultarDatos/DataTableBI";

// ======================= NORMALIZACIÓN =======================
const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  const s = String(v || "").trim().toUpperCase();
  return s === "S" || s === "SI" || s === "1" || s === "TRUE";
};

// ======================= FILTROS POR DEFECTO =======================
const DEFAULT_FILTERS = {
  abogados: false,
  funcionario_publico: false,
  jubilados: false,
  tercera_edad: false,
  nuevo_anr: false,
  exa_san_jose: false,
  partido: "",
  seccional: "",
  local_votacion: "",
  universidades: "",
  cargo_seccionales: "",
  edadMin: "",
  edadMax: "",
};

// ======================= DEDUPLICATE OPTION =======================
const toOptions = (arr, key) =>
  [...new Set(arr.map((r) => r[key]).filter((v) => v != null && v !== ""))].sort();

export default function ConsultarDatos({ onBack }) {
  const [rawData, setRawData] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // ======================= CARGA ÚNICA DE DATOS =======================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Consulta 1: métricas pre-calculadas desde la vista SQL
      const { data: statsData, error: statsErr } = await supabase
        .from("vw_dashboard_padron")
        .select("*")
        .single();

      if (statsErr) {
        console.error("[v0] vw_dashboard_padron error:", statsErr.message);
        // No es fatal — seguimos con cálculo frontend como fallback
      } else {
        setDashboardStats(statsData);
      }

      // Consulta 2: datos completos para filtros/tabla/gráficos
      const { data, error: err } = await supabase
        .from("padron")
        .select(`
          ci,
          nombre,
          apellido,
          seccional,
          local_votacion,
          padron_detalle_bi (*)
        `);

      if (err) throw err;
      if (!data) throw new Error("No se recibieron datos del servidor.");

      // Flatten: combinar padron + padron_detalle_bi en un solo objeto
      const merged = data.map((r) => {
        const det = Array.isArray(r.padron_detalle_bi)
          ? r.padron_detalle_bi[0] || {}
          : r.padron_detalle_bi || {};
        return {
          ci: r.ci,
          nombre: r.nombre,
          apellido: r.apellido,
          seccional: r.seccional,
          local_votacion: r.local_votacion,
          // Campos de padron_detalle_bi
          edad: typeof det.edad === "number" ? det.edad : (det.edad ? parseInt(det.edad, 10) : null),
          partido: det.partido || null,
          // Normalized booleans desde padron_detalle_bi
          _abogado:          toBool(det.abogados),
          _funcionario:      toBool(det.funcionario_publico),
          _jubilado:         toBool(det.jubilados),
          _terceraEdad:      toBool(det.tercera_edad),
          _nuevoAnr:         toBool(det.nuevo_anr),
          _exaSanJose:       toBool(det.exa_san_jose),
          // Select options desde padron_detalle_bi
          universidades:     det.universidades || null,
          cargo_seccionales: det.cargo_seccionales || null,
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ======================= SELECT OPTIONS (memoized) =======================
  const options = useMemo(() => ({
    partidos:        toOptions(rawData, "partido"),
    seccionales:     toOptions(rawData, "seccional"),
    locales:         toOptions(rawData, "local_votacion"),
    universidades:   toOptions(rawData, "universidades"),
    cargosSeccionales: toOptions(rawData, "cargo_seccionales"),
  }), [rawData]);

  // ======================= FILTERED DATA (memoized) =======================
  const filtered = useMemo(() => {
    return rawData.filter((r) => {
      if (filters.abogados         && !r._abogado)     return false;
      if (filters.funcionario_publico && !r._funcionario) return false;
      if (filters.jubilados         && !r._jubilado)    return false;
      if (filters.tercera_edad      && !r._terceraEdad) return false;
      if (filters.nuevo_anr         && !r._nuevoAnr)    return false;
      if (filters.exa_san_jose      && !r._exaSanJose)  return false;

      if (filters.partido         && r.partido         !== filters.partido)         return false;
      if (filters.seccional       && r.seccional       !== filters.seccional)       return false;
      if (filters.local_votacion  && r.local_votacion  !== filters.local_votacion)  return false;
      if (filters.universidades   && r.universidades   !== filters.universidades)   return false;
      if (filters.cargo_seccionales && r.cargo_seccionales !== filters.cargo_seccionales) return false;

      if (filters.edadMin !== "" && (r.edad === null || r.edad < filters.edadMin)) return false;
      if (filters.edadMax !== "" && (r.edad === null || r.edad > filters.edadMax)) return false;

      return true;
    });
  }, [rawData, filters]);

  // ======================= METRICS (memoized) =======================
  // Usa la vista SQL pre-calculada si los filtros están en estado inicial,
  // de lo contrario calcula en frontend sobre los datos filtrados.
  const hasActiveFilters = useMemo(
    () => Object.entries(filters).some(([, v]) => v !== false && v !== ""),
    [filters]
  );

  const metrics = useMemo(() => {
    if (!hasActiveFilters && dashboardStats) {
      return {
        total:        dashboardStats.total       ?? 0,
        abogados:     dashboardStats.abogados     ?? 0,
        funcionarios: dashboardStats.funcionarios ?? 0,
        jubilados:    dashboardStats.jubilados    ?? 0,
        terceraEdad:  dashboardStats.tercera_edad ?? 0,
        nuevoAnr:     dashboardStats.nuevo_anr    ?? 0,
      };
    }
    // Fallback: calcular sobre datos filtrados
    return {
      total:        filtered.length,
      abogados:     filtered.filter((r) => r._abogado).length,
      funcionarios: filtered.filter((r) => r._funcionario).length,
      jubilados:    filtered.filter((r) => r._jubilado).length,
      terceraEdad:  filtered.filter((r) => r._terceraEdad).length,
      nuevoAnr:     filtered.filter((r) => r._nuevoAnr).length,
    };
  }, [filtered, dashboardStats, hasActiveFilters]);

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
            {loading && (
              <RefreshCw className="w-4 h-4 text-white/70 animate-spin" />
            )}
            {!loading && (
              <span className="text-xs text-white/60">
                {rawData.length.toLocaleString("es-PY")} registros cargados
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

          {/* Stats */}
          <StatsCardsBI metrics={metrics} />

          {/* Body: filter sidebar + charts + table */}
          <div className="flex flex-col lg:flex-row gap-5">

            {/* Sidebar */}
            <div className="lg:w-64 shrink-0">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                options={options}
              />
            </div>

            {/* Main content */}
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
