// App.jsx – Versión Supabase + padrón remoto (FINAL CORREGIDA)

import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Search,
  Users,
  UserPlus,
  LogOut,
  BarChart3,
  ChevronDown,
  ChevronRight,
  X,
  Trash2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ======================= MODAL PARA AGREGAR PERSONA =======================
const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  if (!show) return null;

  let filtered = [];
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    const exactCI = disponibles.filter((p) =>
      (p.ci || "").toString().startsWith(searchTerm)
    );

    const nameMatches = disponibles.filter(
      (p) =>
        (p.nombre || "").toLowerCase().includes(term) ||
        (p.apellido || "").toLowerCase().includes(term)
    );

    const combined = [...exactCI, ...nameMatches].filter(
      (p, index, arr) => arr.findIndex((x) => x.ci === p.ci) === index
    );

    filtered = combined.slice(0, 5);
  }

  const pageSize = 5;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Sub-coordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col">

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
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
          {searchTerm.trim().length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              🔎 Escriba para buscar…
            </p>
          ) : paginated.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              ❌ No se encontraron resultados.
            </p>
          ) : (
            paginated.map((persona) => {
              const bloqueado = persona.asignado === true;

              const localTexto =
                persona.localidad ||
                persona.local ||
                persona.local_votacion ||
                "Fernando de la Mora";

              return (
                <div
                  key={persona.ci}
                  onClick={() => {
                    if (!bloqueado) onAdd(persona);
                  }}
                  className={`p-4 border rounded-lg transition relative ${
                    bloqueado
                      ? "bg-gray-200 cursor-not-allowed opacity-60"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  {/* INFO */}
                  <p className="font-semibold text-gray-800">
                    {persona.nombre} {persona.apellido}
                  </p>

                  <p className="text-sm text-gray-600">
                    CI: {persona.ci} • {localTexto} • Mesa: {persona.mesa}
                  </p>

                  {/* YA ASIGNADO */}
                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya fue agregado por{" "}
                      <b>{persona.asignadoPorNombre || "otro referente"}</b>{" "}
                      {persona.asignadoRol ? `(${persona.asignadoRol})` : ""}
                    </p>
                  )}

                  {/* BOTÓN CERRAR CARD */}
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                  >
                    ✖
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* CERRAR */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full mt-2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
// ======================= APLICACIÓN PRINCIPAL =======================
const App = () => {
  // PADRÓN REMOTO
  const [padron, setPadron] = useState([]);

  // ESTADOS PRINCIPALES
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [estructura, setEstructura] = useState({
    coordinadores: [],
    subcoordinadores: [],
    votantes: [],
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [expandedCoords, setExpandedCoords] = useState({});

  // ======================= CARGAR PADRÓN =======================
  useEffect(() => {
    const cargarPadron = async () => {
      const { data, error } = await supabase.from("padron").select("*");
      if (error) {
        console.error("Error cargando padrón:", error);
        return;
      }
      setPadron(data || []);
    };

    cargarPadron();
  }, []);

  // ======================= HELPERS =======================
  const generarCodigo = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const normalizarCoordinador = (row) => ({
    ci: row.ci,
    nombre: row.nombre,
    apellido: row.apellido,
    localidad: row.localidad,
    mesa: row.mesa,
    loginCode: row.login_code,
    asignadoPorNombre: row.asignado_por_nombre,
  });

  const normalizarSubcoordinador = (row) => ({
    ci: row.ci,
    nombre: row.nombre,
    apellido: row.apellido,
    localidad: row.localidad,
    mesa: row.mesa,
    coordinadorCI: row.coordinador_ci,
    loginCode: row.login_code,
    asignadoPorNombre: row.asignado_por_nombre,
  });

  const normalizarVotante = (row) => ({
    ci: row.ci,
    nombre: row.nombre,
    apellido: row.apellido,
    localidad: row.localidad,
    mesa: row.mesa,
    asignadoPor: row.asignado_por,
    asignadoPorNombre: row.asignado_por_nombre,
  });

  // ======================= RECARGAR ESTRUCTURA =======================
  const recargarEstructura = async () => {
    const { data: coords } = await supabase.from("coordinadores").select("*");
    const { data: subs } = await supabase.from("subcoordinadores").select("*");
    const { data: votos } = await supabase.from("votantes").select("*");

    setEstructura({
      coordinadores: (coords || []).map(normalizarCoordinador),
      subcoordinadores: (subs || []).map(normalizarSubcoordinador),
      votantes: (votos || []).map(normalizarVotante),
    });
  };

  useEffect(() => {
    recargarEstructura();
  }, []);

  // ======================= PADRÓN DISPONIBLE =======================
  const getPersonasDisponibles = () => {
    return padron.map((p) => {
      const coord = estructura.coordinadores.find((c) => c.ci === p.ci);
      if (coord)
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: `${coord.nombre} ${coord.apellido}`,
          asignadoRol: "Coordinador",
        };

      const sub = estructura.subcoordinadores.find((s) => s.ci === p.ci);
      if (sub)
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: `${sub.nombre} ${sub.apellido}`,
          asignadoRol: "Subcoordinador",
        };

      const vot = estructura.votantes.find((v) => v.ci === p.ci);
      if (vot)
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: vot.asignadoPorNombre,
          asignadoRol: "Votante",
        };

      return {
        ...p,
        asignado: false,
        asignadoPorNombre: null,
        asignadoRol: null,
      };
    });
  };

  // ======================= AGREGAR PERSONA =======================
  const handleAgregarPersona = async (persona) => {
    const codigo = generarCodigo();

    const localidadBase =
      persona.localidad ||
      persona.local ||
      persona.local_votacion ||
      "Fernando de la Mora";

    // COORDINADOR
    if (modalType === "coordinador") {
      const { error } = await supabase.from("coordinadores").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          localidad: localidadBase,
          mesa: persona.mesa?.toString() || "",
          login_code: codigo,
          asignado_por_nombre: "Superadmin",
        },
      ]);

      if (error) return alert("Error guardando coordinador");

      alert(
        `Coordinador agregado.\nCódigo de acceso: ${codigo}`
      );
    }

    // SUBCOORDINADOR
    else if (modalType === "subcoordinador") {
      if (!currentUser || currentUser.role !== "coordinador")
        return alert("Solo coordinadores pueden agregar subcoordinadores.");

      const { error } = await supabase.from("subcoordinadores").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          localidad: localidadBase,
          mesa: persona.mesa?.toString() || "",
          coordinador_ci: currentUser.ci,
          login_code: codigo,
          asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
        },
      ]);

      if (error) return alert("Error guardando subcoordinador");

      alert(`Subcoordinador agregado.\nCódigo: ${codigo}`);
    }

    // VOTANTE
    else if (modalType === "votante") {
      const { error } = await supabase.from("votantes").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          localidad: localidadBase,
          mesa: persona.mesa?.toString() || "",
          asignado_por: currentUser.ci,
          asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
        },
      ]);

      if (error) return alert("Error guardando votante");

      alert("Votante asignado correctamente.");
    }

    setShowAddModal(false);
    await recargarEstructura();
  };

  // ======================= QUITAR PERSONA =======================
  const quitarPersona = async (ci, tipo) => {
    if (!window.confirm("¿Eliminar?")) return;

    if (tipo === "coordinador") {
      const { data: subs } = await supabase
        .from("subcoordinadores")
        .select("ci")
        .eq("coordinador_ci", ci);

      const subCIs = subs?.map((s) => s.ci) || [];

      if (subCIs.length > 0)
        await supabase.from("votantes").delete().in("asignado_por", subCIs);

      await supabase.from("votantes").delete().eq("asignado_por", ci);
      await supabase.from("subcoordinadores").delete().eq("coordinador_ci", ci);
      await supabase.from("coordinadores").delete().eq("ci", ci);
    }

    if (tipo === "subcoordinador") {
      await supabase.from("votantes").delete().eq("asignado_por", ci);
      await supabase.from("subcoordinadores").delete().eq("ci", ci);
    }

    if (tipo === "votante") {
      await supabase.from("votantes").delete().eq("ci", ci);
    }

    recargarEstructura();
  };

  // ======================= RELACIONES =======================
  const getMisSubcoordinadores = () =>
    estructura.subcoordinadores.filter((s) => s.coordinadorCI === currentUser?.ci);

  const getMisVotantes = () =>
    estructura.votantes.filter((v) => v.asignadoPor === currentUser?.ci);

  const getVotantesDeSubcoord = (subci) =>
    estructura.votantes.filter((v) => v.asignadoPor === subci);

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    if (!loginID.trim()) return alert("Ingrese CI o código.");

    // SUPERADMIN
    if (loginID === "4630621") {
      if (loginPass !== "12345") return alert("Contraseña incorrecta.");
      setCurrentUser({
        ci: "4630621",
        nombre: "Denis",
        apellido: "Ramos",
        role: "superadmin",
      });
      return;
    }

    // COORDINADOR
    const coordRes = await supabase
      .from("coordinadores")
      .select("*")
      .eq("login_code", loginID.trim());

    if (coordRes.data?.length > 0) {
      setCurrentUser({ ...normalizarCoordinador(coordRes.data[0]), role: "coordinador" });
      return;
    }

    // SUB
    const subRes = await supabase
      .from("subcoordinadores")
      .select("*")
      .eq("login_code", loginID.trim());

    if (subRes.data?.length > 0) {
      setCurrentUser({ ...normalizarSubcoordinador(subRes.data[0]), role: "subcoordinador" });
      return;
    }

    alert("Código no encontrado.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginID("");
    setLoginPass("");
    setExpandedCoords({});
  };
  // ======================= LOGIN SCREEN =======================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-red-600 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800 mt-3">
              Sistema Electoral
            </h1>
            <p className="text-gray-600">Gestión de Votantes</p>
          </div>

          <label className="text-sm font-medium text-gray-700">
            CI o Código de Acceso
          </label>
          <input
            type="text"
            value={loginID}
            onChange={(e) => setLoginID(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
            placeholder="Ej: 1234567 o ABC123"
          />

          {loginID === "4630621" && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Contraseña de Superadmin
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Ingrese contraseña"
              />
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold mb-3"
          >
            Iniciar Sesión
          </button>

          <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-700">
            <p className="font-semibold mb-2">📋 Instrucciones:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Ingrese el código proporcionado por el Admin.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ======================= ESTADÍSTICAS =======================
  const stats = (() => {
    if (currentUser.role === "superadmin") {
      return {
        coordinadores: estructura.coordinadores.length,
        subcoordinadores: estructura.subcoordinadores.length,
        votantes: estructura.votantes.length,
      };
    }

    if (currentUser.role === "coordinador") {
      const subs = getMisSubcoordinadores();
      const directos = getMisVotantes();
      let indirectos = 0;

      subs.forEach((s) => {
        indirectos += getVotantesDeSubcoord(s.ci).length;
      });

      return {
        subcoordinadores: subs.length,
        votantesDirectos: directos.length,
        votantesIndirectos: indirectos,
        total: directos.length + indirectos,
      };
    }

    if (currentUser.role === "subcoordinador") {
      return {
        votantes: getMisVotantes().length,
      };
    }

    return {};
  })();

  // ======================= HEADER / DASHBOARD =======================
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Sistema Electoral</h1>
            <p className="text-red-200 text-sm mt-1">
              {currentUser.nombre} {currentUser.apellido} —
              {currentUser.role === "superadmin"
                ? " ⭐ Superadmin"
                : currentUser.role === "coordinador"
                ? " Coordinador"
                : " Subcoordinador"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* TARJETAS DE ESTADISTICAS */}
<div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
  {currentUser.role === "superadmin" && (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 text-sm">Coordinadores</p>
        <p className="text-4xl font-bold text-red-600">{stats.coordinadores}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 text-sm">Subcoordinadores</p>
        <p className="text-4xl font-bold text-red-600">{stats.subcoordinadores}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 text-sm">Votantes</p>
        <p className="text-4xl font-bold text-red-600">{stats.votantes}</p>
      </div>
    </>
  )}

  {currentUser.role === "coordinador" && (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 text-sm">Subcoordinadores</p>
        <p className="text-4xl font-bold text-red-600">{stats.subcoordinadores}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 text-sm">Votantes Directos</p>
        <p className="text-4xl font-bold text-red-600">{stats.votantesDirectos}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 text-sm">Total en Red</p>
        <p className="text-4xl font-bold text-red-600">{stats.total}</p>
      </div>
    </>
  )}

  {currentUser.role === "subcoordinador" && (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm">Mis votantes</p>
      <p className="text-4xl font-bold text-red-600">{stats.votantes}</p>
    </div>
  )}
</div>


      {/* BOTONES DE ACCIONES */}
      <div className="max-w-7xl mx-auto px-4 mb-6 flex flex-wrap gap-3">
        {currentUser.role === "superadmin" && (
          <ButtonRed onClick={() => { setModalType("coordinador"); setShowAddModal(true); }}>
            <UserPlus className="w-4 h-4" />
            Agregar Coordinador
          </ButtonRed>
        )}

        {currentUser.role === "coordinador" && (
          <ButtonRed onClick={() => { setModalType("subcoordinador"); setShowAddModal(true); }}>
            <UserPlus className="w-4 h-4" />
            Agregar Subcoordinador
          </ButtonRed>
        )}

        {(currentUser.role === "coordinador" || currentUser.role === "subcoordinador") && (
          <ButtonOutline onClick={() => { setModalType("votante"); setShowAddModal(true); }}>
            <UserPlus className="w-4 h-4" />
            Agregar Votante
          </ButtonOutline>
        )}

        <ButtonOutline onClick={generarPDF}>
          <BarChart3 className="w-4 h-4" />
          Descargar PDF
        </ButtonOutline>
      </div>

      {/* LISTAS COMPLETAS */}
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Mi Estructura</h2>
          </div>

          <div className="p-6">
            {/* SUPERADMIN */}
            {currentUser.role === "superadmin" &&
              estructura.coordinadores.map((coord) => (
                <CardCoordinador
                  key={coord.ci}
                  coord={coord}
                  expandedCoords={expandedCoords}
                  toggleExpand={toggleExpand}
                  estructura={estructura}
                  quitarPersona={quitarPersona}
                  getVotantesDeSubcoord={getVotantesDeSubcoord}
                />
              ))}

            {/* COORDINADOR */}
            {currentUser.role === "coordinador" &&
              getMisSubcoordinadores().map((sub) => (
                <CardSub
                  key={sub.ci}
                  sub={sub}
                  expandedCoords={expandedCoords}
                  toggleExpand={toggleExpand}
                  getVotantesDeSubcoord={getVotantesDeSubcoord}
                  quitarPersona={quitarPersona}
                />
              ))}

            {/* SUBCOORDINADOR */}
            {currentUser.role === "subcoordinador" &&
              getMisVotantes().map((v) => (
                <CardVotante key={v.ci} v={v} quitarPersona={quitarPersona} />
              ))}
          </div>
        </div>
      </div>

      {/* MODAL DE AGREGAR */}
      <AddPersonModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        tipo={modalType}
        onAdd={handleAgregarPersona}
        disponibles={getPersonasDisponibles()}
      />
    </div>
  );
};

export default App;
