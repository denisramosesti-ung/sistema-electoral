import React, { useCallback, useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { supabase } from "../supabaseClient";

const COLUMNS = [
  { key: "nombre",                      label: "Nombre"               },
  { key: "apellido",                    label: "Apellido"              },
  { key: "ci",                          label: "CI"                    },
  { key: "seccional",                   label: "Seccional"             },
  { key: "partido",                     label: "Partido"               },
  { key: "edad",                        label: "Edad"                  },
  { key: "mesa",                        label: "Mesa"                  },
  { key: "orden",                       label: "Orden"                 },
  { key: "abogado_flag",                label: "Abogado"               },
  { key: "jubilado_flag",               label: "Jubilado"              },
  { key: "funcionario_publico_flag",    label: "Func. Público"         },
  { key: "tercera_edad_flag",           label: "3ra Edad"              },
  { key: "nuevo_anr_flag",              label: "Nuevo ANR"             },
  { key: "voto_internas_anr_2021",      label: "Int. ANR 2021"         },
  { key: "voto_internas_plra_2021",     label: "Int. PLRA 2021"        },
  { key: "voto_grales_2021",            label: "Grales. 2021"          },
  { key: "voto_anr_presidenciales_2022",label: "ANR 2022"              },
  { key: "voto_plra_presidenciales_2022",label: "PLRA 2022"            },
  { key: "voto_gral_presidenciales_2023",label: "Gral. 2023"           },
];

const displayValue = (v) => {
  if (v === null || v === undefined) return <span className="text-slate-300">-</span>;
  if (v === true)  return <span className="text-green-600 font-medium">Sí</span>;
  if (v === false) return <span className="text-slate-400">No</span>;
  return String(v);
};

export default function ConsultarDatos({ onBack }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("padron_bi")
        .select("*")
        .limit(200);

      if (err) throw new Error(err.message);
      if (!data) throw new Error("No se recibieron datos.");

      if (data.length > 0) console.log("[v0] padron_bi sample row:", data[0]);
      setRows(data);
    } catch (e) {
      console.error("[v0] ConsultarDatos load error:", e);
      setError(e.message || "Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
          <h1 className="text-white font-semibold text-base">
            Consultar Datos — Debug ({rows.length} filas)
          </h1>
          {loading && <RefreshCw className="w-4 h-4 text-white/70 animate-spin ml-2" />}
        </div>
      </header>

      {/* LOADING */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Consultando padron_bi...</p>
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

      {/* TABLA */}
      {!loading && !error && (
        <div className="px-4 py-6 overflow-x-auto">
          <table className="w-full text-xs border-collapse bg-white rounded-xl shadow-sm overflow-hidden">
            <thead>
              <tr className="bg-slate-700 text-white">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-slate-600 last:border-r-0"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.ci ?? i}
                  className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                >
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap"
                    >
                      {displayValue(row[col.key])}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-slate-400 text-sm">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
