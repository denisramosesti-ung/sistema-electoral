import React, { useState } from "react";
import { Search, X } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!show) return null;

  // Solo números en CI
  const handleSearch = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // solo números
    setSearchTerm(value);
  };

  // Filtrar: primero CI que empieza igual → luego resto del nombre
  const filtered = disponibles
    .filter((p) =>
      p.ci.toString().startsWith(searchTerm)
    )
    .slice(0, 200);

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-coordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="p-5 border-b bg-red-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Buscador */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar CI..."
              value={searchTerm}
              onChange={handleSearch}
              maxLength={10}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="px-4 pb-3 max-h-[350px] overflow-y-auto">
          {filtered.length === 0 && searchTerm !== "" ? (
            <p className="text-center text-gray-500 py-6">Sin resultados…</p>
          ) : (
            filtered.map((persona) => (
              <div
                key={persona.ci}
                onClick={() => onAdd(persona)}
                className="p-4 bg-gray-50 hover:bg-red-50 border rounded-lg cursor-pointer mb-2 transition"
              >
                <p className="font-semibold text-gray-800">
                  {persona.nombre} {persona.apellido}
                </p>
                <p className="text-sm text-gray-600">
                  CI: {persona.ci}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-gray-300 hover:bg-gray-400 font-medium"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddPersonModal;
