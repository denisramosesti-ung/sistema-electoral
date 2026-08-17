import React, { useState, useEffect } from "react";
import { Search, X, UserPlus, ChevronLeft, ChevronRight, Phone, ArrowLeft } from "lucide-react";
import {
  validarTelefonoParaguayo,
  sanitizarEntradaTelefono,
  MAX_TELEFONO_INPUT_LENGTH,
} from "./utils/telefonoParaguay";
import { normalizeCI, normalizeSearchText } from "./utils/estructuraHelpers";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // ======================= PASO TELÉFONO =======================
  const [step, setStep] = useState("search"); // "search" | "phone"
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneError, setPhoneError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) {
      setSearchTerm("");
      setPage(1);
      setStep("search");
      setSelectedPersona(null);
      setPhoneValue("");
      setPhoneError(null);
      setSaving(false);
    }
  }, [show]);

  useEffect(() => { setPage(1); }, [searchTerm]);

  if (!show) return null;

  const term = normalizeSearchText(searchTerm);

  const filtered = term
    ? disponibles
        .filter((p) => {
          const fullName = `${p.nombre ?? ""} ${p.apellido ?? ""}`;
          const fullNameNorm = normalizeSearchText(fullName);
          const ciTxt = normalizeCI(p.ci);
          const words = term.split(" ").filter(Boolean);
          return words.every((w) => ciTxt.includes(w) || fullNameNorm.includes(w));
        })
        .sort((a, b) => {
          const searchedCI = normalizeCI(searchTerm);
          const exactA = normalizeCI(a.ci) === searchedCI;
          const exactB = normalizeCI(b.ci) === searchedCI;
          if (exactA && !exactB) return -1;
          if (!exactA && exactB) return 1;
          return (a.nombre || "").localeCompare(b.nombre || "");
        })
    : [];

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const pageData = filtered.slice(startIdx, startIdx + pageSize);

  const titulo =
    tipo === "coordinador" ? "Agregar Coordinador"
    : tipo === "subcoordinador" ? "Agregar Subcoordinador"
    : "Agregar Votante";

  // ======================= SELECCIONAR PERSONA =======================
  const handleSeleccionar = (persona) => {
    setSelectedPersona(persona);
    setPhoneValue("");
    setPhoneError(null);
    setStep("phone");
  };

  const handleVolver = () => {
    if (saving) return;
    setStep("search");
    setSelectedPersona(null);
    setPhoneValue("");
    setPhoneError(null);
  };

  const handlePhoneChange = (e) => {
    setPhoneValue(sanitizarEntradaTelefono(e.target.value));
    if (phoneError) setPhoneError(null);
  };

  // ======================= CONFIRMAR ASIGNACIÓN =======================
  const handleConfirmarAsignacion = async () => {
    if (saving || !selectedPersona) return;

    const { valido, error, normalizado } = validarTelefonoParaguayo(phoneValue);
    if (!valido) {
      setPhoneError(error);
      return;
    }

    setSaving(true);
    setPhoneError(null);
    try {
      const result = await onAdd(selectedPersona, normalizado);
      if (result && result.ok === false) {
        setPhoneError(result.error || "No se pudo completar la asignación.");
        setSaving(false);
        return;
      }
      // Éxito: el padre cierra el modal (prop `show`), no es necesario hacer nada más aquí.
    } catch (e) {
      setPhoneError(e?.message || "No se pudo completar la asignación.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-brand-100 rounded-lg">
              {step === "phone" ? (
                <Phone className="w-4 h-4 text-brand-600" />
              ) : (
                <UserPlus className="w-4 h-4 text-brand-600" />
              )}
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {step === "phone" ? "Teléfono de contacto" : titulo}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border-0 bg-transparent shadow-none disabled:opacity-40"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "search" ? (
          <>
            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  placeholder="Buscar por CI, nombre o apellido..."
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50"
                  autoFocus
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0 bg-transparent border-0 shadow-none"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {searchTerm && (
                <p className="text-xs text-slate-500 mt-1.5">
                  {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
              {!searchTerm ? (
                <div className="text-center py-10">
                  <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Escriba para buscar personas del padrón.</p>
                </div>
              ) : pageData.length === 0 ? (
                <div className="text-center py-10">
                  <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No se encontraron resultados.</p>
                </div>
              ) : (
                pageData.map((persona) => {
                  const bloqueado = persona.asignado === true;
                  const asignador =
                    persona.asignadoPorNombreResolved ||
                    persona.asignadoPorNombre ||
                    (persona.asignadoRol === "Coordinador" ? "Superadmin" : "Asignado");
                  const asignadorRol = persona.asignadoPorRolResolved || persona.asignadoRol || "";

                  return (
                    <div
                      key={persona.ci}
                      onClick={() => !bloqueado && handleSeleccionar(persona)}
                      className={`p-3 border rounded-xl transition-colors ${
                        bloqueado
                          ? "bg-slate-50 opacity-60 cursor-not-allowed border-slate-200"
                          : "bg-white hover:bg-brand-50 hover:border-brand-200 cursor-pointer border-slate-200 active:bg-brand-100"
                      }`}
                    >
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {(persona.nombre || "").toUpperCase()}{" "}
                        {(persona.apellido || "").toUpperCase()}
                      </p>
                      <div className="text-xs text-slate-500 mt-0.5 space-y-0.5">
                        <p>CI: {persona.ci}</p>
                        <div className="flex flex-wrap gap-x-3">
                          {persona.seccional && <span>Seccional: {persona.seccional}</span>}
                          {persona.local_votacion && <span className="truncate">Local: {persona.local_votacion}</span>}
                          {persona.mesa && <span>Mesa: {persona.mesa}</span>}
                          {persona.orden && <span>Orden: {persona.orden}</span>}
                        </div>
                      </div>
                      {bloqueado && (
                        <p className="text-xs text-brand-600 mt-1 font-medium truncate">
                          Ya asignado por {asignador}
                          {asignadorRol ? ` (${asignadorRol})` : ""}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filtered.length > pageSize && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 h-8 border border-slate-200 rounded-lg text-xs text-slate-600 disabled:opacity-40 bg-white hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </button>
                <span className="text-xs text-slate-500">
                  Página {page} de {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 h-8 border border-slate-200 rounded-lg text-xs text-slate-600 disabled:opacity-40 bg-white hover:bg-slate-50 transition-colors"
                >
                  Siguiente
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 shrink-0">
              <button
                onClick={onClose}
                className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors border-0"
              >
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ======================= PASO: TELÉFONO OBLIGATORIO ======================= */}
            <div className="px-5 py-5 space-y-4 overflow-y-auto">
              <button
                onClick={handleVolver}
                disabled={saving}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 p-0 bg-transparent border-0 shadow-none disabled:opacity-40"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a la búsqueda
              </button>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="font-semibold text-sm text-slate-800 truncate">
                  {(selectedPersona?.nombre || "").toUpperCase()}{" "}
                  {(selectedPersona?.apellido || "").toUpperCase()}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  CI: <span className="text-slate-700 font-medium">{selectedPersona?.ci}</span>
                </p>
              </div>

              <div>
                <label htmlFor="telefonoAsignacion" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Número de teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  id="telefonoAsignacion"
                  type="tel"
                  value={phoneValue}
                  onChange={handlePhoneChange}
                  maxLength={MAX_TELEFONO_INPUT_LENGTH}
                  disabled={saving}
                  autoFocus
                  placeholder="0981 123 456"
                  className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-slate-50 disabled:opacity-60 ${
                    phoneError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-slate-300 focus:ring-brand-500"
                  }`}
                />
                {phoneError ? (
                  <p className="text-xs text-red-600 mt-1.5">{phoneError}</p>
                ) : (
                  <p className="text-xs text-slate-400 mt-1.5">
                    Formatos válidos: 0981123456 o +595981123456
                  </p>
                )}
              </div>
            </div>

            {/* Footer paso teléfono */}
            <div className="px-5 py-4 border-t border-slate-100 shrink-0 flex gap-2">
              <button
                onClick={handleVolver}
                disabled={saving}
                className="flex-1 h-10 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors bg-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAsignacion}
                disabled={saving}
                className="flex-1 h-10 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors border-0 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Confirmar asignación"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddPersonModal;
