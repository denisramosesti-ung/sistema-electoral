import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Cuando se abre el modal, reseteamos buscador y página
  useEffect(() => {
    if (show) {
      setSearchTerm("");
      setPage(1);
    }
  }, [show]);

  // Si no debe mostrarse, no renderizamos nada
  if (!show) return null;

  const trimmed = searchTerm.trim().toLowerCase();

  // NUNCA modificamos estado dentro del render
  // Solo calculamos "filtered" a partir de props + estado
  let filtered = [];
  if (trimmed) {
    filtered = (Array.isArray(disponibles) ? disponibles : [])
      .filter((p) => {
        const ciTxt = (p.ci || "").toString().toLowerCase();
        const name = (p.nombre || "").toLowerCase();
        const lastname = (p.apellido || "").toLowerCase();
        return (
          ciTxt.includes(trimmed) ||
          name.includes(trimmed) ||
          lastname.includes(trimmed)
        );
      })
      .sort((a, b) => {
        // CI exacto primero
        if (a.ci && a.ci.toString() === searchTerm) return -1;
        if (b.ci && b.ci.toString() === searchTerm) return 1;
        // Luego por nombre
        return (a.nombre || "").localeCompare(b.nombre || "");
      });
  }

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Subcoordinador"
      : "Agregar Votante";

  const pageSize = 20;
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize || 1)
  );
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(startIdx, startIdx + pageSize);

  const handleClickPersona = (persona) => {
    const bloqueado = persona.asignado === true;
    if (bloqueado) return;
    onAdd(persona);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-4 border-b bg-red-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">{titulo}</h3>
          <button
            onClick={onClose}
            className="hover:text-gray-200 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar CI, nombre o apellido..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                // NO se llama setPage aquí salvo vía useEffect
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              Resultados: {filtered.length}
            </p>
          )}
        </div>

        {/* LISTA DE RESULTADOS */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
          {!searchTerm ? (
            <p className="text-center text-gray-500 py-6">
              Escriba para buscar...
            </p>
          ) : pageData.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No se encontraron resultados
            </p>
          ) : (
            pageData.map((persona) => {
              const bloqueado = persona.asignado === true;
              return (
                <div
                  key={persona.ci}
                  onClick={() => handleClickPersona(persona)}
                  className={`p-4 border rounded-lg transition ${
                    bloqueado
                      ? "bg-gray-200 opacity-60 cursor-not-allowed"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-semibold text-gray-800">
                    {persona.nombre} {persona.apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    CI: {persona.ci}
                    {persona.localidad ? ` — ${persona.localidad}` : ""}
                    {persona.mesa ? ` — Mesa ${persona.mesa}` : ""}
                  </p>

                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya asignado
                      {persona.asignadoPorNombre &&
                        ` por ${persona.asignadoPorNombre}`}
                      {persona.asignadoRol && ` (${persona.asignadoRol})`}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN */}
        {filtered.length > pageSize && (
          <div className="flex justify-between items-center p-4 border-t bg-white">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              ◀ Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setPage((prev) => Math.min(totalPages, prev + 1))
              }
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Siguiente ▶
            </button>
          </div>
        )}

        {/* BOTÓN CERRAR */}
        <div className="p-4 border-t">
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
