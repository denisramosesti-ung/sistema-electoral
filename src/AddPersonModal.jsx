import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!show) return null;

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-coordinador"
      : "Agregar Votante";

  // ======================= FILTRO OPTIMIZADO =======================
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || !disponibles?.length) return [];

    const isNumeric = /^\d+$/.test(term);
    const termDigits = term.replace(/\D/g, "");

    return disponibles
      .filter((p) => {
        const ci = (p.ci || "").toString();
        const nombre = (p.nombre || "").toLowerCase();
        const apellido = (p.apellido || "").toLowerCase();

        if (isNumeric) {
          const ciDigits = ci.replace(/\D/g, "");
          return (
            ciDigits === termDigits ||
            ciDigits.startsWith(termDigits) ||
            ci.includes(term)
          );
        } else {
          return (
            nombre.includes(term) ||
            apellido.includes(term)
          );
        }
      })
      .slice(0, 50); // Limitamos a 50 para evitar lag
  }, [searchTerm, disponibles]);

  const handleInput = (e) => {
    const value = e.target.value;

    // Restringir números si parece CI (opcional)
    if (/^\d*$/.test(value) || value === "" || isNaN(value)) {
      setSearchTerm(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl overflow-hidden">

        {/* HEADER */}
        <div className="p-4 border-b bg-red-600 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold">{titulo}</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar CI, nombre o apellido…"
              onChange={handleInput}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="px-4 pb-4 space-y-2 max-h-[300px] overflow-y-auto">
          {!searchTerm.trim() ? (
            <p className="text-center text-gray-500 py-4">Busque un elector…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Sin resultados…</p>
          ) : (
            filtered.map((p) => {
              const locked = p.asignado;
              return (
                <div
                  key={p.ci}
                  onClick={() => !locked && onAdd(p)}
                  className={`p-3 border rounded-lg transition ${
                    locked
                      ? "bg-gray-200 opacity-60 cursor-not-allowed"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-semibold">
                    {p.nombre} {p.apellido}
                  </p>
                  <p className="text-xs text-gray-600">CI: {p.ci}</p>
                  {locked && (
                    <p className="text-[10px] text-red-600 mt-1">
                      Ya asignado
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3">
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
