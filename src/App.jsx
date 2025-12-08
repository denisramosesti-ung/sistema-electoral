// App.jsx completo con modal de búsqueda mejorada, paginación y botón Cerrar
import React, { useState, useEffect } from "react";
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

// ======================GENERADOR DE PADRÓN=======================
const generarPadron = () => {
  const nombres = [
    "María","Carlos","Ana","José","Laura","Pedro","Sofía","Miguel","Lucía","Diego",
    "Valentina","Santiago","Camila","Mateo","Isabella","Sebastián","Martina","Nicolás",
    "Elena","Fernando","Paula","Gabriel","Carmen","Andrés","Rosa","Daniel","Beatriz",
    "Ricardo","Gloria","Javier","Patricia","Alberto","Silvia","Roberto","Mónica"
  ];

  const apellidos = [
    "González","Rodríguez","Martínez","López","Fernández","Sánchez","Ramírez","Torres",
    "Flores","Benítez","Acosta","Vera","Romero","Giménez","Silva","Medina","Coronel",
    "Pereira","Villalba","Ortiz","Báez","Cabrera","Díaz","Núñez","Maldonado","Escobar",
    "Cardozo","Mendoza","Paredes","Aguilar","Rojas","Gaona","Valdez","Miranda","Castro"
  ];

  const localidades = [
    "Asunción","Lambaré","San Lorenzo","Fernando de la Mora","Luque","Capiatá",
    "Ñemby","Villa Elisa","San Antonio","Itauguá","Mariano Roque Alonso"
  ];

  const padron = [];

  for (let i = 1; i <= 110; i++) {
    const ci = (1000000 + i).toString();
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    const localidad = localidades[Math.floor(Math.random() * localidades.length)];
    const mesa = (101 + Math.floor(Math.random() * 50)).toString();

    padron.push({ ci, nombre, apellido, localidad, mesa });
  }

  return padron;
};

const PADRON_SIMULADO = generarPadron();

// ======================= MODAL PARA AGREGAR PERSONA =======================
const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  if (!show) return null;

  // === FILTRO MEJORADO: coincidencias más relevantes primero ===
  let filtered = [];
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    // 1) Coincidencias exactas por CI al inicio
    const exactCI = disponibles.filter((p) =>
      p.ci.startsWith(searchTerm)
    );

    // 2) Coincidencias por nombre y apellido
    const nameMatches = disponibles.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        p.apellido.toLowerCase().includes(term)
    );

    // Unimos sin duplicar
    const combined = [...exactCI, ...nameMatches].filter(
      (p, index, arr) => arr.findIndex((x) => x.ci === p.ci) === index
    );

    // 🛑 LIMITAMOS A 5 RESULTADOS
    filtered = combined.slice(0, 5);
  }

  // PAGINACIÓN (mantengo por si querés usar luego)
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
            paginated.map((persona) => (
              <div
                key={persona.ci}
                className="p-4 border rounded-lg bg-gray-50 hover:bg-red-50 cursor-pointer transition relative"
              >

                {/* INFO → clickeable */}
                <div onClick={() => onAdd(persona)}>
                  <p className="font-semibold text-gray-800">
                    {persona.nombre} {persona.apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    CI: {persona.ci} · {persona.localidad} · Mesa: {persona.mesa}
                  </p>
                </div>

                {/* BOTÓN CANCELAR EN CADA TARJETA */}
                <button
                  className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-sm"
                  onClick={onClose}
                >
                  Cancelar ✖
                </button>
              </div>
            ))
          )}
        </div>

        {/* PAGINACIÓN SOLO SI HAY RESULTADOS */}
        {filtered.length > 5 && (
          <div className="px-6 pb-3 flex justify-between items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ◀ Anterior
            </button>

            <span>Página {page} de {totalPages}</span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente ▶
            </button>
          </div>
        )}

        {/* BOTÓN CERRAR GENERAL */}
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

  // ======================= GENERAR REPORTE PDF =======================
  const generarPDF = () => {

  const doc = new jsPDF({ orientation: "portrait" });

  // ENCABEZADO
  doc.setFontSize(16);
  doc.text("Reporte de Estructura Electoral", 14, 20);

  doc.setFontSize(12);
  doc.text(
    `Generado por: ${currentUser.nombre} ${currentUser.apellido} (${currentUser.role})`,
    14,
    30
  );
  doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 38);

  let y = 50;

  // SUPERADMIN → LISTA DE COORDINADORES
  if (currentUser.role === "superadmin") {
    doc.setFontSize(14);
    doc.text("Listado de Coordinadores", 14, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["CI", "Nombre", "Apellido", "Código"]],
      body: estructura.coordinadores.map((c) => [
        c.ci,
        c.nombre,
        c.apellido,
        c.loginCode || "-",
      ]),
      theme: "striped",
      headStyles: { fillColor: [220, 0, 0] },
    });

    y = doc.lastAutoTable.finalY + 15;
  }

  // COORDINADOR → LISTA DE SUBCOORDINADORES
  if (currentUser.role === "coordinador") {
    const subcoords = getMisSubcoordinadores();

    subcoords.forEach((sub) => {
      doc.setFontSize(14);
      doc.text(
        `Subcoordinador: ${sub.nombre} ${sub.apellido} (Código: ${sub.loginCode})`,
        14,
        y
      );
      y += 5;

      const votantesSub = getVotantesDeSubcoord(sub.ci);

      autoTable(doc, {
        startY: y,
        head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa"]],
        body: votantesSub.map((v) => [
          v.ci,
          v.nombre,
          v.apellido,
          v.localidad,
          v.mesa,
        ]),
        theme: "grid",
        headStyles: { fillColor: [255, 80, 80] },
      });

      y = doc.lastAutoTable.finalY + 12;
    });

    // VOTANTES DIRECTOS DEL COORDINADOR
    const directos = getMisVotantes();
    if (directos.length > 0) {
      doc.setFontSize(14);
      doc.text("Votantes directos del Coordinador:", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa"]],
        body: directos.map((v) => [
          v.ci,
          v.nombre,
          v.apellido,
          v.localidad,
          v.mesa,
        ]),
        theme: "grid",
        headStyles: { fillColor: [255, 80, 80] },
      });

      y = doc.lastAutoTable.finalY + 10;
    }
  }

  // SUBCOORDINADOR → SUS PROPIOS VOTANTES
  if (currentUser.role === "subcoordinador") {
    doc.setFontSize(14);
    doc.text("Mis votantes asignados:", 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa"]],
      body: getMisVotantes().map((v) => [
        v.ci,
        v.nombre,
        v.apellido,
        v.localidad,
        v.mesa,
      ]),
      theme: "grid",
      headStyles: { fillColor: [255, 80, 80] },
    });
  }

  doc.save("reporte_estructura.pdf");
};
  const [currentUser, setCurrentUser] = useState(null);

  // Login
  const [loginID, setLoginID] = useState("");        // CI o código
  const [loginPass, setLoginPass] = useState("");    // solo superadmin

  // Estructura
  const [estructura, setEstructura] = useState({
    coordinadores: [],   // { ci, nombre, apellido, localidad, mesa, loginCode }
    subcoordinadores: [],// { ci, nombre, apellido, localidad, mesa, loginCode, coordinadorCI }
    votantes: []         // { ci, nombre, apellido, localidad, mesa, asignadoPor, asignadoPorRole }
  });

  // UI
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");        // 'coordinador' | 'subcoordinador' | 'votante'
  const [expandedCoords, setExpandedCoords] = useState({}); // para desplegar estructura
  const [openPanel, setOpenPanel] = useState(null);      // reservado si luego agregás acordeones adicionales

  // Cargar desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem("estructura");
    if (saved) {
      setEstructura(JSON.parse(saved));
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem("estructura", JSON.stringify(estructura));
  }, [estructura]);

  // ======================= HELPERS =======================
  const generarCodigo = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const getPersonasAsignadas = () => {
    const asignadas = new Set();

    estructura.coordinadores.forEach((c) => asignadas.add(c.ci));
    estructura.subcoordinadores.forEach((s) => asignadas.add(s.ci));
    estructura.votantes.forEach((v) => asignadas.add(v.ci));

    return asignadas;
  };

  const getPersonasDisponibles = () => {
    const asignadas = getPersonasAsignadas();
    return PADRON_SIMULADO.filter((p) => !asignadas.has(p.ci));
  };

  // ======================= AGREGAR PERSONA =======================
  const handleAgregarPersona = (persona) => {
    const codigo = generarCodigo(); // código para login

    if (modalType === "coordinador") {
      setEstructura((prev) => ({
        ...prev,
        coordinadores: [
          ...prev.coordinadores,
          {
            ...persona,
            loginCode: codigo,
            subcoordinadores: [],
            votantes: [],
          },
        ],
      }));

      alert(
        `Coordinador agregado.\nNombre: ${persona.nombre} ${persona.apellido}\nCódigo de acceso: ${codigo}`
      );
    } else if (modalType === "subcoordinador") {
      if (!currentUser || currentUser.role !== "coordinador") {
        alert("Solo un coordinador puede agregar subcoordinadores.");
        return;
      }

      setEstructura((prev) => ({
        ...prev,
        subcoordinadores: [
          ...prev.subcoordinadores,
          {
            ...persona,
            coordinadorCI: currentUser.ci,
            loginCode: codigo,
            votantes: [],
          },
        ],
      }));

      alert(
        `Sub-coordinador agregado.\nNombre: ${persona.nombre} ${persona.apellido}\nCódigo de acceso: ${codigo}`
      );
    } else if (modalType === "votante") {
      if (!currentUser) {
        alert("Debe iniciar sesión para asignar votantes.");
        return;
      }

      setEstructura((prev) => ({
        ...prev,
        votantes: [
          ...prev.votantes,
          {
            ...persona,
            asignadoPor: currentUser.ci,
            asignadoPorRole: currentUser.role,
          },
        ],
      }));

      alert("Votante asignado correctamente.");
    }

    setShowAddModal(false);
  };

  // ======================= QUITAR PERSONA =======================
  const quitarPersona = (ci, tipo) => {
    const mensajes = {
      coordinador:
        "¿Quitar jerarquía de coordinador? También se quitarán sus subcoordinadores y votantes relacionados.",
      subcoordinador:
        "¿Quitar jerarquía de sub-coordinador? También se quitarán sus votantes.",
      votante: "¿Quitar votante de la lista? Volverá al padrón disponible.",
    };

    if (!window.confirm(mensajes[tipo])) return;

    setEstructura((prev) => {
      let nueva = { ...prev };

      if (tipo === "coordinador") {
        const subcoords = prev.subcoordinadores.filter(
          (s) => s.coordinadorCI === ci
        );
        const subCIs = subcoords.map((s) => s.ci);

        nueva = {
          coordinadores: prev.coordinadores.filter((c) => c.ci !== ci),
          subcoordinadores: prev.subcoordinadores.filter(
            (s) => s.coordinadorCI !== ci
          ),
          votantes: prev.votantes.filter(
            (v) => v.asignadoPor !== ci && !subCIs.includes(v.asignadoPor)
          ),
        };
      } else if (tipo === "subcoordinador") {
        nueva = {
          ...prev,
          subcoordinadores: prev.subcoordinadores.filter((s) => s.ci !== ci),
          votantes: prev.votantes.filter((v) => v.asignadoPor !== ci),
        };
      } else if (tipo === "votante") {
        nueva = {
          ...prev,
          votantes: prev.votantes.filter((v) => v.ci !== ci),
        };
      }

      return nueva;
    });

    alert("Persona removida. Ahora vuelve a estar disponible en el padrón.");
  };

  // ======================= MIS SUBS / VOTANTES =======================
  const getMisSubcoordinadores = () => {
    if (!currentUser || currentUser.role !== "coordinador") return [];
    return estructura.subcoordinadores.filter(
      (s) => s.coordinadorCI === currentUser.ci
    );
  };

  const getMisVotantes = () => {
    if (!currentUser) return [];
    return estructura.votantes.filter((v) => v.asignadoPor === currentUser.ci);
  };

  const getVotantesDeSubcoord = (subcoordCI) => {
    return estructura.votantes.filter((v) => v.asignadoPor === subcoordCI);
  };

  // ======================= ESTADÍSTICAS =======================
  const getEstadisticas = () => {
    if (currentUser?.role === "superadmin") {
      return {
        coordinadores: estructura.coordinadores.length,
        subcoordinadores: estructura.subcoordinadores.length,
        votantes: estructura.votantes.length,
      };
    }

    if (currentUser?.role === "coordinador") {
      const misSubcoords = getMisSubcoordinadores();
      const directos = getMisVotantes();
      let indirectos = 0;

      misSubcoords.forEach((s) => {
        indirectos += getVotantesDeSubcoord(s.ci).length;
      });

      return {
        subcoordinadores: misSubcoords.length,
        votantesDirectos: directos.length,
        votantesIndirectos: indirectos,
        total: directos.length + indirectos,
      };
    }

    if (currentUser?.role === "subcoordinador") {
      const directos = getMisVotantes();
      return {
        votantes: directos.length,
      };
    }

    return {};
  };

  // ======================= LOGIN =======================
  const handleLogin = () => {
    if (!loginID.trim()) {
      alert("Ingrese su CI o código de acceso.");
      return;
    }

    // SUPERADMIN: CI + contraseña
    if (loginID === "4630621") {
      if (loginPass !== "Vania.16052018") {
        alert("Contraseña incorrecta para el Super Administrador.");
        return;
      }

      setCurrentUser({
        ci: "4630621",
        nombre: "Denis",
        apellido: "Ramos",
        role: "superadmin",
      });
      setLoginPass("");
      return;
    }

    // COORDINADOR: login por código
    const coord = estructura.coordinadores.find(
      (c) => c.loginCode === loginID.trim()
    );
    if (coord) {
      setCurrentUser({ ...coord, role: "coordinador" });
      setLoginPass("");
      return;
    }

    // SUBCOORDINADOR: login por código
    const sub = estructura.subcoordinadores.find(
      (s) => s.loginCode === loginID.trim()
    );
    if (sub) {
      setCurrentUser({ ...sub, role: "subcoordinador" });
      setLoginPass("");
      return;
    }

    alert("Usuario no encontrado. Verifique el código o CI.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginID("");
    setLoginPass("");
    setOpenPanel(null);
  };

  const toggleExpand = (ci) => {
    setExpandedCoords((prev) => ({
      ...prev,
      [ci]: !prev[ci],
    }));
  };

  // ======================= LOGIN SCREEN =======================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl w-full max-w-md">
          {/* ICONO */}
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-red-600 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800 mt-3">
              Sistema Electoral
            </h1>
            <p className="text-gray-600">Gestión de Coordinadores</p>
          </div>

          {/* INPUT LOGIN */}
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

          {/* PASSWORD SOLO PARA SUPERADMIN */}
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

          {/* BOTÓN LOGIN */}
          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold mb-3"
          >
            Iniciar Sesión
          </button>

          {/* INSTRUCCIONES */}
          <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-700">
            <p className="font-semibold mb-2">📋 Instrucciones:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Ingrese el código proporcionado por el Admin.</li>
            </ol>
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
  }

  // ======================= DASHBOARD =======================
  const stats = getEstadisticas();

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
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {/* ESTADISTICAS */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentUser.role === "superadmin" && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Coordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.coordinadores}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Sub-coordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.subcoordinadores}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Votantes</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.votantes}
              </p>
            </div>
          </>
        )}

        {currentUser.role === "coordinador" && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Sub-coordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.subcoordinadores}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Votantes Directos</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.votantesDirectos}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total Red</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.total}
              </p>
            </div>
          </>
        )}

        {currentUser.role === "subcoordinador" && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Mis votantes</p>
            <p className="text-4xl font-bold text-red-600">
              {stats.votantes}
            </p>
          </div>
        )}
      </div>

      {/* ACCIONES */}
<div className="max-w-7xl mx-auto px-4 mb-6 flex flex-wrap gap-3">
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
      Agregar Sub-coordinador
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

  {/* 🔥 BOTÓN PARA DESCARGAR REPORTE PDF */}
  <button
    onClick={generarPDF}
    className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
  >
    <BarChart3 className="w-4 h-4" />
    Descargar Reporte PDF
  </button>
</div>

      {/* LISTAS */}
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Mi Estructura</h2>
          </div>

          <div className="p-6">
            {/* SUPERADMIN */}
            {currentUser.role === "superadmin" && (
              <>
                {estructura.coordinadores.map((coord) => (
                  <div
                    key={coord.ci}
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    {/* HEADER COORD */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleExpand(coord.ci)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {expandedCoords[coord.ci] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}

                        <div>
                          <p className="font-semibold text-gray-800">
                            {coord.nombre} {coord.apellido}
                          </p>
                          <p className="text-sm text-gray-600">
                            CI: {coord.ci} — Coordinador
                          </p>
                          {coord.loginCode && (
                            <p className="text-xs text-gray-500">
                              Código de acceso: {coord.loginCode}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          quitarPersona(coord.ci, "coordinador");
                        }}
                        className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* SUBLISTA */}
                    {expandedCoords[coord.ci] && (
                      <div className="bg-white px-4 pb-4">
                        {estructura.subcoordinadores
                          .filter((s) => s.coordinadorCI === coord.ci)
                          .map((sub) => (
                            <div
                              key={sub.ci}
                              className="border rounded p-3 mb-2 bg-red-50/40"
                            >
                              <p className="font-semibold text-gray-800">
                                {sub.nombre} {sub.apellido}
                              </p>
                              <p className="text-sm text-gray-600">
                                CI: {sub.ci} — Sub-coordinador
                              </p>
                              {sub.loginCode && (
                                <p className="text-xs text-gray-500">
                                  Código de acceso: {sub.loginCode}
                                </p>
                              )}

                              {estructura.votantes
                                .filter((v) => v.asignadoPor === sub.ci)
                                .map((v) => (
                                  <div
                                    key={v.ci}
                                    className="bg-white border p-2 mt-2 rounded text-sm"
                                  >
                                    {v.nombre} {v.apellido} — CI: {v.ci}
                                  </div>
                                ))}
                            </div>
                          ))}

                        {/* Votantes directos */}
                        {estructura.votantes
                          .filter((v) => v.asignadoPor === coord.ci)
                          .map((v) => (
                            <div
                              key={v.ci}
                              className="bg-white border p-2 mt-2 rounded text-sm"
                            >
                              {v.nombre} {v.apellido} — CI: {v.ci}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}

                {estructura.coordinadores.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No hay coordinadores aún.
                  </p>
                )}
              </>
            )}

            {/* COORDINADOR */}
            {currentUser.role === "coordinador" && (
              <>
                {getMisSubcoordinadores().map((sub) => (
                  <div
                    key={sub.ci}
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    {/* HEADER SUB */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleExpand(sub.ci)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {expandedCoords[sub.ci] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}

                        <div>
                          <p className="font-semibold text-gray-800">
                            {sub.nombre} {sub.apellido}
                          </p>
                          <p className="text-sm text-gray-600">
                            CI: {sub.ci} — Sub-coordinador
                          </p>
                          {sub.loginCode && (
                            <p className="text-xs text-gray-500">
                              Código de acceso: {sub.loginCode}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          quitarPersona(sub.ci, "subcoordinador");
                        }}
                        className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* VOTANTES DEL SUB */}
                    {expandedCoords[sub.ci] && (
                      <div className="bg-white px-4 pb-4">
                        {getVotantesDeSubcoord(sub.ci).map((v) => (
                          <div
                            key={v.ci}
                            className="bg-white border p-2 mt-2 rounded text-sm flex justify-between items-center"
                          >
                            <span>
                              {v.nombre} {v.apellido} — CI: {v.ci}
                            </span>
                            <button
                              onClick={() => quitarPersona(v.ci, "votante")}
                              className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {getVotantesDeSubcoord(sub.ci).length === 0 && (
                          <p className="text-gray-500 text-sm mt-2">
                            Sin votantes asignados.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* VOTANTES DIRECTOS */}
                {getMisVotantes().length > 0 && (
                  <div className="border rounded-lg mb-3 p-4">
                    <p className="font-semibold text-gray-700 mb-3">
                      Mis votantes directos
                    </p>

                    {getMisVotantes().map((v) => (
                      <div
                        key={v.ci}
                        className="bg-white border p-2 mt-2 rounded text-sm flex justify-between items-center"
                      >
                        <span>
                          {v.nombre} {v.apellido} — CI: {v.ci}
                        </span>
                        <button
                          onClick={() => quitarPersona(v.ci, "votante")}
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* SUBCOORDINADOR */}
            {currentUser.role === "subcoordinador" && (
              <>
                {getMisVotantes().map((v) => (
                  <div
                    key={v.ci}
                    className="bg-white border p-2 mt-2 rounded text-sm flex justify-between items-center"
                  >
                    <span>
                      {v.nombre} {v.apellido} — CI: {v.ci}
                    </span>
                    <button
                      onClick={() => quitarPersona(v.ci, "votante")}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {getMisVotantes().length === 0 && (
                  <p className="text-gray-500 py-6">
                    No tiene votantes asignados.
                  </p>
                )}
              </>
            )}
          </div>
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
