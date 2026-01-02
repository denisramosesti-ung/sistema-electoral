// ======================= BUSCADOR GLOBAL POR CI =======================
// Busca en padrón + estructura
// Devuelve resultado al componente padre vía callback

import React, { useState } from "react";

const BuscadorCI = ({
  value,
  onChange,
  onBuscar,
  resultado,
  onEditarTelefono,
  onEliminar,
}) => {
  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    onChange(val);
    onBuscar(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="font-semibold">Buscar por CI</label>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="Ingrese CI (solo números)"
          className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          inputMode="numeric"
        />

        {resultado && (
          <div className="mt-4 p-4 border rounded bg-gray-50 text-sm">
            <p className="font-bold text-red-700 mb-2">
              {resultado.tipo === "coordinador"
                ? "Coordinador encontrado"
                : resultado.tipo === "subcoordinador"
                ? "Subcoordinador encontrado"
                : resultado.tipo === "votante"
                ? "Votante encontrado"
                : resultado.tipo === "padron"
                ? "Persona en padrón (no asignada)"
                : "No existe en el padrón"}
            </p>

            {resultado.data && resultado.tipo !== "noExiste" && (
              <>
                <p>
                  <b>Nombre:</b> {resultado.data.nombre}{" "}
                  {resultado.data.apellido}
                </p>
                <p>
                  <b>CI:</b> {resultado.data.ci}
                </p>
                {resultado.data.seccional && (
                  <p>
                    <b>Seccional:</b> {resultado.data.seccional}
                  </p>
                )}
                {resultado.data.local_votacion && (
                  <p>
                    <b>Local:</b> {resultado.data.local_votacion}
                  </p>
                )}
                {resultado.data.mesa && (
                  <p>
                    <b>Mesa:</b> {resultado.data.mesa}
                  </p>
                )}
                {resultado.data.orden && (
                  <p>
                    <b>Orden:</b> {resultado.data.orden}
                  </p>
                )}
                {resultado.data.direccion && (
                  <p>
                    <b>Dirección:</b> {resultado.data.direccion}
                  </p>
                )}
                <p>
                  <b>Teléfono:</b> {resultado.data.telefono || "-"}
                </p>
              </>
            )}

            {(resultado.tipo === "coordinador" ||
              resultado.tipo === "subcoordinador" ||
              resultado.tipo === "votante") && (
              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  onClick={() =>
                    onEditarTelefono(resultado.tipo, resultado.data)
                  }
                  className="px-3 py-1 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                >
                  Teléfono
                </button>
                <button
                  onClick={() =>
                    onEliminar(resultado.data.ci, resultado.tipo)
                  }
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            )}

            {resultado.tipo === "noExiste" && (
              <p>
                Este CI <b>{resultado.data.ci}</b> no pertenece al padrón.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuscadorCI;
