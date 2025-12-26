import React, { useState } from "react";
import { Search, X } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!show) return null;

  let filtered = [];

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    filtered = disponibles.filter((p) => {
      const ciTxt = (p.ci || "").toString().toLowerCase();
      const name = (p.nombre || "").toLowerCase();
      const lastname = (p.apellido || "").toLowerCase();

      return (
        ciTxt.includes(term) ||
        name.includes(term) ||
        lastname.includes(term)
      );
    });

    // Mostrar primero coincidencias exactas de CI
    filtered.sort((a, b) => {
      if (a.ci.toString() === searchTerm) return -1;
      if (b.ci.toString() === searchTerm) return 1;
      return 0;
    });

    // Límite para no explotar la app
    filtered = filtered.slice(0, 20);
  }

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-Coordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-red-600 text-white">
          <h3 className="text-xl font-bold">{titulo}</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar CI, nombre o apellido..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="px-6 pb-4 space-y-2 max-h-[300px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Sin resultados…</p>
          ) : (
            filtered.map((persona) => {
              const bloqueado = persona.asignado === true;

              return (
                <div
                  key={persona.ci}
                  onClick={() => !bloqueado && onAdd(persona)}
                  className={`p-4 border rounded-lg transition ${
                    bloqueado
                      ? "bg-gray-200 opacity-60 cursor-not-allowed"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-semibold">
                    {persona.nombre} {persona.apellido}
                  </p>
                  <p className="text-sm text-gray-600">CI: {persona.ci}</p>

                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya asignado por <b>{persona.asignadoPorNombre}</b> ({persona.asignadoRol})
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 hover:bg-gray-400 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPersonModal;
