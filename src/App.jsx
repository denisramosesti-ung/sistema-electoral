// ======================= APP SISTEMA ELECTORAL =======================
// Orquestador principal
// - Maneja sesión
// - Carga datos
// - Llama services
// - Renderiza Dashboard

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

// DASHBOARD (UI completa)
import Dashboard from "./components/Dashboard";

// SERVICES
import {
  cargarEstructuraCompleta,
  agregarPersonaService,
  eliminarPersonaService,
  actualizarTelefonoService,
} from "./services/estructuraService";

// HELPERS
import { normalizeCI } from "./utils/estructuraHelpers";

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

  // ======================= CARGA INICIAL =======================
  useEffect(() => {
    const loadPadron = async () => {
      const { data, error } = await supabase.from("padron").select("*");
      if (error) {
        console.error("Error cargando padrón:", error);
        return;
      }
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

  // ======================= RECARGAR ESTRUCTURA =======================
  const recargar = async () => {
    const data = await cargarEstructuraCompleta();
    setEstructura(data);
  };

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    if (!loginID.trim()) return alert("Ingrese código de acceso");

    // ======================= SUPERADMIN =======================
    if (loginID === "4630621") {
      if (loginPass !== "12345") return alert("Contraseña incorrecta");

      const u = {
        ci: "4630621",
        nombre: "Denis",
        apellido: "Ramos",
        role: "superadmin",
      };

      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    // ======================= COORDINADOR =======================
    const { data: coord, error: coordErr } = await supabase
      .from("coordinadores")
      .select("*, padron(*)")
      .eq("login_code", loginID)
      .maybeSingle();

    if (coordErr) console.error(coordErr);

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

    // ======================= SUBCOORDINADOR =======================
    const { data: sub, error: subErr } = await supabase
      .from("subcoordinadores")
      .select("*, padron(*)")
      .eq("login_code", loginID)
      .maybeSingle();

    if (subErr) console.error(subErr);

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

  // ======================= SERVICES WRAPPERS =======================
  // Estos se pasan al Dashboard

  const handleAgregarPersonaService = async ({
    persona,
    modalType,
    currentUser,
    estructura,
  }) => {
    return agregarPersonaService({
      persona,
      modalType,
      currentUser,
      estructura,
    });
  };

  const handleEliminarPersonaService = async (ci, tipo) => {
    return eliminarPersonaService(ci, tipo);
  };

  const handleActualizarTelefonoService = async (tipo, ci, telefono) => {
    return actualizarTelefonoService(tipo, ci, telefono);
  };

  // ======================= LOGIN VIEW =======================
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow w-full max-w-md">
          <input
            value={loginID}
            onChange={(e) => setLoginID(e.target.value)}
            placeholder="Código de acceso"
            className="w-full border p-2 mb-3 rounded"
          />

          {loginID === "4630621" && (
            <input
              type="password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              placeholder="Contraseña"
              className="w-full border p-2 mb-3 rounded"
            />
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700"
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  // ======================= DASHBOARD =======================
  return (
    <Dashboard
      currentUser={currentUser}
      estructura={estructura}
      padron={padron}
      onLogout={handleLogout}
      onRecargar={recargar}
      onAgregarPersonaService={handleAgregarPersonaService}
      onEliminarPersonaService={handleEliminarPersonaService}
      onActualizarTelefonoService={handleActualizarTelefonoService}
    />
  );
};

export default App;
