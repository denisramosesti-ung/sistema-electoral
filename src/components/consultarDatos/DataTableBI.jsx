import React, { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

const COLUMNS = [
  { key: "nombre",         label: "Nombre"          },
  { key: "apellido",       label: "Apellido"         },
  { key: "ci",             label: "CI"               },
  { key: "seccional",      label: "Seccional"        },
  { key: "local_votacion", label: "Local Votación"   },
  { key: "mesa",           label: "Mesa"             },
  { key: "orden",          label: "Orden"            },
  { key: "edad",           label: "Edad"             },
  { key: "partido",        label: "Partido"          },
];

export default function DataTableBI({ data }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) => {
      const nombre = `${r.nombre || ""} ${r.apellido || ""}`.toLowerCase();
      const ci = String(r.ci || "").toLowerCase();
      return nombre.includes(q) || ci.includes(q);
    });
  }, [data, query]);

  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = searched.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      {/* Table header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800">
          Resultados{" "}
          <span className="text-slate-400 font-normal">
            ({searched.length.toLocaleString("es-PY")} registros)
          </span>
        </p>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="Buscar por nombre o CI..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-slate-50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table id="tabla-resultados" className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-10 text-center text-slate-400 text-xs">
                  Sin resultados
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr key={`${row.ci}-${idx}`} className="hover:bg-slate-50 transition-colors">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                      {row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500">
            Página {safePage} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-none"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-none"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
