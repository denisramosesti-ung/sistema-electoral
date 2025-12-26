import React, { useState } from "react";
import { Search, X, MapPin, Hash } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  if (!show) return null;

  // Filtrar resultados por búsqueda
  let filtered = [];
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    filtered = disponibles.filter((p) =>
      (p.ci || "").toString().includes(term) ||
      (p.nombre || "").toLowerCase().includes(term) ||
      (p.apellido || "").toLowerCase().includes(term)
    );

    // Ordenar: Coincidencias exactas de CI primero
    filtered.sort((a, b) => {
      const exactA = a.ci.toString() === searchTerm;
      const exactB = b.ci.toString() === searchTerm;
      if (exactA && !exactB) return -1;
      if (!exactA && exactB) return 1;
      return 0;
    });
  }

  /////////////////////////////////
  // PAGINACIÓN
  /////////////////////////////////
  const pageSize = 10;
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-red-600 text-white">
          <h3 className="text-xl font-bold">{titulo}</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6 hover:text-gray-200" />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="p-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar CI, nombre o apellido..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* TOTAL DE RESULTADOS */}
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-600">
              Resultados encontrados: <b>{filtered.length}</b>
            </p>
          )}
        </div>

        {/* LISTA DE RESULTADOS */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-3">

          {!searchTerm.trim() ? (
            <p className="text-center text-gray-500 py-6">
              Escriba para buscar…
            </p>
          ) : paginated.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No hay resultados que coincidan.
            </p>
          ) : (
            paginated.map((persona) => {
              const bloqueado = persona.asignado === true;
              const localidad = persona.localidad || "Sin localidad";
              const mesa = persona.mesa ? persona.mesa : "-";

              return (
                <div
                  key={persona.ci}
                  onClick={() => !bloqueado && onAdd(persona)}
                  className={`p-4 border rounded-lg transition flex flex-col gap-1 ${
                    bloqueado
                      ? "bg-gray-200 cursor-not-allowed opacity-60"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-bold text-gray-800 text-lg">
                    {persona.nombre} {persona.apellido}
                  </p>

                  <p className="text-gray-600 text-sm flex items-center gap-1">
                    <Hash className="w-4 h-4 text-gray-500" />
                    CI: {persona.ci}
                  </p>

                  <p className="text-gray-600 text-sm flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {localidad} — Mesa {mesa}
                  </p>

                  {bloqueado && (
                    <p className="text-xs text-red-600 font-medium mt-1">
                      Ya asignado como {persona.asignadoRol} por{" "}
                      <b>{persona.asignadoPorNombre}</b>
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN */}
        {filtered.length > pageSize && (
          <div className="px-6 py-3 border-t bg-gray-50 flex justify-between items-center text-sm">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ◀ Anterior
            </button>

            <span>
              Página <b>{page}</b> de {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente ▶
            </button>
          </div>
        )}

        {/* CERRAR */}
        <div className="px-6 py-5">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPersonModal;
