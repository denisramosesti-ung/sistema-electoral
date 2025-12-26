// AddPersonModal.jsx – Buscador conectado a Supabase

import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "./supabaseClient";
import { debounce } from "lodash";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const buscarSupabase = debounce(async (term) => {
    if (!term.trim()) {
      setResultados([]);
      return;
    }

    setLoading(true);

    // Si es CI exacto (solo números)
    if (/^\d+$/.test(term)) {
      const { data } = await supabase
        .from("padron")
        .select("*")
        .eq("ci", term)
        .limit(1);

      setResultados(data || []);
      setLoading(false);
      return;
    }

    // Búsqueda parcial por nombre o apellido
    const { data, error } = await supabase
      .from("padron")
      .select("*")
      .or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%`)
      .limit(50);

    if (!error) setResultados(data || []);
    setLoading(false);
  }, 350);

  const handleChange = (value) => {
    setSearchTerm(value);
    buscarSupabase(value);
  };

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
              onChange={(e) => handleChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Results */}
        <div className="px-6 pb-4 space-y-2 max-h-[350px] overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-6">Buscando...</p>
          ) : searchTerm && resultados.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Sin resultados…</p>
          ) : (
            resultados.map((persona) => {
              const padronCheck = disponibles.find(
                (p) => Number(p.ci) === Number(persona.ci)
              );

              const bloqueado = padronCheck?.asignado === true;

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
                  <p className="text-sm text-gray-600">
                    CI: {persona.ci}{" "}
                    {persona.localidad ? `• ${persona.localidad}` : ""}
                  </p>

                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya asignado por <b>{padronCheck.asignadoPorNombre}</b>{" "}
                      {padronCheck.asignadoRol &&
                        `(${padronCheck.asignadoRol})`}
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
