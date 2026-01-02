// ======================= DASHBOARD SISTEMA ELECTORAL =======================
// Recupera interfaz completa original (rojo + cards + acciones + buscador + estructura expandible)
// Este componente NO toca Supabase directo: usa callbacks del App + services ya existentes.

import React, { useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  LogOut,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Copy,
  Phone,
  Trash2,
} from "lucide-react";

import AddPersonModal from "../AddPersonModal";

import {
  normalizeCI,
  getMisSubcoordinadores,
  getVotantesDeSubcoord,
  getMisVotantes,
  getVotantesDirectosCoord,
  getEstructuraPropia,
  getPersonasDisponibles,
} from "../utils/estructuraHelpers";

import { getEstadisticas } from "../services/estadisticasService";
import { generarPDF } from "../services/pdfService";

const Dashboard = ({
  // estado
  currentUser,
  estructura,
  padron,

  // callbacks (App orquesta)
  onLogout,
  onRecargar, // opcional, si querés forzar refresh tras acciones
  onAgregarPersonaService, // async ({ persona, modalType, currentUser, estructura })
  onEliminarPersonaService, // async (ci, tipo, currentUser)
  onActualizarTelefonoService, // async (tablaOrTipo, ci, telefono) o async ({ tipo, ci, telefono })

  // opcional: si querés reemplazar el confirm()
  confirmEliminar = true,
}) => {
  // ======================= UI STATE =======================
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const [expanded, setExpanded] = useState({});

  const [searchCI, setSearchCI] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);

  // Teléfono modal local
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneTarget, setPhoneTarget] = useState(null); // { tipo, ...persona }
  const [phoneValue, setPhoneValue] = useState("+595");

  // ======================= HELPERS =======================
  const toggleExpand = (ci) => {
    const key = normalizeCI(ci);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      alert("Código copiado!");
    } catch (e) {
      console.error(e);
      alert("No se pudo copiar.");
    }
  };

  const abrirTelefono = (tipo, persona) => {
    setPhoneTarget({ tipo, ...persona });
    setPhoneValue(persona?.telefono || "+595");
    setPhoneModalOpen(true);
  };

  const cerrarTelefono = () => {
    setPhoneModalOpen(false);
    setPhoneTarget(null);
    setPhoneValue("+595");
  };

  const guardarTelefono = async () => {
    if (!phoneTarget) return;
    const tel = String(phoneValue || "").trim();
    if (!tel) return alert("Ingrese número");

    // admitimos 2 firmas:
    // 1) onActualizarTelefonoService(tipo, ci, tel)
    // 2) onActualizarTelefonoService({ tipo, ci, telefono: tel })
    try {
      if (!onActualizarTelefonoService) {
        alert("Falta onActualizarTelefonoService en Dashboard");
        return;
      }

      if (onActualizarTelefonoService.length >= 3) {
        await onActualizarTelefonoService(phoneTarget.tipo, phoneTarget.ci, tel);
      } else {
        await onActualizarTelefonoService({
          tipo: phoneTarget.tipo,
          ci: phoneTarget.ci,
          telefono: tel,
        });
      }

      cerrarTelefono();
      if (onRecargar) await onRecargar();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Error guardando teléfono");
    }
  };

  const handleEliminar = async (ci, tipo) => {
    if (!onEliminarPersonaService) {
      alert("Falta onEliminarPersonaService en Dashboard");
      return;
    }

    if (confirmEliminar) {
      const ok = window.confirm("¿Quitar persona?");
      if (!ok) return;
    }

    try {
      await onEliminarPersonaService(ci, tipo, currentUser);
      if (onRecargar) await onRecargar();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Error eliminando");
    }
  };

  const handleAgregarPersona = async (persona) => {
    if (!onAgregarPersonaService) {
      alert("Falta onAgregarPersonaService en Dashboard");
      return;
    }

    try {
      await onAgregarPersonaService({
        persona,
        modalType,
        currentUser,
        estructura,
      });

      setShowAddModal(false);
      if (onRecargar) await onRecargar();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Error agregando");
    }
  };

  // ======================= BUSCADOR LOGIC =======================
  const buscarPorCI = (input) => {
    const clean = String(input || "").replace(/\D/g, "");
    if (!clean) {
      setSearchResult(null);
      return;
    }

    // busca primero en padrón (por inclusión, como tu versión)
    const persona = (padron || []).find((p) =>
      String(p?.ci || "").includes(clean)
    );

    if (!persona) {
      setSearchResult({ tipo: "noExiste", data: { ci: clean } });
      return;
    }

    const ciNorm = normalizeCI(persona.ci);

    const coord = (estructura?.coordinadores || []).find(
      (c) => normalizeCI(c.ci) === ciNorm
    );
    if (coord) return setSearchResult({ tipo: "coordinador", data: coord });

    const sub = (estructura?.subcoordinadores || []).find(
      (s) => normalizeCI(s.ci) === ciNorm
    );
    if (sub) return setSearchResult({ tipo: "subcoordinador", data: sub });

    const vot = (estructura?.votantes || []).find(
      (v) => normalizeCI(v.ci) === ciNorm
    );
    if (vot) return setSearchResult({ tipo: "votante", data: vot });

    return setSearchResult({ tipo: "padron", data: persona });
  };

  // ======================= STATS =======================
  const stats = useMemo(
    () => getEstadisticas(estructura, currentUser),
    [estructura, currentUser]
  );

  // ======================= ESTRUCTURA PROPIA (PDF/Resumen) =======================
  const propia = useMemo(
    () => getEstructuraPropia(estructura, currentUser),
    [estructura, currentUser]
  );

  // ======================= DATOS PERSONA (UI) =======================
  const DatosPersona = ({ persona, rol, loginCode }) => {
    return (
      <div className="space-y-1 text-xs md:text-sm">
        <p className="font-semibold">
          {persona?.nombre || "-"} {persona?.apellido || ""}
        </p>
        <p>
          <b>CI:</b> {persona?.ci}
        </p>
        {rol && (
          <p>
            <b>Rol:</b> {rol}
          </p>
        )}

        {loginCode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(loginCode);
            }}
            className="p-1 border rounded text-red-600 inline-flex items-center gap-1 hover:bg-red-50"
            title="Copiar código de acceso"
          >
            <Copy className="w-4 h-4" /> Copiar acceso
          </button>
        )}

        {persona?.seccional && <p>Seccional: {persona.seccional}</p>}
        {persona?.local_votacion && <p>Local: {persona.local_votacion}</p>}
        {persona?.mesa && <p>Mesa: {persona.mesa}</p>}
        {persona?.orden && <p>Orden: {persona.orden}</p>}
        {persona?.direccion && <p>Dirección: {persona.direccion}</p>}
        {persona?.telefono && <p>Tel: {persona.telefono}</p>}
      </div>
    );
  };

  // ======================= PERSONAS DISPONIBLES =======================
  const disponibles = useMemo(
    () => getPersonasDisponibles(padron || [], estructura),
    [padron, estructura]
  );

  // ======================= PDF MENU HANDLERS =======================
  const descargarPdf = (tipo) => {
    setPdfMenuOpen(false);
    generarPDF({
      tipo,
      estructura,
      padron,
      currentUser,
    });
  };

  // ======================= RENDER =======================
  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Sistema Electoral</h1>
            <p className="text-red-200 text-sm mt-1">
              {currentUser.nombre} {currentUser.apellido} —{" "}
              {currentUser.role === "superadmin"
                ? "⭐ Superadmin"
                : currentUser.role === "coordinador"
                ? "Coordinador"
                : "Sub-coordinador"}
            </p>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* TARJETAS ESTADÍSTICAS */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentUser.role === "superadmin" && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Coordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.coordinadores || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Subcoordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.subcoordinadores || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Votantes</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.votantes || 0}
              </p>
            </div>
          </>
        )}

        {currentUser.role === "coordinador" && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Subcoordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.subcoordinadores || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Votantes directos</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.votantesDirectos || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total en red</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.total || 0}
              </p>
            </div>
          </>
        )}

        {currentUser.role === "subcoordinador" && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Mis votantes</p>
            <p className="text-4xl font-bold text-red-600">
              {stats.votantes || 0}
            </p>
          </div>
        )}
      </div>

      {/* ACCIONES */}
      <div className="max-w-7xl mx-auto px-4 mb-6 flex flex-wrap gap-3 items-center">
        {currentUser.role === "superadmin" && (
          <button
            onClick={() => {
              setModalType("coordinador");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Coordinador
          </button>
        )}

        {currentUser.role === "coordinador" && (
          <button
            onClick={() => {
              setModalType("subcoordinador");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Subcoordinador
          </button>
        )}

        {(currentUser.role === "coordinador" ||
          currentUser.role === "subcoordinador") && (
          <button
            onClick={() => {
              setModalType("votante");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            <UserPlus className="w-4 h-4" />
            Agregar Votante
          </button>
        )}

        {/* MENÚ PDF */}
        <div className="relative inline-block">
          <button
            className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
            onClick={() => setPdfMenuOpen((v) => !v)}
          >
            <BarChart3 className="w-4 h-4" />
            Descargar PDF
          </button>

          {pdfMenuOpen && (
            <div className="absolute mt-1 bg-white border rounded-lg shadow-lg z-20 min-w-[220px] overflow-hidden">
              {currentUser.role === "superadmin" ? (
                <>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                    onClick={() => descargarPdf("ranking")}
                  >
                    Ranking Global
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                    onClick={() => descargarPdf("estructura")}
                  >
                    Estructura Completa
                  </button>
                </>
              ) : (
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                  onClick={() => descargarPdf("estructura")}
                >
                  Mi Estructura
                </button>
              )}
            </div>
          )}
        </div>

        {/* pequeño resumen (opcional, no rompe UI) */}
        {(currentUser.role === "coordinador" ||
          currentUser.role === "subcoordinador") && (
          <div className="text-sm text-gray-600 ml-2">
            Total en red:{" "}
            <b className="text-red-600">{propia.totalVotos || 0}</b>
          </div>
        )}
      </div>

      {/* BUSCADOR GLOBAL POR CI (misma UI original) */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="font-semibold">Buscar por CI</label>
          <input
            type="text"
            value={searchCI}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setSearchCI(value);
              buscarPorCI(value);
            }}
            placeholder="Ingrese CI (solo números)"
            className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            inputMode="numeric"
            pattern="[0-9]*"
          />

          {searchResult && (
            <div className="mt-4 p-4 border rounded bg-gray-50 text-sm">
              <p className="font-bold text-red-700 mb-2">
                {searchResult.tipo === "coordinador"
                  ? "Coordinador encontrado"
                  : searchResult.tipo === "subcoordinador"
                  ? "Subcoordinador encontrado"
                  : searchResult.tipo === "votante"
                  ? "Votante encontrado"
                  : searchResult.tipo === "padron"
                  ? "Persona en padrón (no asignada)"
                  : "No existe en el padrón"}
              </p>

              {searchResult.data && searchResult.tipo !== "noExiste" && (
                <>
                  <p>
                    <b>Nombre:</b> {searchResult.data.nombre}{" "}
                    {searchResult.data.apellido}
                  </p>
                  <p>
                    <b>CI:</b> {searchResult.data.ci}
                  </p>
                  {searchResult.data.seccional && (
                    <p>
                      <b>Seccional:</b> {searchResult.data.seccional}
                    </p>
                  )}
                  {searchResult.data.local_votacion && (
                    <p>
                      <b>Local de votación:</b>{" "}
                      {searchResult.data.local_votacion}
                    </p>
                  )}
                  {searchResult.data.mesa && (
                    <p>
                      <b>Mesa:</b> {searchResult.data.mesa}
                    </p>
                  )}
                  {searchResult.data.orden && (
                    <p>
                      <b>Orden:</b> {searchResult.data.orden}
                    </p>
                  )}
                  {searchResult.data.direccion && (
                    <p>
                      <b>Dirección:</b> {searchResult.data.direccion}
                    </p>
                  )}
                  <p>
                    <b>Teléfono:</b> {searchResult.data.telefono || "-"}
                  </p>
                </>
              )}

              {searchResult.tipo === "noExiste" && (
                <p>
                  Este CI <b>{searchResult.data.ci}</b> no pertenece al padrón.
                </p>
              )}

              {(searchResult.tipo === "coordinador" ||
                searchResult.tipo === "subcoordinador" ||
                searchResult.tipo === "votante") && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => abrirTelefono(searchResult.tipo, searchResult.data)}
                    className="px-3 py-1 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                  >
                    Teléfono
                  </button>
                  <button
                    onClick={() => handleEliminar(searchResult.data.ci, searchResult.tipo)}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Borrar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MI ESTRUCTURA (misma caja + lógica expandible como tu UI original) */}
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Mi Estructura</h2>
          </div>

          <div className="p-6">
            {/* SUPERADMIN: VER TODA LA RED */}
            {currentUser.role === "superadmin" && (
              <>
                {(estructura?.coordinadores || []).map((coord) => (
                  <div
                    key={coord.ci}
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-start justify-between p-4 cursor-pointer gap-4"
                      onClick={() => toggleExpand(coord.ci)}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {expanded[normalizeCI(coord.ci)] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}

                        <DatosPersona
                          persona={coord}
                          rol="Coordinador"
                          loginCode={coord.login_code}
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("coordinador", coord);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                          title="Editar teléfono"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminar(coord.ci, "coordinador");
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          title="Borrar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expanded[normalizeCI(coord.ci)] && (
                      <div className="bg-white px-4 pb-4">
                        {/* SUBCOORDINADORES DEL COORD */}
                        {(estructura?.subcoordinadores || [])
                          .filter(
                            (s) =>
                              normalizeCI(s.coordinador_ci) === normalizeCI(coord.ci)
                          )
                          .map((sub) => (
                            <div
                              key={sub.ci}
                              className="border rounded p-3 mb-2 bg-red-50/40 flex flex-col gap-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <DatosPersona
                                  persona={sub}
                                  rol="Sub-coordinador"
                                  loginCode={sub.login_code}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => abrirTelefono("subcoordinador", sub)}
                                    className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                    title="Editar teléfono"
                                  >
                                    <Phone className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleEliminar(sub.ci, "subcoordinador")
                                    }
                                    className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    title="Borrar"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>

                              {/* Votantes de ese sub */}
                              {getVotantesDeSubcoord(estructura, sub.ci).map((v) => (
                                <div
                                  key={v.ci}
                                  className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                                >
                                  <DatosPersona persona={v} rol="Votante" />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => abrirTelefono("votante", v)}
                                      className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                      title="Editar teléfono"
                                    >
                                      <Phone className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => handleEliminar(v.ci, "votante")}
                                      className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                      title="Borrar"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {getVotantesDeSubcoord(estructura, sub.ci).length === 0 && (
                                <p className="text-gray-500 text-sm">
                                  Sin votantes asignados.
                                </p>
                              )}
                            </div>
                          ))}

                        {/* VOTANTES DIRECTOS DEL COORD */}
                        {getVotantesDirectosCoord(estructura, coord.ci).map((v) => (
                          <div
                            key={v.ci}
                            className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                          >
                            <DatosPersona persona={v} rol="Votante" />
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirTelefono("votante", v)}
                                className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                title="Editar teléfono"
                              >
                                <Phone className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleEliminar(v.ci, "votante")}
                                className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                title="Borrar"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {(estructura?.coordinadores || []).length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No hay coordinadores aún.
                  </p>
                )}
              </>
            )}

            {/* COORDINADOR */}
            {currentUser.role === "coordinador" && (
              <>
                {getMisSubcoordinadores(estructura, currentUser).map((sub) => (
                  <div
                    key={sub.ci}
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-start justify-between p-4 cursor-pointer gap-4"
                      onClick={() => toggleExpand(sub.ci)}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {expanded[normalizeCI(sub.ci)] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}
                        <DatosPersona
                          persona={sub}
                          rol="Sub-coordinador"
                          loginCode={sub.login_code}
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("subcoordinador", sub);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminar(sub.ci, "subcoordinador");
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expanded[normalizeCI(sub.ci)] && (
                      <div className="bg-white px-4 pb-4">
                        <p className="text-sm font-semibold mt-2">Votantes</p>

                        {getVotantesDeSubcoord(estructura, sub.ci).map((v) => (
                          <div
                            key={v.ci}
                            className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                          >
                            <DatosPersona persona={v} rol="Votante" />
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirTelefono("votante", v)}
                                className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                              >
                                <Phone className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleEliminar(v.ci, "votante")}
                                className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {getVotantesDeSubcoord(estructura, sub.ci).length === 0 && (
                          <p className="text-gray-500 text-sm mt-2">
                            Sin votantes asignados.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {getMisVotantes(estructura, currentUser).length > 0 && (
                  <div className="border rounded-lg mb-3 p-4">
                    <p className="font-semibold text-gray-700 mb-3">
                      Mis votantes directos
                    </p>

                    {getMisVotantes(estructura, currentUser).map((v) => (
                      <div
                        key={v.ci}
                        className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                      >
                        <DatosPersona persona={v} rol="Votante" />
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirTelefono("votante", v)}
                            className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEliminar(v.ci, "votante")}
                            className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {getMisSubcoordinadores(estructura, currentUser).length === 0 &&
                  getMisVotantes(estructura, currentUser).length === 0 && (
                    <p className="text-gray-500 py-6">
                      Aún no tiene subcoordinadores ni votantes asignados.
                    </p>
                  )}
              </>
            )}

            {/* SUBCOORDINADOR */}
            {currentUser.role === "subcoordinador" && (
              <>
                {getMisVotantes(estructura, currentUser).map((v) => (
                  <div
                    key={v.ci}
                    className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                  >
                    <DatosPersona persona={v} rol="Votante" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirTelefono("votante", v)}
                        className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEliminar(v.ci, "votante")}
                        className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}

                {getMisVotantes(estructura, currentUser).length === 0 && (
                  <p className="text-gray-500 py-6">
                    No tiene votantes asignados.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL TELÉFONO (misma UI original) */}
      {phoneModalOpen && phoneTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
            <h3 className="text-lg font-bold mb-2">Editar teléfono</h3>
            <p className="text-sm text-gray-600 mb-4">
              {phoneTarget.nombre} {phoneTarget.apellido} — CI: {phoneTarget.ci}
            </p>

            <label className="text-sm font-medium text-gray-700">
              Número (formato +595…)
            </label>
            <input
              type="tel"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="+595..."
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={cerrarTelefono}
                className="px-4 py-2 rounded-lg border"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTelefono}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR PERSONA (tu componente existente) */}
      <AddPersonModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        tipo={modalType}
        onAdd={handleAgregarPersona}
        disponibles={disponibles}
      />
    </div>
  );
};

export default Dashboard;
