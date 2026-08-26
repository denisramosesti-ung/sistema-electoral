// ======================= INPUT TELÉFONO PARAGUAYO =======================
// Componente reutilizable: prefijo "+595" fijo y no editable a la
// izquierda, más un input numérico limitado a 9 dígitos (la parte
// editable del celular paraguayo). Usado tanto al agregar personas
// (AddPersonModal) como al editar un teléfono existente (ModalTelefono).

import React from "react";
import { PREFIJO_PY, MAX_TELEFONO_INPUT_LENGTH, sanitizarEntradaTelefono } from "../utils/telefonoParaguay";

const TelefonoParaguayoInput = ({
  id,
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
}) => {
  const handleChange = (e) => {
    onChange(sanitizarEntradaTelefono(e.target.value));
  };

  return (
    <div>
      <div className="flex items-stretch">
        <span className="inline-flex items-center px-3 text-sm font-medium text-slate-600 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl select-none shrink-0">
          {PREFIJO_PY}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          maxLength={MAX_TELEFONO_INPUT_LENGTH}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder="981123456"
          className={`w-full min-w-0 px-4 py-2.5 text-sm border rounded-r-xl focus:outline-none focus:ring-2 focus:border-transparent bg-slate-50 disabled:opacity-60 ${
            error ? "border-red-300 focus:ring-red-400" : "border-slate-300 focus:ring-brand-500"
          }`}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600 mt-1.5">{error}</p>
      ) : (
        <p className="text-xs text-slate-400 mt-1.5">Ejemplo: 981123456 (9 dígitos)</p>
      )}
    </div>
  );
};

export default TelefonoParaguayoInput;
