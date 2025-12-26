// AddPersonModal.jsx — Búsqueda directa en Supabase (padron)

import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { Search, X } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  if (!show) return null;

  const buscar = async (rawTerm) => {
    const term = rawTerm.trim();
    if (!term) {
      setResultados([]);
      return;
    }

    setCargando(true);

    const isNumeric = /^\d+$/.test(term);
    let query = supabase.from("padron").select("*").limit(30);

    if (isNumeric) {
      // Buscar por CI exacto si son solo números
      query = query.or(
        `ci.eq.${term},nombre.ilike.%${term}%,apellido.ilike.%${term}%`
      );
    } else {
      // Buscar por nombre o apellido
      query = query.or(
        `nombre.ilike.%${term}%,apellido.ilike.%${term}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error en búsqueda de padron:", error);
      setResultados([]);
    } else {
      setResultados(data || []);
    }

    setCargando(false);
  };

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-coordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden">
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
                const v = e.target.value;
                setSearchTerm(v);
                buscar(v);
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="px-6 pb-4 space-y-2 max-h-[320px] overflow-y-auto">
          {cargando ? (
            <p className="text-center text-gray-500 py-6">Buscando…</p>
          ) : resultados.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Sin resultados…</p>
          ) : (
            resultados.map((p) => (
              <div
                key={p.ci}
                onClick={() => onAdd(p)}
                className="p-4 border rounded-lg bg-gray-50 hover:bg-red-50 cursor-pointer transition"
              >
                <p className="font-semibold text-gray-800">
                  {p.nombre} {p.apellido}
                </p>
                <p className="text-sm text-gray-600">
                  CI: {p.ci} • {p.localidad || "-"}
                  {p.mesa ? ` • Mesa: ${p.mesa}` : ""}
                  {p.seccional ? ` • Sec: ${p.seccional}` : ""}
                </p>
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
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
