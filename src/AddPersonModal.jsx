import React, { useState, useMemo } from "react";
import { Search, X, Users } from "lucide-react";

const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  if (!show) return null;

  const PAGE_SIZE = 10;

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-coordinador"
      : "Agregar Votante";

  // ======================= FILTRADO + ORDEN + LIMITE =======================
  const { filtered, totalPadron, totalFiltrados } = useMemo(() => {
    if (!Array.isArray(disponibles) || !disponibles.length) {
      return { filtered: [], totalPadron: 0, totalFiltrados: 0 };
    }

    const total = disponibles.length;

    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return { filtered: [], totalPadron: total, totalFiltrados: 0 };
    }

    const isNumeric = /^\d+$/.test(term);

    // Calculamos un "score" para ordenar por relevancia
    const scored = disponibles
      .map((p) => {
        const ciTxt = (p.ci || "").toString();
        const ciNorm = ciTxt.toLowerCase();
        const nombre = (p.nombre || "").toLowerCase();
        const apellido = (p.apellido || "").toLowerCase();
        const fullName = `${nombre} ${apellido}`.trim();

        let score = 1000;

        if (isNumeric) {
          const ciDigits = ciTxt.replace(/\D/g, "");
          const termDigits = term.replace(/\D/g, "");

          if (ciDigits === termDigits) score = 0; // match exacta CI
          else if (ciDigits.startsWith(termDigits)) score = 1;
          else if (ciNorm.includes(term)) score = 5;
        } else {
          // Búsqueda por nombre/apellido
          if (fullName === term) score = 0;
          else if (nombre === term || apellido === term) score = 1;
          else if (fullName.startsWith(term)) score = 2;
          else if (nombre.startsWith(term) || apellido.startsWith(term)) score = 3;
          else if (fullName.includes(term)) score = 5;
        }

        // Si no matchea nada, devolvemos score alto, y filtramos luego
        const match =
          isNumeric
            ? ciNorm.includes(term) ||
              ciTxt.replace(/\D/g, "").includes(term.replace(/\D/g, ""))
            : fullName.includes(term);

        return match ? { persona: p, score } : null;
      })
      .filter(Boolean);

    // Ordenar por score (mejor primero) y luego por apellido/nombre
    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const an = (a.persona.apellido || "").localeCompare(
        b.persona.apellido || ""
      );
      if (an !== 0) return an;
      return (a.persona.nombre || "").localeCompare(b.persona.nombre || "");
    });

    // Limitamos a 100 resultados para no matar el navegador
    const limited = scored.slice(0, 100).map((s) => s.persona);

    return {
      filtered: limited,
      totalPadron: total,
      totalFiltrados: scored.length,
    };
  }, [disponibles, searchTerm]);

  // ======================= PAGINACIÓN =======================
  const totalPages = Math.max(
    1,
    Math.ceil((filtered?.length || 0) / PAGE_SIZE)
  );

  const start = (page - 1) * PAGE_SIZE;
  const paginated = filtered.slice(start, start + PAGE_SIZE);

  const handleChangeSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);
  };

  const handleSelectPersona = (persona) => {
    if (!persona || persona.asignado) return;
    onAdd(persona);
  };

  const textoRol = (p) => {
    if (!p.asignadoRol) return null;
    return `${p.asignadoRol}${
      p.asignadoPorNombre ? ` · ${p.asignadoPorNombre}` : ""
    }`;
  };

  // Color del chip según rol
  const getRolClasses = (rol) => {
    switch (rol) {
      case "Coordinador":
        return "bg-red-100 text-red-700 border-red-300";
      case "Subcoordinador":
        return "bg-orange-100 text-orange-700 border-orange-300";
      case "Votante":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b bg-red-600 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 rounded-full p-2">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold leading-tight">
                {titulo}
              </h3>
              <p className="text-xs sm:text-sm text-red-100">
                Busque por CI, nombre o apellido y seleccione al elector.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/15 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="p-4 sm:p-5 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleChangeSearch}
              placeholder="Escriba CI, nombre o apellido..."
              className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
            <div>
              {totalPadron > 0 && (
                <span>
                  Padrón total:{" "}
                  <b>
                    {totalPadron.toLocaleString("es-ES")}{" "}
                    {totalPadron === 1 ? "persona" : "personas"}
                  </b>
                </span>
              )}
            </div>
            <div className="text-right">
              {searchTerm.trim() && (
                <>
                  {totalFiltrados === 0 ? (
                    <span>Sin coincidencias para “{searchTerm}”.</span>
                  ) : (
                    <span>
                      Coincidencias:{" "}
                      <b>
                        {totalFiltrados.toLocaleString("es-ES")}
                      </b>{" "}
                      · Mostrando{" "}
                      <b>{filtered.length.toLocaleString("es-ES")}</b>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* LISTA DE RESULTADOS */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-2">
          {!searchTerm.trim() ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Escriba un CI, nombre o apellido para buscar en el padrón.
            </p>
          ) : paginated.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              No se encontraron resultados para “{searchTerm}”.
            </p>
          ) : (
            paginated.map((p) => {
              const bloqueado = p.asignado === true;
              const localidad = p.localidad || p.local || "-";
              const mesa = p.mesa || null;
              const rolTexto = textoRol(p);

              return (
                <div
                  key={p.ci}
                  className={`group border rounded-xl px-3 py-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center ${
                    bloqueado
                      ? "bg-gray-100 opacity-70 cursor-not-allowed"
                      : "bg-white hover:bg-red-50 cursor-pointer"
                  } transition-colors`}
                  onClick={() => !bloqueado && handleSelectPersona(p)}
                >
                  {/* IZQUIERDA: CI / NOMBRE */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-800 truncate">
                        {p.nombre} {p.apellido}
                      </p>
                      {bloqueado && (
                        <span
                          className={
                            "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border " +
                            getRolClasses(p.asignadoRol)
                          }
                        >
                          {p.asignadoRol || "Asignado"}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                      CI: <b>{p.ci}</b>
                      {localidad && <> · {localidad}</>}
                      {mesa && <> · Mesa {mesa}</>}
                    </p>

                    {rolTexto && (
                      <p className="text-[11px] text-red-700 mt-1">
                        Ya asignado por <b>{rolTexto}</b>
                      </p>
                    )}
                  </div>

                  {/* DERECHA: BOTÓN / ESTADO */}
                  <div className="flex flex-row sm:flex-col gap-2 items-end sm:items-center">
                    {!bloqueado ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPersona(p);
                        }}
                        className="text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                      >
                        Seleccionar
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-500 italic">
                        No disponible
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN + FOOTER */}
        <div className="border-t px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <span>
              Página{" "}
              <b>
                {Math.min(page, totalPages)} / {totalPages}
              </b>
            </span>
            {filtered.length > PAGE_SIZE && (
              <span className="hidden sm:inline">
                (Mostrando {paginated.length} de {filtered.length} resultados
                filtrados)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm ${
                page <= 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              ◀ Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
              className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm ${
                page >= totalPages
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              Siguiente ▶
            </button>
            <button
              type="button"
              onClick={onClose}
              className="ml-1 px-3 sm:px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-xs sm:text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPersonModal;
