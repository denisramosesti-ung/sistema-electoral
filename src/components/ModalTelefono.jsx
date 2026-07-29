import React from "react";
import { Phone, X } from "lucide-react";
import TelefonoParaguayoInput from "./TelefonoParaguayoInput";

const ModalTelefono = ({ open, persona, value, onChange, onCancel, onSave, error, saving, valido }) => {
  if (!open || !persona) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onCancel(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-modal overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-100 rounded-lg">
              <Phone className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Editar teléfono</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border-0 bg-transparent shadow-none disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-slate-600 font-medium truncate">
            {persona.nombre} {persona.apellido}
            <span className="ml-1.5 text-slate-400 font-normal">— CI: {persona.ci}</span>
          </p>

          <div>
            <label htmlFor="telefonoEdicion" className="block text-sm font-medium text-slate-700 mb-1.5">
              Número de teléfono <span className="text-red-500">*</span>
            </label>
            <TelefonoParaguayoInput
              id="telefonoEdicion"
              value={value}
              onChange={onChange}
              error={error}
              disabled={saving}
              autoFocus
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors bg-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || !valido}
            className="flex-1 h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors border-0 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTelefono;
