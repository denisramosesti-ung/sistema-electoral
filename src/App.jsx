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

// ======================= PADRÓN SIMULADO =======================
const generarPadron = () => {
  const nombres = [
    "María",
    "Carlos",
    "Ana",
    "José",
    "Laura",
    "Pedro",
    "Sofía",
    "Miguel",
    "Lucía",
    "Diego",
    "Valentina",
    "Santiago",
    "Camila",
    "Mateo",
    "Isabella",
    "Sebastián",
    "Martina",
    "Nicolás",
    "Elena",
    "Fernando",
    "Paula",
    "Gabriel",
    "Carmen",
    "Andrés",
    "Rosa",
    "Daniel",
    "Beatriz",
    "Ricardo",
    "Gloria",
    "Javier",
    "Patricia",
    "Alberto",
    "Silvia",
    "Roberto",
    "Mónica",
  ];

  const apellidos = [
    "González",
    "Rodríguez",
    "Martínez",
    "López",
    "Fernández",
    "Sánchez",
    "Ramírez",
    "Torres",
    "Flores",
    "Benítez",
    "Acosta",
    "Vera",
    "Romero",
    "Giménez",
    "Silva",
    "Medina",
    "Coronel",
    "Pereira",
    "Villalba",
    "Ortiz",
    "Báez",
    "Cabrera",
    "Díaz",
    "Núñez",
    "Maldonado",
    "Escobar",
    "Cardozo",
    "Mendoza",
    "Paredes",
    "Aguilar",
    "Rojas",
    "Gaona",
    "Valdez",
    "Miranda",
    "Castro",
  ];

  const localidades = [
    "Asunción",
    "Lambaré",
    "San Lorenzo",
    "Fernando de la Mora",
    "Luque",
    "Capiatá",
    "Ñemby",
    "Villa Elisa",
    "San Antonio",
    "Itauguá",
    "Mariano Roque Alonso",
  ];

  const padron = [];

  for (let i = 1; i <= 110; i++) {
    const ci = String(1000000 + i);
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const apellido = apellidos[Math.floor(Math.random() * apellidos.length)];
    const localidad =
      localidades[Math.floor(Math.random() * localidades.length)];
    const mesa = String(101 + Math.floor(Math.random() * 50));

    padron.push({ ci, nombre, apellido, localidad, mesa });
  }

  return padron;
};

const PADRON_SIMULADO = generarPadron();

// ======================= MODAL PARA AGREGAR PERSONA =======================
const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!show) return null;

  const filteredDisponibles = disponibles.filter(
    (p) =>
      p.ci.includes(searchTerm) ||
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-red-600 text-white">
          <h3 className="text-xl font-bold">
            Agregar{" "}
            {tipo === "coordinador"
              ? "Coordinador"
              : tipo === "subcoordinador"
              ? "Sub-coordinador"
              : "Votante"}
          </h3>
          <button onClick={onClose} className="hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar por CI, nombre o apellido..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
          {filteredDisponibles.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No hay personas disponibles
            </p>
          ) : (
            filteredDisponibles.map((persona) => (
              <div
                key={persona.ci}
                onClick={() => onAdd(persona)}
                className="p-4 border rounded-lg hover:bg-red-50 cursor-pointer transition"
              >
                <p className="font-semibold text-gray-800">
                  {persona.nombre} {persona.apellido}
                </p>
                <p className="text-sm text-gray-600">
                  CI: {persona.ci} · {persona.localidad} · Mesa: {persona.mesa}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
// ======================= APP PRINCIPAL =======================
const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginCI, setLoginCI] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [estructura, setEstructura] = useState({
    coordinadores: [],
    subcoordinadores: [],
    votantes: [],
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [expandedCoords, setExpandedCoords] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem("estructura");
    if (saved) {
      setEstructura(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("estructura", JSON.stringify(estructura));
  }, [estructura]);

  function generarCodigoLogin(prefijo) {
    const numero = Math.floor(100000 + Math.random() * 900000);
    return `${prefijo}-${numero}`;
  }

  function getPersonasAsignadas() {
    const asignadas = new Set();
    estructura.coordinadores.forEach((c) => asignadas.add(c.ci));
    estructura.subcoordinadores.forEach((s) => asignadas.add(s.ci));
    estructura.votantes.forEach((v) => asignadas.add(v.ci));
    return asignadas;
  }

  function getPersonasDisponibles() {
    const asignadas = getPersonasAsignadas();
    return PADRON_SIMULADO.filter((p) => !asignadas.has(p.ci));
  }

  function getMisSubcoordinadores() {
    if (!currentUser || currentUser.role !== "coordinador") return [];
    return estructura.subcoordinadores.filter(
      (s) => s.coordinadorCI === currentUser.ci
    );
  }

  function getMisVotantes() {
    if (!currentUser) return [];
    return estructura.votantes.filter((v) => v.asignadoPor === currentUser.ci);
  }

  function getVotantesDeSubcoord(subcoordCI) {
    return estructura.votantes.filter((v) => v.asignadoPor === subcoordCI);
  }

  function getEstadisticas() {
    if (!currentUser) return {};

    if (currentUser.role === "superadmin") {
      return {
        coordinadores: estructura.coordinadores.length,
        subcoordinadores: estructura.subcoordinadores.length,
        votantes: estructura.votantes.length,
        total:
          estructura.coordinadores.length +
          estructura.subcoordinadores.length +
          estructura.votantes.length,
      };
    }

    if (currentUser.role === "coordinador") {
      const misSubcoords = getMisSubcoordinadores();
      const misVotantes = getMisVotantes();
      let votantesDeSubcoords = 0;
      misSubcoords.forEach((sub) => {
        votantesDeSubcoords += getVotantesDeSubcoord(sub.ci).length;
      });

      return {
        subcoordinadores: misSubcoords.length,
        votantesDirectos: misVotantes.length,
        votantesIndirectos: votantesDeSubcoords,
        total: misVotantes.length + votantesDeSubcoords,
      };
    }

    if (currentUser.role === "subcoordinador") {
      const misVotantes = getMisVotantes();
      return {
        votantes: misVotantes.length,
      };
    }

    return {};
  }

  function toggleExpand(ci) {
    setExpandedCoords((prev) => ({
      ...prev,
      [ci]: !prev[ci],
    }));
  }

  // ===== PDF GENERAL =====
  function generarPDF() {
    if (!currentUser) return;

    const doc = new jsPDF({ orientation: "portrait" });

    doc.setFontSize(16);
    doc.text("Reporte de Estructura Electoral", 14, 20);

    doc.setFontSize(12);
    doc.text(
      `Generado por: ${currentUser.nombre} ${currentUser.apellido} (${currentUser.role})`,
      14,
      30
    );
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 38);

    if (currentUser.role === "superadmin") {
      autoTable(doc, {
        startY: 50,
        head: [["CI", "Nombre", "Apellido", "Código Login"]],
        body: estructura.coordinadores.map((c) => [
          c.ci,
          c.nombre,
          c.apellido,
          c.loginCode || "-",
        ]),
        theme: "striped",
        headStyles: { fillColor: [220, 0, 0] },
      });
    }

    if (currentUser.role === "coordinador") {
      const misSubs = getMisSubcoordinadores();
      autoTable(doc, {
        startY: 50,
        head: [["CI", "Nombre", "Apellido", "Código"]],
        body: misSubs.map((s) => [
          s.ci,
          s.nombre,
          s.apellido,
          s.loginCode || "-",
        ]),
        theme: "striped",
        headStyles: { fillColor: [220, 0, 0] },
      });
    }

    let votantes = [];

    if (currentUser.role === "coordinador") {
      votantes = [
        ...getMisVotantes(),
        ...getMisSubcoordinadores().flatMap((s) =>
          getVotantesDeSubcoord(s.ci)
        ),
      ];
    } else if (currentUser.role === "subcoordinador") {
      votantes = getMisVotantes();
    } else if (currentUser.role === "superadmin") {
      votantes = estructura.votantes;
    }

    if (votantes.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 60,
        head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa"]],
        body: votantes.map((v) => [
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
  }

  // ===== PDF POR SUBCOORDINADOR =====
  function generarPDFSubcoordinador(subcoord) {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Reporte por Sub-Coordinador", 14, y);
    y += 12;

    doc.setFontSize(14);
    doc.text(
      `Nombre: ${subcoord.nombre} ${subcoord.apellido}`,
      14,
      y
    );
    y += 8;
    doc.text(`CI: ${subcoord.ci}`, 14, y);
    y += 8;
    if (subcoord.loginCode) {
      doc.text(`Código de Login: ${subcoord.loginCode}`, 14, y);
      y += 8;
    }

    doc.setFontSize(12);
    y += 4;
    doc.text("Votantes asignados:", 14, y);
    y += 8;

    const votantesSub = estructura.votantes.filter(
      (v) => v.asignadoPor === subcoord.ci
    );

    if (votantesSub.length === 0) {
      doc.text("No tiene votantes asignados.", 14, y);
    } else {
      votantesSub.forEach((v) => {
        doc.text(
          `• ${v.nombre} ${v.apellido} | CI: ${v.ci} | Mesa: ${v.mesa}`,
          14,
          y
        );
        y += 7;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    }

    doc.save(`subcoordinador_${subcoord.ci}.pdf`);
  }
  // ===== LOGIN / LOGOUT =====
  function handleLogin() {
    if (!loginCI.trim()) {
      alert("Por favor ingrese su CI");
      return;
    }

    // Superadmin
    if (loginCI === "4630621") {
      if (loginPassword !== "Vania.16052018") {
        alert("Contraseña de superadmin incorrecta");
        return;
      }
      setCurrentUser({
        ci: "4630621",
        nombre: "Denis",
        apellido: "Ramos",
        role: "superadmin",
      });
      return;
    }

    const coord = estructura.coordinadores.find((c) => c.ci === loginCI);
    if (coord) {
      setCurrentUser({ ...coord, role: "coordinador" });
      return;
    }

    const subcoord = estructura.subcoordinadores.find(
      (s) => s.ci === loginCI
    );
    if (subcoord) {
      setCurrentUser({ ...subcoord, role: "subcoordinador" });
      return;
    }

    alert("CI no encontrado en el sistema.");
  }

  function handleLogout() {
    setCurrentUser(null);
    setLoginCI("");
    setLoginPassword("");
  }

  // ===== AGREGAR PERSONAS =====
  function handleAgregarPersona(persona) {
    if (modalType === "coordinador") {
      const loginCode = generarCodigoLogin("COORD");
      setEstructura((prev) => ({
        ...prev,
        coordinadores: [
          ...prev.coordinadores,
          {
            ...persona,
            loginCode,
          },
        ],
      }));
      alert(
        `${persona.nombre} ${persona.apellido} agregado como coordinador.\n\n` +
          `CI para login: ${persona.ci}\n` +
          `Código de login: ${loginCode}`
      );
    } else if (modalType === "subcoordinador") {
      if (!currentUser || currentUser.role !== "coordinador") return;
      const loginCode = generarCodigoLogin("SUB");
      setEstructura((prev) => ({
        ...prev,
        subcoordinadores: [
          ...prev.subcoordinadores,
          {
            ...persona,
            coordinadorCI: currentUser.ci,
            loginCode,
          },
        ],
      }));
      alert(
        `${persona.nombre} ${persona.apellido} agregado como sub-coordinador.\n\n` +
          `CI para login: ${persona.ci}\n` +
          `Código de login: ${loginCode}`
      );
    } else if (modalType === "votante") {
      if (!currentUser) return;
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
      alert(
        `${persona.nombre} ${persona.apellido} agregado como votante a tu estructura.`
      );
    }

    setShowAddModal(false);
  }

  // ===== QUITAR PERSONAS =====
  function quitarPersona(ci, tipo) {
    const mensajes = {
      coordinador:
        "¿Quitar jerarquía de coordinador? Sus sub-coordinadores y votantes asociados se removerán. Volverá al padrón disponible.",
      subcoordinador:
        "¿Quitar jerarquía de sub-coordinador? Sus votantes asociados se removerán. Volverá al padrón disponible.",
      votante: "¿Quitar votante de su lista? Volverá al padrón disponible.",
    };

    if (!window.confirm(mensajes[tipo])) return;

    setEstructura((prev) => {
      let nuevaEstructura = { ...prev };

      if (tipo === "coordinador") {
        const subcoords = prev.subcoordinadores.filter(
          (s) => s.coordinadorCI === ci
        );
        const subcoordCIs = subcoords.map((s) => s.ci);

        nuevaEstructura = {
          coordinadores: prev.coordinadores.filter((c) => c.ci !== ci),
          subcoordinadores: prev.subcoordinadores.filter(
            (s) => s.coordinadorCI !== ci
          ),
          votantes: prev.votantes.filter(
            (v) =>
              v.asignadoPor !== ci && !subcoordCIs.includes(v.asignadoPor)
          ),
        };
      } else if (tipo === "subcoordinador") {
        nuevaEstructura = {
          ...prev,
          subcoordinadores: prev.subcoordinadores.filter((s) => s.ci !== ci),
          votantes: prev.votantes.filter((v) => v.asignadoPor !== ci),
        };
      } else if (tipo === "votante") {
        nuevaEstructura = {
          ...prev,
          votantes: prev.votantes.filter((v) => v.ci !== ci),
        };
      }

      return nuevaEstructura;
    });

    alert("Persona removida exitosamente. Ahora está disponible en el padrón.");
  }

  // ===== LOGIN UI =====
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-red-600 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800 mt-3">
              Sistema Electoral
            </h1>
            <p className="text-gray-600">Gestión de Coordinadores</p>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Cédula de Identidad
              </label>
              <input
                type="text"
                value={loginCI}
                onChange={(e) => setLoginCI(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 mt-1"
                placeholder="Ingrese su CI"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Contraseña (solo superadmin)
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 mt-1"
                placeholder="Ingrese su contraseña si es superadmin"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
            >
              Iniciar Sesión
            </button>
          </div>

          <button
            onClick={() => {
              setModalType("coordinador");
              setShowAddModal(true);
            }}
            className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Agregar Primer Coordinador
          </button>

          <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-700">
            <p className="font-semibold">📋 Instrucciones:</p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Haz clic en "Agregar Primer Coordinador"</li>
              <li>Selecciona una persona del padrón</li>
              <li>Anota su CI y úsalo para iniciar sesión</li>
            </ol>
            <p className="mt-3 text-xs">
              Superadmin: CI <strong>4630621</strong> – Contraseña{" "}
              <strong>Vania.16052018</strong>
            </p>
          </div>

          <AddPersonModal
            show={showAddModal}
            onClose={() => setShowAddModal(false)}
            tipo={modalType}
            onAdd={handleAgregarPersona}
            disponibles={getPersonasDisponibles()}
          />
        </div>
      </div>
    );
  }

  // ===== DASHBOARD =====
  const stats = getEstadisticas();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sistema Electoral</h1>
            <p className="text-red-100 text-sm">
              {currentUser.nombre} {currentUser.apellido} –{" "}
              {currentUser.role === "superadmin"
                ? "⭐ Super Administrador"
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

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentUser.role === "superadmin" && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Coordinadores</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.coordinadores}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-red-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Sub-coordinadores</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.subcoordinadores}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-red-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Votantes Totales</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.votantes}
                    </p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-red-400" />
                </div>
              </div>
            </>
          )}

          {currentUser.role === "coordinador" && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Sub-coordinadores</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.subcoordinadores}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-red-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Votantes Directos</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.votantesDirectos}
                    </p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-red-400" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Red</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.total}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-red-400" />
                </div>
              </div>
            </>
          )}

          {currentUser.role === "subcoordinador" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Mis Votantes</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.votantes}
                  </p>
                </div>
                <Users className="w-12 h-12 text-red-400" />
              </div>
            </div>
          )}
        </div>

        {/* ACCIONES */}
        <div className="max-w-7xl mx-auto px-0 mb-2 flex flex-wrap gap-3">
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

          <button
            onClick={generarPDF}
            className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
          >
            <BarChart3 className="w-4 h-4" />
            Descargar Reporte PDF
          </button>
        </div>
        {/* ESTRUCTURA */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Mi Estructura</h2>
          </div>

          <div className="p-6">
            {/* SUPERADMIN: VE TODOS LOS COORDINADORES */}
            {currentUser.role === "superadmin" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  Todos los Coordinadores
                </h3>
                {estructura.coordinadores.map((coord) => (
                  <div key={coord.ci} className="border rounded-lg overflow-hidden">
                    <div className="bg-red-50 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleExpand(coord.ci)}
                          className="text-red-600 hover:text-red-800"
                        >
                          {expandedCoords[coord.ci] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {coord.nombre} {coord.apellido}
                          </p>
                          <p className="text-sm text-gray-600">
                            CI: {coord.ci} | Coordinador
                          </p>
                          {coord.loginCode && (
                            <p className="text-xs text-gray-500">
                              Código login: {coord.loginCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => quitarPersona(coord.ci, "coordinador")}
                        className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition ml-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {expandedCoords[coord.ci] && (
                      <div className="p-4 bg-gray-50 space-y-3">
                        {estructura.subcoordinadores
                          .filter((s) => s.coordinadorCI === coord.ci)
                          .map((subcoord) => (
                            <div
                              key={subcoord.ci}
                              className="bg-red-50 rounded-lg p-3 border border-red-200"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {subcoord.nombre} {subcoord.apellido}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    CI: {subcoord.ci} | Sub-coordinador
                                  </p>
                                  {subcoord.loginCode && (
                                    <p className="text-xs text-gray-500">
                                      Código login: {subcoord.loginCode}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4 space-y-1">
                                {estructura.votantes
                                  .filter((v) => v.asignadoPor === subcoord.ci)
                                  .map((votante) => (
                                    <div
                                      key={votante.ci}
                                      className="text-sm bg-white p-2 rounded"
                                    >
                                      <span className="font-medium">
                                        {votante.nombre} {votante.apellido}
                                      </span>
                                      <span className="text-gray-600">
                                        {" "}
                                        - CI: {votante.ci}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}

                        {estructura.votantes.filter(
                          (v) => v.asignadoPor === coord.ci
                        ).length > 0 && (
                          <div className="bg-white border-2 border-red-200 rounded-lg p-3">
                            <p className="font-semibold text-gray-700 mb-2">
                              Votantes directos:
                            </p>
                            <div className="space-y-1">
                              {estructura.votantes
                                .filter((v) => v.asignadoPor === coord.ci)
                                .map((votante) => (
                                  <div
                                    key={votante.ci}
                                    className="text-sm bg-white p-2 rounded"
                                  >
                                    <span className="font-medium">
                                      {votante.nombre} {votante.apellido}
                                    </span>
                                    <span className="text-gray-600">
                                      {" "}
                                      - CI: {votante.ci}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {estructura.coordinadores.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No hay coordinadores registrados aún
                  </p>
                )}
              </div>
            )}

            {/* COORDINADOR: VE SUS SUBCOORDS Y VOTANTES */}
            {currentUser.role === "coordinador" && (
              <div className="space-y-4">
                {getMisSubcoordinadores().map((subcoord) => (
                  <div
                    key={subcoord.ci}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="bg-red-50 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => toggleExpand(subcoord.ci)}
                          className="text-red-600 hover:text-red-800"
                        >
                          {expandedCoords[subcoord.ci] ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {subcoord.nombre} {subcoord.apellido}
                          </p>
                          <p className="text-sm text-gray-600">
                            CI: {subcoord.ci} | Sub-coordinador |{" "}
                            {getVotantesDeSubcoord(subcoord.ci).length} votantes
                          </p>
                          {subcoord.loginCode && (
                            <p className="text-xs text-gray-500">
                              Código login: {subcoord.loginCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => generarPDFSubcoordinador(subcoord)}
                          className="bg-white border-2 border-red-600 text-red-600 p-2 rounded hover:bg-red-50 transition ml-2"
                        >
                          📄
                        </button>
                        <button
                          onClick={() =>
                            quitarPersona(subcoord.ci, "subcoordinador")
                          }
                          className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition ml-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expandedCoords[subcoord.ci] && (
                      <div className="p-4 bg-gray-50">
                        {getVotantesDeSubcoord(subcoord.ci).map((votante) => (
                          <div
                            key={votante.ci}
                            className="bg-white p-3 rounded mb-2 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium">
                                {votante.nombre} {votante.apellido}
                              </p>
                              <p className="text-sm text-gray-600">
                                CI: {votante.ci} | Mesa: {votante.mesa}
                              </p>
                            </div>
                          </div>
                        ))}
                        {getVotantesDeSubcoord(subcoord.ci).length === 0 && (
                          <p className="text-gray-500 text-sm text-center py-2">
                            Sin votantes asignados
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {getMisVotantes().length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-white border-2 border-red-200 p-4">
                      <p className="font-semibold text-gray-800">
                        Mis Votantes Directos
                      </p>
                    </div>
                    <div className="p-4">
                      {getMisVotantes().map((votante) => (
                        <div
                          key={votante.ci}
                          className="bg-white border p-3 rounded mb-2 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {votante.nombre} {votante.apellido}
                            </p>
                            <p className="text-sm text-gray-600">
                              CI: {votante.ci} | Mesa: {votante.mesa}
                            </p>
                          </div>
                          <button
                            onClick={() => quitarPersona(votante.ci, "votante")}
                            className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {getMisSubcoordinadores().length === 0 &&
                  getMisVotantes().length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No hay personas en tu estructura aún
                    </p>
                  )}
              </div>
            )}

            {/* SUBCOORDINADOR: VE SOLO SUS VOTANTES */}
            {currentUser.role === "subcoordinador" && (
              <div>
                {getMisVotantes().map((votante) => (
                  <div
                    key={votante.ci}
                    className="bg-white border p-4 rounded mb-2 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {votante.nombre} {votante.apellido}
                      </p>
                      <p className="text-sm text-gray-600">
                        CI: {votante.ci} | Mesa: {votante.mesa}
                      </p>
                    </div>
                    <button
                      onClick={() => quitarPersona(votante.ci, "votante")}
                      className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {getMisVotantes().length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No tienes votantes asignados aún
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL GLOBAL */}
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
