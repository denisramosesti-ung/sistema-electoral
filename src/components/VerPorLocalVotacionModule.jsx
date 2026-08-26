// ======================= VER POR LOCAL DE VOTACIÓN =======================
// Adaptado de VerPorSeccionalModule.jsx (rama v0/denisramosesti-ung-98829e1b).
// El padrón nuevo ya no usa "seccional": este módulo agrupa/filtra
// exclusivamente por persona.local_votacion, y recibe la estructura ya
// cargada por Dashboard vía props (sin RPC nuevo). No muestra dirección.

import React, { useMemo, useState } from "react";
import { ArrowLeft, Search, Users } from "lucide-react";

const SIN_LOCAL_LABEL = "Sin local de votación";

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
export default function VerPorLocalVotacionModule({ estructura, onVolver }) {
  // Filtros
  const [localFiltro, setLocalFiltro] = useState("");
  const [rolFiltro, setRolFiltro]     = useState("");
  const [busqueda, setBusqueda]       = useState("");

  // ======================= APLANAR ESTRUCTURA (sin RPC) =======================
  const data = useMemo(() => {
    const coords = (estructura?.coordinadores || []).map((p) => ({ ...p, rol: "Coordinador" }));
    const subs   = (estructura?.subcoordinadores || []).map((p) => ({ ...p, rol: "Subcoordinador" }));
    const vots   = (estructura?.votantes || []).map((p) => ({ ...p, rol: "Votante" }));
    return [...coords, ...subs, ...vots].map((p) => ({
      ...p,
      local_votacion: String(p.local_votacion || "").trim() || SIN_LOCAL_LABEL,
    }));
  }, [estructura]);

  // Opciones de local únicas, ordenadas alfabéticamente ("Sin local de votación" al final)
  const locales = useMemo(() => {
    const set = new Set(data.map((r) => r.local_votacion).filter(Boolean));
    const conLocal = [...set]
      .filter((l) => l !== SIN_LOCAL_LABEL)
      .sort((a, b) => a.localeCompare(b, "es"));
    return set.has(SIN_LOCAL_LABEL) ? [...conLocal, SIN_LOCAL_LABEL] : conLocal;
  }, [data]);

  // Datos filtrados
  const filtered = useMemo(() => {
    return data.filter((r) => {
      if (localFiltro && r.local_votacion !== localFiltro) return false;
      if (rolFiltro && r.rol !== rolFiltro) return false;
      if (busqueda) {
        const q = busqueda.toLowerCase().trim();
        const coincide =
          String(r.ci ?? "").toLowerCase().includes(q) ||
          (r.nombre ?? "").toLowerCase().includes(q) ||
          (r.apellido ?? "").toLowerCase().includes(q);
        if (!coincide) return false;
      }
      return true;
    });
  }, [data, localFiltro, rolFiltro, busqueda]);

  // Métricas sobre datos filtrados
  const metrics = useMemo(() => ({
    total:             filtered.length,
    coordinadores:     filtered.filter((r) => r.rol === "Coordinador").length,
    subcoordinadores:  filtered.filter((r) => r.rol === "Subcoordinador").length,
    votantes:          filtered.filter((r) => r.rol === "Votante").length,
  }), [filtered]);

  const selectClass = "px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-400";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onVolver}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors border-0 bg-transparent p-0 shadow-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mi estructura
          </button>
          <span className="text-slate-300">|</span>
          <h2 className="text-base font-semibold text-slate-800">Personas por local de votación</h2>
        </div>
      </div>

      {/* Mini cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard label="Total personas"   value={metrics.total}            accent />
        <MiniCard label="Coordinadores"    value={metrics.coordinadores} />
        <MiniCard label="Subcoordinadores" value={metrics.subcoordinadores} />
        <MiniCard label="Votantes"         value={metrics.votantes} />
      </div>

      {/* Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Local de votación</label>
          <select value={localFiltro} onChange={(e) => setLocalFiltro(e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {locales.map((l) => (
              <option key={l} value={l}>{l}</option>
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
        {(localFiltro || rolFiltro || busqueda) && (
          <button
            onClick={() => { setLocalFiltro(""); setRolFiltro(""); setBusqueda(""); }}
            className="text-xs text-slate-500 hover:text-slate-700 underline self-end pb-2 border-0 bg-transparent p-0 shadow-none"
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
                <th className="px-3 py-2 text-left">Local de votación</th>
                <th className="px-3 py-2 text-left">Rol</th>
                <th className="px-3 py-2 text-left">Nombre y Apellido</th>
                <th className="px-3 py-2 text-left">CI</th>
                <th className="px-3 py-2 text-right">Mesa</th>
                <th className="px-3 py-2 text-right">Orden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                    No se encontraron registros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={`${r.ci}-${r.rol}-${i}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 text-slate-600 max-w-[220px] truncate" title={r.local_votacion}>
                      {r.local_votacion}
                    </td>
                    <td className="px-3 py-2"><RolBadge rol={r.rol} /></td>
                    <td className="px-3 py-2 text-slate-700">{r.nombre} {r.apellido}</td>
                    <td className="px-3 py-2 text-slate-500 font-mono text-xs">{r.ci}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{r.mesa ?? "—"}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{r.orden ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
