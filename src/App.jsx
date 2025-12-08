// App.jsx – Versión Supabase + padrón remoto CORREGIDA

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
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
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

              return (
                <div
                  key={persona.ci}
                  onClick={() => !bloqueado && onAdd(persona)}
                  className={`p-4 border rounded-lg transition relative ${
                    bloqueado
                      ? "bg-gray-200 cursor-not-allowed opacity-60"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-semibold text-gray-800">
                    {persona.nombre} {persona.apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    CI: {persona.ci} • Mesa: {persona.mesa}
                  </p>

                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya fue agregado por{" "}
                      <b>{persona.asignadoPorNombre || "otro referente"}</b>{" "}
                      {persona.asignadoRol && `(${persona.asignadoRol})`}
                    </p>
                  )}

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

        {/* PAGINACIÓN */}
        {filtered.length > 5 && (
          <div className="px-6 pb-3 flex justify-between items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ◀ Anterior
            </button>

            <span>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente ▶
            </button>
          </div>
        )}

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

// ======================= APP PRINCIPAL =======================
const App = () => {
  const [padron, setPadron] = useState([]);

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
      if (!error) setPadron(data);
    };
    cargarPadron();
  }, []);

  // ======================= NORMALIZADORES =======================
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
    const { data: subs } = await supabase
      .from("subcoordinadores")
      .select("*");
    const { data: votos } = await supabase.from("votantes").select("*");

    setEstructura({
      coordinadores: coords?.map(normalizarCoordinador) || [],
      subcoordinadores: subs?.map(normalizarSubcoordinador) || [],
      votantes: votos?.map(normalizarVotante) || [],
    });
  };

  useEffect(() => {
    recargarEstructura();
  }, []);

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    if (!loginID.trim()) {
      alert("Ingrese su CI o código.");
      return;
    }

    // SUPERADMIN
    if (loginID === "4630621") {
      if (loginPass !== "12345") return alert("Contraseña incorrecta");

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
      const c = normalizarCoordinador(coordRes.data[0]);
      setCurrentUser({ ...c, role: "coordinador" });
      return;
    }

    // SUBCOORDINADOR
    const subRes = await supabase
      .from("subcoordinadores")
      .select("*")
      .eq("login_code", loginID.trim());

    if (subRes.data?.length > 0) {
      const s = normalizarSubcoordinador(subRes.data[0]);
      setCurrentUser({ ...s, role: "subcoordinador" });
      return;
    }

    alert("Usuario no encontrado.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginID("");
    setLoginPass("");
  };

  // ======================= PERSONAS DISPONIBLES =======================
  const getPersonasDisponibles = () => {
    return padron.map((p) => {
      const coord = estructura.coordinadores.find((c) => c.ci === p.ci);
      if (coord)
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: coord.nombre + " " + coord.apellido,
          asignadoRol: "Coordinador",
        };

      const sub = estructura.subcoordinadores.find((s) => s.ci === p.ci);
      if (sub)
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: sub.nombre + " " + sub.apellido,
          asignadoRol: "Subcoordinador",
        };

      const vot = estructura.votantes.find((v) => v.ci === p.ci);
      if (v)
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: v.asignadoPorNombre,
          asignadoRol: "Votante",
        };

      return { ...p, asignado: false };
    });
  };

  // ======================= AGREGAR PERSONA =======================
  const generarCodigo = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleAgregarPersona = async (persona) => {
    const codigo = generarCodigo();

    if (modalType === "coordinador") {
      await supabase.from("coordinadores").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          mesa: persona.mesa,
          localidad: "Fernando de la Mora",
          login_code: codigo,
          asignado_por_nombre: "Superadmin",
        },
      ]);

      alert(`Coordinador agregado.\nCódigo: ${codigo}`);
    }

    if (modalType === "subcoordinador") {
      if (currentUser.role !== "coordinador")
        return alert("Solo un coordinador puede agregar subcoordinadores");

      await supabase.from("subcoordinadores").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          mesa: persona.mesa,
          localidad: "Fernando de la Mora",
          coordinador_ci: currentUser.ci,
          login_code: codigo,
          asignado_por_nombre: currentUser.nombre + " " + currentUser.apellido,
        },
      ]);

      alert(`Subcoordinador agregado.\nCódigo: ${codigo}`);
    }

    if (modalType === "votante") {
      await supabase.from("votantes").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          mesa: persona.mesa,
          localidad: "Fernando de la Mora",
          asignado_por: currentUser.ci,
          asignado_por_nombre:
            currentUser.nombre + " " + currentUser.apellido,
        },
      ]);

      alert("Votante asignado correctamente.");
    }

    setShowAddModal(false);
    recargarEstructura();
  };

  // ======================= QUITAR PERSONA =======================
  const quitarPersona = async (ci, tipo) => {
    if (!window.confirm("¿Está seguro?")) return;

    if (tipo === "coordinador") {
      await supabase.from("subcoordinadores").delete().eq("coordinador_ci", ci);
      await supabase.from("votantes").delete().eq("asignado_por", ci);
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

  // ============
  // LOGIN SCREEN
  // ============
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <div className="text-center mb-6">
            <Users className="w-16 h-16 text-red-600 mx-auto" />
            <h1 className="text-3xl font-bold">Sistema Electoral</h1>
          </div>

          <input
            type="text"
            placeholder="CI o Código"
            value={loginID}
            onChange={(e) => setLoginID(e.target.value)}
            className="w-full p-3 border rounded mb-3"
          />

          {loginID === "4630621" && (
            <input
              type="password"
              placeholder="Contraseña"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              className="w-full p-3 border rounded mb-3"
            />
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-red-600 text-white py-3 rounded-lg"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // ======================= DASHBOARD =======================
  const getMisSubcoordinadores = () =>
    estructura.subcoordinadores.filter(
      (x) => x.coordinadorCI === currentUser.ci
    );

  const getMisVotantes = () =>
    estructura.votantes.filter((x) => x.asignadoPor === currentUser.ci);

  const getVotantesDeSub = (ci) =>
    estructura.votantes.filter((x) => x.asignadoPor === ci);

  // ======================= UI =======================
  const toggleExpand = (ci) =>
    setExpandedCoords((prev) => ({ ...prev, [ci]: !prev[ci] }));

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-red-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sistema Electoral</h1>

        <button
          onClick={handleLogout}
          className="bg-red-800 px-3 py-2 rounded-lg"
        >
          <LogOut className="w-4 h-4 inline" /> Salir
        </button>
      </div>

      {/* ACCIONES */}
      <div className="p-4 flex gap-3">
        {currentUser.role === "superadmin" && (
          <button
            onClick={() => {
              setModalType("coordinador");
              setShowAddModal(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            <UserPlus className="w-4 h-4 inline" /> Agregar Coordinador
          </button>
        )}

        {currentUser.role === "coordinador" && (
          <button
            onClick={() => {
              setModalType("subcoordinador");
              setShowAddModal(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            <UserPlus className="w-4 h-4 inline" /> Agregar Subcoordinador
          </button>
        )}

        {(currentUser.role === "coordinador" ||
          currentUser.role === "subcoordinador") && (
          <button
            onClick={() => {
              setModalType("votante");
              setShowAddModal(true);
            }}
            className="border border-red-600 text-red-600 px-4 py-2 rounded-lg"
          >
            <UserPlus className="w-4 h-4 inline" /> Agregar Votante
          </button>
        )}
      </div>

      {/* LISTADO */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-4">Mi estructura</h2>

          {/* SUPERADMIN */}
          {currentUser.role === "superadmin" &&
            estructura.coordinadores.map((coord) => (
              <div
                key={coord.ci}
                className="border rounded mb-2 bg-red-50 cursor-pointer"
                onClick={() => toggleExpand(coord.ci)}
              >
                <div className="flex justify-between p-3">
                  <div>
                    <p className="font-semibold">
                      {coord.nombre} {coord.apellido}
                    </p>
                    <p className="text-sm">CI: {coord.ci}</p>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </div>

                {expandedCoords[coord.ci] && (
                  <div className="p-3 bg-white">
                    <p className="font-semibold">Subcoordinadores</p>

                    {estructura.subcoordinadores
                      .filter((s) => s.coordinadorCI === coord.ci)
                      .map((s) => (
                        <div key={s.ci} className="border p-2 rounded mt-2">
                          {s.nombre} {s.apellido}
                        </div>
                      ))}

                    <p className="font-semibold mt-3">Votantes directos</p>
                    {estructura.votantes
                      .filter((v) => v.asignadoPor === coord.ci)
                      .map((v) => (
                        <div key={v.ci} className="border p-2 rounded mt-2">
                          {v.nombre} {v.apellido}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}

          {/* COORDINADOR */}
          {currentUser.role === "coordinador" &&
            getMisSubcoordinadores().map((sub) => (
              <div
                key={sub.ci}
                className="border rounded mb-2 bg-red-50 cursor-pointer"
                onClick={() => toggleExpand(sub.ci)}
              >
                <div className="flex justify-between p-3">
                  <div>
                    <p className="font-semibold">
                      {sub.nombre} {sub.apellido}
                    </p>
                    <p className="text-sm">CI: {sub.ci}</p>
                  </div>
                </div>

                {expandedCoords[sub.ci] && (
                  <div className="p-3 bg-white">
                    <p className="font-semibold">Votantes</p>
                    {getVotantesDeSub(sub.ci).map((v) => (
                      <div key={v.ci} className="border p-2 rounded mt-2">
                        {v.nombre} {v.apellido}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* VOTANTES DIRECTOS */}
          {currentUser.role === "coordinador" && (
            <>
              <h3 className="mt-4 font-semibold">Mis votantes directos</h3>
              {getMisVotantes().map((v) => (
                <div key={v.ci} className="border p-2 rounded mt-2 bg-white">
                  {v.nombre} {v.apellido}
                </div>
              ))}
            </>
          )}

          {/* SUBCOORDINADOR */}
          {currentUser.role === "subcoordinador" &&
            getMisVotantes().map((v) => (
              <div key={v.ci} className="border p-2 rounded mt-2 bg-white">
                {v.nombre} {v.apellido}
              </div>
            ))}
        </div>
      </div>

      {/* MODAL */}
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
