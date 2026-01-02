// ======================= APP SISTEMA ELECTORAL =======================
// Orquestador principal (estado + UI)
// La lógica vive en services/ y utils/

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// ICONOS
import { LogOut, UserPlus, BarChart3 } from "lucide-react";

// COMPONENTES
import AddPersonModal from "./AddPersonModal";
import MiEstructura from "./components/MiEstructura";
import BuscadorCI from "./components/BuscadorCI";
import ModalTelefono from "./components/ModalTelefono";

// SERVICES
import {
  recargarEstructura as cargarEstructuraCompleta,
  agregarPersona,
  quitarPersona,
  actualizarTelefono,
} from "./services/estructuraService";

import { getEstadisticas } from "./services/estadisticasService";
import { generarPDF } from "./services/pdfService";

// HELPERS
import {
  normalizeCI,
  getPersonasDisponibles,
} from "./utils/estructuraHelpers";

// ======================= COMPONENTE =======================
const App = () => {
  // ======================= ESTADO GLOBAL =======================
  const [estructura, setEstructura] = useState({
    coordinadores: [],
    subcoordinadores: [],
    votantes: [],
  });

  const [padron, setPadron] = useState([]);

  // ======================= SESIÓN =======================
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ======================= UI =======================
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const [searchCI, setSearchCI] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneTarget, setPhoneTarget] = useState(null);
  const [phoneValue, setPhoneValue] = useState("+595");

  // ======================= CARGA INICIAL =======================
  useEffect(() => {
    const loadPadron = async () => {
      const { data } = await supabase.from("padron").select("*");
      setPadron(data || []);
    };
    loadPadron();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    recargar();
  }, [currentUser]);

  const recargar = async () => {
    const data = await cargarEstructuraCompleta();
    setEstructura(data);
  };

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    if (!loginID.trim()) return alert("Ingrese código");

    // SUPERADMIN
    if (loginID === "4630621") {
      if (loginPass !== "12345") return alert("Contraseña incorrecta");

      const u = {
        ci: 4630621,
        nombre: "Denis",
        apellido: "Ramos",
        role: "superadmin",
      };

      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    // COORDINADOR
    const { data: coord } = await supabase
      .from("coordinadores")
      .select("*,padron(*)")
      .eq("login_code", loginID)
      .maybeSingle();

    if (coord?.padron) {
      const u = {
        ci: normalizeCI(coord.ci),
        nombre: coord.padron.nombre,
        apellido: coord.padron.apellido,
        role: "coordinador",
      };
      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    // SUBCOORDINADOR
    const { data: sub } = await supabase
      .from("subcoordinadores")
      .select("*,padron(*)")
      .eq("login_code", loginID)
      .maybeSingle();

    if (sub?.padron) {
      const u = {
        ci: normalizeCI(sub.ci),
        nombre: sub.padron.nombre,
        apellido: sub.padron.apellido,
        role: "subcoordinador",
      };
      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    alert("Usuario no encontrado");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  // ======================= AGREGAR PERSONA =======================
  const handleAgregarPersona = async (persona) => {
    const ci = normalizeCI(persona.ci);
    let tabla = "";
    let data = {};

    if (modalType === "coordinador") {
      tabla = "coordinadores";
      data = { ci };
    }

    if (modalType === "subcoordinador") {
      tabla = "subcoordinadores";
      data = {
        ci,
        coordinador_ci: currentUser.ci,
      };
    }

    if (modalType === "votante") {
      tabla = "votantes";
      data = {
        ci,
        asignado_por: currentUser.ci,
        coordinador_ci:
          currentUser.role === "coordinador"
            ? currentUser.ci
            : estructura.subcoordinadores.find(
                (s) => normalizeCI(s.ci) === currentUser.ci
              )?.coordinador_ci,
      };
    }

    await agregarPersona(tabla, data);
    setShowAddModal(false);
    recargar();
  };

  // ======================= ELIMINAR =======================
  const handleEliminar = async (ci, tipo) => {
    const tabla =
      tipo === "coordinador"
        ? "coordinadores"
        : tipo === "subcoordinador"
        ? "subcoordinadores"
        : "votantes";

    await quitarPersona(tabla, ci);
    recargar();
  };

  // ======================= TELÉFONO =======================
  const handleEditarTelefono = (tipo, persona) => {
    setPhoneTarget({ tipo, ...persona });
    setPhoneValue(persona.telefono || "+595");
    setPhoneModalOpen(true);
  };

  const handleGuardarTelefono = async () => {
    await actualizarTelefono(phoneTarget.tipo, phoneTarget.ci, phoneValue);
    setPhoneModalOpen(false);
    setPhoneTarget(null);
    setPhoneValue("+595");
    recargar();
  };

  // ======================= ESTADÍSTICAS =======================
  const stats = getEstadisticas(estructura, currentUser);

  // ======================= LOGIN VIEW =======================
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow w-full max-w-md">
          <input
            value={loginID}
            onChange={(e) => setLoginID(e.target.value)}
            placeholder="Código de acceso"
            className="w-full border p-2 mb-3"
          />
          {loginID === "4630621" && (
            <input
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="Contraseña"
              className="w-full border p-2 mb-3"
            />
          )}
          <button
            onClick={handleLogin}
            className="w-full bg-red-600 text-white p-2 rounded"
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  // ======================= DASHBOARD =======================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-red-600 text-white p-4 flex justify-between">
        <div>
          {currentUser.nombre} {currentUser.apellido} — {currentUser.role}
        </div>
        <button onClick={handleLogout}>
          <LogOut />
        </button>
      </header>

      {/* ACCIONES */}
      <div className="p-4 flex gap-2">
        <button
          onClick={() => {
            setModalType("votante");
            setShowAddModal(true);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded flex gap-2"
        >
          <UserPlus /> Agregar
        </button>

        <button
          onClick={() =>
            generarPDF({
              tipo: "estructura",
              estructura,
              padron,
              currentUser,
            })
          }
          className="border px-4 py-2 rounded flex gap-2"
        >
          <BarChart3 /> PDF
        </button>
      </div>

      {/* BUSCADOR */}
      <BuscadorCI
        value={searchCI}
        onChange={setSearchCI}
        onBuscar={setSearchResult}
        resultado={searchResult}
        onEditarTelefono={handleEditarTelefono}
        onEliminar={handleEliminar}
      />

      {/* ESTRUCTURA */}
      <MiEstructura
        estructura={estructura}
        currentUser={currentUser}
        expanded={{}}
        toggleExpand={() => {}}
        abrirTelefono={handleEditarTelefono}
        quitarPersona={handleEliminar}
      />

      {/* MODALES */}
      <AddPersonModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        tipo={modalType}
        onAdd={handleAgregarPersona}
        disponibles={getPersonasDisponibles(padron, estructura)}
      />

      <ModalTelefono
        open={phoneModalOpen}
        persona={phoneTarget}
        value={phoneValue}
        onChange={setPhoneValue}
        onCancel={() => setPhoneModalOpen(false)}
        onSave={handleGuardarTelefono}
      />
    </div>
  );
};

export default App;
