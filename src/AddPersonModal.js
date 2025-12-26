import React, { useState } from "react";
import { Search, X } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  if (!show) return null;

  let filtered = [];
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    filtered = disponibles
      .filter(
        (p) =>
          (p.ci || "").toString().includes(searchTerm) ||
          (p.nombre || "").toLowerCase().includes(term) ||
          (p.apellido || "").toLowerCase().includes(term)
      );

    // Relevancia: coincidencias exactas de CI primero
    filtered.sort((a, b) => {
      if (a.ci.toString() === searchTerm) return -1;
      if (b.ci.toString() === searchTerm) return 1;
      return 0;
    });
  }

  const pageSize = 8; // Cantidad por página para móvil/PC
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-coordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-red-600 text-white">
          <h3 className="text-xl font-bold">{titulo}</h3>
          <button onClick={onClose} className="hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar CI, nombre o apellido..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // reset page on new search
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          {searchTerm.trim() && (
            <p className="text-xs mt-2 text-gray-600">
              Resultados: {filtered.length}
            </p>
          )}
        </div>

        {/* RESULTADOS PAGINADOS */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
          {!searchTerm.trim() ? (
            <p className="text-center text-gray-500 py-6">
              Escribe para buscar…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No se encontraron resultados.
            </p>
          ) : (
            paginated.map((persona) => {
              const bloqueado = persona.asignado === true;

              return (
                <div
                  key={persona.ci}
                  onClick={() => !bloqueado && onAdd(persona)}
                  className={`p-4 border rounded-lg transition relative ${
                    bloqueado
                      ? "bg-gray-200 cursor-not-allowed opacity-60"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-semibold text-gray-800">
                    {persona.nombre} {persona.apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    CI: {persona.ci}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {(persona.localidad || "Sin localidad")}
                    {persona.mesa ? ` • Mesa ${persona.mesa}` : ""}
                  </p>

                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya asignado por <b>{persona.asignadoPorNombre || "Otro referente"}</b>{" "}
                      {persona.asignadoRol ? `(${persona.asignadoRol})` : ""}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN */}
        {filtered.length > pageSize && (
          <div className="px-6 pb-3 flex justify-between items-center text-sm">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              ◀ Anterior
            </button>

            <span>
              Página {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Siguiente ▶
            </button>
          </div>
        )}

        {/* BOTÓN CERRAR */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full mt-2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPersonModal;
