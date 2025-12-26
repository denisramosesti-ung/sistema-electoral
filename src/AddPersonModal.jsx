import React, { useState } from "react";
import { Search, X } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!show) return null;

  // Buscar y fusionar resultados por CI o texto
  const filtered = (() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    const exactCI = disponibles.filter((p) => {
      const ci = p?.ci?.toString() || "";
      return ci.startsWith(term);
    });

    const nameMatches = disponibles.filter((p) =>
      (p?.nombre || "").toLowerCase().includes(term) ||
      (p?.apellido || "").toLowerCase().includes(term)
    );

    const combined = [...exactCI, ...nameMatches].filter(
      (p, index, arr) => arr.findIndex((x) => x?.ci === p?.ci) === index
    );

    return combined;
  })();

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-coordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b bg-red-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">{titulo}</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value.replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúñÑ\s]/g, ""))
              }
              placeholder="Buscar por CI, nombre o apellido..."
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          {searchTerm.trim() !== "" && (
            <p className="text-xs text-gray-600 mt-2">
              Resultados: {filtered.length}
            </p>
          )}
        </div>

        {/* Results */}
        <div className="px-5 pb-4 space-y-2 overflow-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Sin resultados…</p>
          ) : (
            filtered.slice(0, 200).map((persona) => {
              const bloqueado = persona?.asignado === true;

              const nombre = persona?.nombre || "Sin nombre";
              const apellido = persona?.apellido || "";
              const ci = persona?.ci?.toString() || "N/A";
              const localidad = persona?.localidad || "Sin localidad";
              const mesa = persona?.mesa || "-";

              return (
                <div
                  key={ci}
                  onClick={() => !bloqueado && onAdd(persona)}
                  className={`p-4 border rounded-lg transition ${
                    bloqueado
                      ? "bg-gray-200 opacity-60 cursor-not-allowed"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-semibold">{nombre} {apellido}</p>
                  <p className="text-sm text-gray-600">CI: {ci}</p>
                  <p className="text-xs text-gray-500">
                    {localidad} — Mesa {mesa}
                  </p>

                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya asignado por <b>{persona.asignadoPorNombre || "N/A"}</b> (
                      {persona.asignadoRol || "N/A"})
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 hover:bg-gray-400 py-2 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPersonModal;
