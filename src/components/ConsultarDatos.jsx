import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Printer } from "lucide-react";
import { supabase } from "../supabaseClient";
import FilterPanel  from "./consultarDatos/FilterPanel";
import StatsCardsBI from "./consultarDatos/StatsCardsBI";
import ChartsBI     from "./consultarDatos/ChartsBI";
import DataTableBI  from "./consultarDatos/DataTableBI";

// ======================= HELPERS =======================

/** Convierte cualquier valor a boolean (maneja true, false, "true", "false", "si", "SI") */
const toBool = (val) => {
  if (val === true) return true;
  if (val === false) return false;
  if (typeof val === "string") {
    const v = val.toLowerCase().trim();
    return v === "true" || v === "si";
  }
  return false;
};

/** Detecta si un campo TEXT tiene un valor significativo (no vacío, no null, no "false") */
const hasValue = (val) => {
  if (val === null || val === undefined) return false;
  const v = String(val).trim().toLowerCase();
  return v !== "" && v !== "false" && v !== "null";
};

/** Detecta si un campo BOOLEAN o TEXT representa "true" o "si" */
const isTrue = (val) => {
  if (val === true) return true;
  if (typeof val === "string") {
    const v = val.trim().toLowerCase();
    return v === "true" || v === "si";
  }
  return false;
};

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

// ======================= COMPONENTE PRINCIPAL =======================
export default function ConsultarDatos({ onBack }) {
  const [rawData,  setRawData]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filters,  setFilters]  = useState(DEFAULT_FILTERS);

  // ======================= CARGA INICIAL (TODOS LOS REGISTROS) =======================
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("padron_bi")
        .select("*");

      if (err) throw new Error(err.message);
      if (!data) throw new Error("No se recibieron datos.");

      setRawData(data);
    } catch (e) {
      console.error("[v0] ConsultarDatos load error:", e);
      setError(e.message || "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset filtros
  const handleReset = () => setFilters(DEFAULT_FILTERS);

  // Imprimir resultados filtrados
  const imprimirResultados = () => {
    const contenido = document.getElementById("tabla-resultados")?.innerHTML;
    if (!contenido) return;

    const ventana = window.open("", "_blank");
    if (!ventana) return;

    ventana.document.write(`
      <html>
        <head>
          <title>Resultados Filtrados</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            h2 { margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <h2>Resultados Filtrados (${filtered.length.toLocaleString()} registros)</h2>
          <table>${contenido}</table>
        </body>
      </html>
    `);

    ventana.document.close();
    ventana.print();
  };

  // ======================= SELECT OPTIONS (desde dataset completo) =======================
  const options = useMemo(() => ({
    partidos:          toOptions(rawData, "partido"),
    seccionales:       toOptions(rawData, "seccional"),
    entidadesPublicas: toOptions(rawData, "funcionario_publico"),
  }), [rawData]);

  // ======================= FILTRADO EN MEMORIA =======================
  const filtered = useMemo(() => {
    return rawData.filter((item) => {
      // Filtros de categorías (checkbox)
      // abogados, funcionario_publico, jubilados, exa_san_jose → TEXT (usar hasValue)
      // nuevo_anr → BOOLEAN o TEXT (usar isTrue)
      // tercera_edad → no tocar (ya funciona)
      if (filters.abogados            && !hasValue(item.abogados))            return false;
      if (filters.funcionario_publico && !hasValue(item.funcionario_publico)) return false;
      if (filters.jubilados           && !hasValue(item.jubilados))           return false;
      if (filters.tercera_edad        && !toBool(item.tercera_edad))          return false;
      if (filters.nuevo_anr           && !isTrue(item.nuevo_anr))             return false;
      if (filters.exa_san_jose        && !hasValue(item.exa_san_jose))        return false;

      // Filtros de texto
      if (filters.partido && item.partido !== filters.partido) return false;
      if (filters.seccional && String(item.seccional) !== String(filters.seccional)) return false;
      if (filters.entidad_publica && item.funcionario_publico !== filters.entidad_publica) return false;

      // Edad
      const edad = item.edad != null ? Number(item.edad) : null;
      if (filters.edadMin !== "" && (edad === null || edad < Number(filters.edadMin))) return false;
      if (filters.edadMax !== "" && (edad === null || edad > Number(filters.edadMax))) return false;

      // Votación
      if (filters.voto_internas_anr_2021 === "si"  && !toBool(item.voto_internas_anr_2021))  return false;
      if (filters.voto_internas_anr_2021 === "no"  &&  toBool(item.voto_internas_anr_2021))  return false;
      if (filters.voto_internas_plra_2021 === "si" && !toBool(item.voto_internas_plra_2021)) return false;
      if (filters.voto_internas_plra_2021 === "no" &&  toBool(item.voto_internas_plra_2021)) return false;
      if (filters.voto_grales_2021 === "si"        && !toBool(item.voto_grales_2021))        return false;
      if (filters.voto_grales_2021 === "no"        &&  toBool(item.voto_grales_2021))        return false;
      if (filters.voto_anr_presidenciales_2022 === "si"  && !toBool(item.voto_anr_presidenciales_2022))  return false;
      if (filters.voto_anr_presidenciales_2022 === "no"  &&  toBool(item.voto_anr_presidenciales_2022))  return false;
      if (filters.voto_plra_presidenciales_2022 === "si" && !toBool(item.voto_plra_presidenciales_2022)) return false;
      if (filters.voto_plra_presidenciales_2022 === "no" &&  toBool(item.voto_plra_presidenciales_2022)) return false;
      if (filters.voto_gral_presidenciales_2023 === "si" && !toBool(item.voto_gral_presidenciales_2023)) return false;
      if (filters.voto_gral_presidenciales_2023 === "no" &&  toBool(item.voto_gral_presidenciales_2023)) return false;

      return true;
    });
  }, [rawData, filters]);

  // ======================= METRICS (sobre datos filtrados) =======================
  const metrics = useMemo(() => ({
    total:        filtered.length,
    abogados:     filtered.filter((r) => hasValue(r.abogados)).length,
    funcionarios: filtered.filter((r) => hasValue(r.funcionario_publico)).length,
    jubilados:    filtered.filter((r) => hasValue(r.jubilados)).length,
    terceraEdad:  filtered.filter((r) => toBool(r.tercera_edad)).length,
    nuevoAnr:     filtered.filter((r) => isTrue(r.nuevo_anr)).length,
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
          {!loading && (
            <span className="ml-auto text-white/70 text-xs">
              {filtered.length.toLocaleString()} de {rawData.length.toLocaleString()} registros
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
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 min-w-0 p-4 flex flex-col gap-5">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Cargando datos...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Resultados */}
          {!loading && !error && (
            <>
              <StatsCardsBI metrics={metrics} />
              <ChartsBI filtered={filtered} />

              {/* Botón imprimir */}
              <div className="flex justify-end">
                <button
                  onClick={imprimirResultados}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir resultados
                </button>
              </div>

              <DataTableBI data={filtered} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
