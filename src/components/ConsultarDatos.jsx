import React, { useCallback, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Search } from "lucide-react";
import { supabase } from "../supabaseClient";
import FilterPanel  from "./consultarDatos/FilterPanel";
import StatsCardsBI from "./consultarDatos/StatsCardsBI";
import ChartsBI     from "./consultarDatos/ChartsBI";
import DataTableBI  from "./consultarDatos/DataTableBI";

// ======================= HELPERS =======================

/** Convierte string "true"/"false" o boolean a boolean */
const toBool = (val) => val === true || val === "true";

/** Normaliza un registro crudo de padron_bi a tipos consistentes */
const normalizeRow = (r) => ({
  ...r,
  edad:  r.edad  != null ? Number(r.edad)  : null,
  mesa:  r.mesa  != null ? Number(r.mesa)  : null,
  orden: r.orden != null ? Number(r.orden) : null,
  abogado_flag:             toBool(r.abogados),
  jubilado_flag:            toBool(r.jubilados),
  funcionario_publico_flag: toBool(r.funcionario_publico),
  tercera_edad_flag:        toBool(r.tercera_edad),
  nuevo_anr_flag:           toBool(r.nuevo_anr),
  exa_san_jose_flag:        toBool(r.exa_san_jose),
  voto_internas_anr_2021:        toBool(r.voto_internas_anr_2021),
  voto_internas_plra_2021:       toBool(r.voto_internas_plra_2021),
  voto_grales_2021:              toBool(r.voto_grales_2021),
  voto_anr_presidenciales_2022:  toBool(r.voto_anr_presidenciales_2022),
  voto_plra_presidenciales_2022: toBool(r.voto_plra_presidenciales_2022),
  voto_gral_presidenciales_2023: toBool(r.voto_gral_presidenciales_2023),
});

/** Valores únicos no nulos de una clave, ordenados */
const toOptions = (data, key) =>
  [...new Set(data.map((r) => r[key]).filter((v) => v != null && v !== ""))].sort();

// ======================= FILTROS POR DEFECTO =======================
const DEFAULT_FILTERS = {
  abogados:            false,
  funcionario_publico: false,
  jubilados:           false,
  tercera_edad:        false,
  nuevo_anr:           false,
  exa_san_jose:        false,
  partido:             "",
  seccional:           "",
  entidad_publica:     "",
  edadMin:             "",
  edadMax:             "",
  voto_internas_anr_2021:        "",
  voto_internas_plra_2021:       "",
  voto_grales_2021:              "",
  voto_anr_presidenciales_2022:  "",
  voto_plra_presidenciales_2022: "",
  voto_gral_presidenciales_2023: "",
};

/** Devuelve true si al menos un filtro tiene valor activo */
const hasActiveFilters = (f) =>
  f.abogados || f.funcionario_publico || f.jubilados ||
  f.tercera_edad || f.nuevo_anr || f.exa_san_jose ||
  f.partido !== "" || f.seccional !== "" || f.entidad_publica !== "" ||
  f.edadMin !== "" || f.edadMax !== "" ||
  f.voto_internas_anr_2021 !== "" || f.voto_internas_plra_2021 !== "" ||
  f.voto_grales_2021 !== "" || f.voto_anr_presidenciales_2022 !== "" ||
  f.voto_plra_presidenciales_2022 !== "" || f.voto_gral_presidenciales_2023 !== "";

// ======================= COMPONENTE PRINCIPAL =======================
export default function ConsultarDatos({ onBack }) {
  const [rawData,   setRawData]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [searched,  setSearched]  = useState(false);
  const [filters,   setFilters]   = useState(DEFAULT_FILTERS);

  // ======================= QUERY CON FILTROS EN SUPABASE =======================
  const loadData = useCallback(async (activeFilters) => {
    if (!hasActiveFilters(activeFilters)) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      let query = supabase.from("padron_bi").select("*");

      // Filtros escalares enviados directo a Supabase
      if (activeFilters.partido)        query = query.eq("partido",  activeFilters.partido);
      if (activeFilters.seccional)      query = query.eq("seccional", activeFilters.seccional);
      if (activeFilters.entidad_publica) query = query.eq("funcionario_publico", activeFilters.entidad_publica);
      if (activeFilters.edadMin !== "")  query = query.gte("edad", Number(activeFilters.edadMin));
      if (activeFilters.edadMax !== "")  query = query.lte("edad", Number(activeFilters.edadMax));

      // Flags booleanos
      if (activeFilters.abogados)            query = query.eq("abogados",            true);
      if (activeFilters.funcionario_publico)  query = query.eq("funcionario_publico", true);
      if (activeFilters.jubilados)            query = query.eq("jubilados",           true);
      if (activeFilters.tercera_edad)         query = query.eq("tercera_edad",        true);
      if (activeFilters.nuevo_anr)            query = query.eq("nuevo_anr",           true);
      if (activeFilters.exa_san_jose)         query = query.eq("exa_san_jose",        true);

      // Votación
      if (activeFilters.voto_internas_anr_2021 !== "") {
        query = query.eq("voto_internas_anr_2021", activeFilters.voto_internas_anr_2021 === "si");
      }
      if (activeFilters.voto_internas_plra_2021 !== "") {
        query = query.eq("voto_internas_plra_2021", activeFilters.voto_internas_plra_2021 === "si");
      }
      if (activeFilters.voto_grales_2021 !== "") {
        query = query.eq("voto_grales_2021", activeFilters.voto_grales_2021 === "si");
      }
      if (activeFilters.voto_anr_presidenciales_2022 !== "") {
        query = query.eq("voto_anr_presidenciales_2022", activeFilters.voto_anr_presidenciales_2022 === "si");
      }
      if (activeFilters.voto_plra_presidenciales_2022 !== "") {
        query = query.eq("voto_plra_presidenciales_2022", activeFilters.voto_plra_presidenciales_2022 === "si");
      }
      if (activeFilters.voto_gral_presidenciales_2023 !== "") {
        query = query.eq("voto_gral_presidenciales_2023", activeFilters.voto_gral_presidenciales_2023 === "si");
      }

      // Limitar resultados para evitar timeout
      query = query.range(0, 2999);

      const { data, error: err } = await query;

      if (err) throw new Error(err.message);
      if (!data) throw new Error("No se recibieron datos.");

      setRawData(data.map(normalizeRow));
    } catch (e) {
      console.error("[v0] ConsultarDatos load error:", e);
      setError(e.message || "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Disparar búsqueda al hacer clic en "Buscar"
  const handleSearch = () => loadData(filters);

  // Reset completo
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setRawData([]);
    setSearched(false);
    setError(null);
  };

  // ======================= SELECT OPTIONS (desde resultados actuales) =======================
  const options = useMemo(() => ({
    partidos:          toOptions(rawData, "partido"),
    seccionales:       toOptions(rawData, "seccional"),
    entidadesPublicas: toOptions(rawData, "funcionario_publico"),
  }), [rawData]);

  // ======================= METRICS =======================
  const metrics = useMemo(() => ({
    total:        rawData.length,
    abogados:     rawData.filter((r) => r.abogado_flag).length,
    funcionarios: rawData.filter((r) => r.funcionario_publico_flag).length,
    jubilados:    rawData.filter((r) => r.jubilado_flag).length,
    terceraEdad:  rawData.filter((r) => r.tercera_edad_flag).length,
    nuevoAnr:     rawData.filter((r) => r.nuevo_anr_flag).length,
  }), [rawData]);

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
          {searched && !loading && (
            <span className="ml-auto text-white/70 text-xs">
              {rawData.length.toLocaleString()} resultado{rawData.length !== 1 ? "s" : ""}
              {rawData.length === 3000 ? " (máx. 3000)" : ""}
            </span>
          )}
        </div>
      </header>

      <div className="flex gap-0">
        {/* Panel de filtros lateral */}
        <aside className="w-72 shrink-0 p-4 sticky top-[52px] self-start h-[calc(100vh-52px)] overflow-y-auto">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onReset={handleReset}
            options={options}
          />

          {/* Botón Buscar */}
          <div className="mt-4">
            <button
              onClick={handleSearch}
              disabled={loading || !hasActiveFilters(filters)}
              className="w-full inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0 p-4 flex flex-col gap-5">
          {/* Estado inicial — sin búsqueda */}
          {!searched && !loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
              <Search className="w-10 h-10 opacity-30" />
              <p className="text-sm">Selecciona filtros y presiona <strong>Buscar</strong> para consultar datos.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Consultando datos...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Resultados */}
          {!loading && !error && searched && rawData.length > 0 && (
            <>
              <StatsCardsBI metrics={metrics} />
              <ChartsBI filtered={rawData} />
              <DataTableBI data={rawData} />
            </>
          )}

          {/* Sin resultados */}
          {!loading && !error && searched && rawData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-400">
              <p className="text-sm">No se encontraron registros con los filtros seleccionados.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
