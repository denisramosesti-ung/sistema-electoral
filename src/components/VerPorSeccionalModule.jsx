import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Users, RefreshCw } from "lucide-react";
import { supabase } from "../supabaseClient";

// ======================= STAT MINI CARD =======================
function MiniCard({ label, value, accent }) {
  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${accent ? "bg-brand-50 border-brand-200" : "bg-white border-slate-200"}`}>
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${accent ? "text-brand-700" : "text-slate-800"}`}>
        {value !== null && value !== undefined ? Number(value).toLocaleString() : "—"}
      </span>
    </div>
  );
}

// ======================= BADGE =======================
const ROL_COLORS = {
  Coordinador:    "bg-brand-100 text-brand-700",
  Subcoordinador: "bg-amber-100 text-amber-700",
  Votante:        "bg-emerald-100 text-emerald-700",
};

function RolBadge({ rol }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROL_COLORS[rol] ?? "bg-slate-100 text-slate-600"}`}>
      {rol}
    </span>
  );
}

// ======================= MAIN MODULE =======================
export default function VerPorSeccionalModule({ onVolver }) {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Filtros
  const [seccionalFiltro, setSeccionalFiltro] = useState("");
  const [rolFiltro, setRolFiltro]             = useState("");
  const [busqueda, setBusqueda]               = useState("");

  const loadPersonasPorSeccional = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase.rpc("get_personas_por_seccional");
      if (err) throw err;
      setData(rows ?? []);
    } catch (e) {
      console.error("[v0] VerPorSeccional error:", e.message);
      setError(e.message || "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPersonasPorSeccional(); }, [loadPersonasPorSeccional]);

  // Opciones de seccional únicas
  const seccionales = useMemo(() => {
    const set = new Set(data.map((r) => r.seccional).filter(Boolean));
    return [...set].sort((a, b) => Number(a) - Number(b));
  }, [data]);

  // Datos filtrados
  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (seccionalFiltro && r.seccional !== seccionalFiltro) return false;
      if (rolFiltro && r.rol !== rolFiltro) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase().trim();
        const coincide =
          (r.ci     ?? "").toLowerCase().includes(q) ||
          (r.nombre ?? "").toLowerCase().includes(q) ||
          (r.apellido ?? "").toLowerCase().includes(q);
        if (!coincide) return false;
      }
      return true;
    });
  }, [data, seccionalFiltro, rolFiltro, busqueda]);

  // Métricas sobre datos filtrados
  const metrics = useMemo(() => ({
    total:          filtered.length,
    coordinadores:  filtered.filter((r) => r.rol === "Coordinador").length,
    subcoordinadores: filtered.filter((r) => r.rol === "Subcoordinador").length,
    votantes:       filtered.filter((r) => r.rol === "Votante").length,
  }), [filtered]);

  const selectClass = "px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </button>
          <span className="text-slate-300">|</span>
          <h2 className="text-base font-semibold text-slate-800">Personas por seccional</h2>
        </div>
        <button
          onClick={loadPersonasPorSeccional}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12 text-slate-400 text-sm">Cargando datos...</div>
      )}

      {!loading && !error && (
        <>
          {/* Mini cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniCard label="Total personas"    value={metrics.total}           accent />
            <MiniCard label="Coordinadores"     value={metrics.coordinadores} />
            <MiniCard label="Subcoordinadores"  value={metrics.subcoordinadores} />
            <MiniCard label="Votantes"          value={metrics.votantes} />
          </div>

          {/* Filtros */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Seccional</label>
              <select value={seccionalFiltro} onChange={(e) => setSeccionalFiltro(e.target.value)} className={selectClass}>
                <option value="">Todas</option>
                {seccionales.map((s) => (
                  <option key={s} value={s}>Seccional {s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Rol</label>
              <select value={rolFiltro} onChange={(e) => setRolFiltro(e.target.value)} className={selectClass}>
                <option value="">Todos</option>
                <option value="Coordinador">Coordinador</option>
                <option value="Subcoordinador">Subcoordinador</option>
                <option value="Votante">Votante</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="CI, nombre o apellido..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
            </div>
            {(seccionalFiltro || rolFiltro || busqueda) && (
              <button
                onClick={() => { setSeccionalFiltro(""); setRolFiltro(""); setBusqueda(""); }}
                className="text-xs text-slate-500 hover:text-slate-700 underline self-end pb-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Tabla */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users className="w-4 h-4 text-brand-500" />
                Listado
              </div>
              <span className="text-xs text-slate-400">{filtered.length.toLocaleString()} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Seccional</th>
                    <th className="px-3 py-2 text-left">Rol</th>
                    <th className="px-3 py-2 text-left">Nombre y Apellido</th>
                    <th className="px-3 py-2 text-left">CI</th>
                    <th className="px-3 py-2 text-left">Local</th>
                    <th className="px-3 py-2 text-right">Mesa</th>
                    <th className="px-3 py-2 text-right">Orden</th>
                    <th className="px-3 py-2 text-left">Dirección</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">
                        No se encontraron registros con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, i) => (
                      <tr key={`${r.ci}-${r.rol}-${i}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 font-medium text-slate-700">{r.seccional ?? "—"}</td>
                        <td className="px-3 py-2"><RolBadge rol={r.rol} /></td>
                        <td className="px-3 py-2 text-slate-700">{r.nombre} {r.apellido}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-xs">{r.ci}</td>
                        <td className="px-3 py-2 text-slate-600 max-w-[180px] truncate" title={r.local}>{r.local ?? "—"}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{r.mesa ?? "—"}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{r.orden ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate" title={r.direccion}>{r.direccion ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
