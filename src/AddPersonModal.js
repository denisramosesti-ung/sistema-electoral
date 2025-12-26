import React, { useState, useMemo } from "react";
import { Search, X, UserPlus } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!show) return null;

  const term = searchTerm.trim().toLowerCase();

  // ORDEN PERSONALIZADO: CI exacto primero
  const filtered = useMemo(() => {
    if (!term) return [];

    const exactCI = disponibles.filter((p) =>
      (p.ci || "").toString().startsWith(term)
    );
    const nameMatches = disponibles.filter(
      (p) =>
        (p.nombre || "").toLowerCase().includes(term) ||
        (p.apellido || "").toLowerCase().includes(term)
    );

    const merge = [...exactCI, ...nameMatches].filter(
      (p, i, arr) => arr.findIndex((x) => x.ci === p.ci) === i
    );

    return merge;
  }, [term, disponibles]);

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-coordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="p-4 bg-red-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">{titulo}</h3>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        {/* BUSCADOR */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={searchTerm}
              placeholder="Buscar por CI..."
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                setSearchTerm(v);
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* INFO DE RESULTADOS */}
        {term.length > 0 && (
          <p className="px-4 text-xs text-gray-600 mb-1">
            Resultados: {filtered.length}
          </p>
        )}

        {/* LISTA SCROLLEABLE */}
        <div className="px-4 space-y-2 max-h-[380px] overflow-y-auto pb-3">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Sin resultados…
            </p>
          ) : (
            filtered.map((persona) => {
              const bloqueado = persona.asignado === true;
              return (
                <div
                  key={persona.ci}
                  onClick={() => !bloqueado && onAdd(persona)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition ${
                    bloqueado
                      ? "bg-gray-200 opacity-60 cursor-not-allowed"
                      : "hover:border-red-500 cursor-pointer"
                  }`}
                >
                  <div>
                    <p className="font-semibold leading-tight">
                      {persona.nombre} {persona.apellido}
                    </p>
                    <p className="text-xs text-gray-600">
                      CI: {persona.ci}
                      {persona.localidad ? ` • ${persona.localidad}` : ""}
                    </p>
                    {bloqueado && (
                      <p className="text-[11px] text-red-600 mt-1">
                        Ya asignado
                      </p>
                    )}
                  </div>

                  {!bloqueado && (
                    <UserPlus className="w-5 h-5 text-red-600" />
                  )}

                  {bloqueado && (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-lg text-sm"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddPersonModal;
