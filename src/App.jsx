// ======================= APP SISTEMA ELECTORAL =======================
// Orquestador principal
// Estado + Supabase + lógica
// UI delegada a Dashboard.jsx

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import Dashboard from "./pages/Dashboard";

// helpers
import {
  normalizeCI,
  getPersonasDisponibles,
} from "./utils/estructuraHelpers";

// services
import { getEstadisticas } from "./services/estadisticasService";
import { generarPDF } from "./services/pdfService";

// ======================= COMPONENTE =======================
const App = () => {
  // ======================= ESTADO GLOBAL =======================
  const [padron, setPadron] = useState([]);
  const [estructura, setEstructura] = useState({
    coordinadores: [],
    subcoordinadores: [],
    votantes: [],
  });

  // ======================= SESIÓN =======================
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ======================= UI =======================
  const [expandedCoords, setExpandedCoords] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const [searchCI, setSearchCI] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneTarget, setPhoneTarget] = useState(null);
  const [phoneValue, setPhoneValue] = useState("+595");

  // ======================= CARGA PADRÓN =======================
  useEffect(() => {
    const loadPadron = async () => {
      const { data } = await supabase.from("padron").select("*");
      setPadron(data || []);
    };
    loadPadron();
  }, []);

  // ======================= SESIÓN PERSISTENTE =======================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setCurrentUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (currentUser) recargarEstructura();
  }, [currentUser]);

  // ======================= CARGAR ESTRUCTURA =======================
  const recargarEstructura = async () => {
    const { data: padronData } = await supabase.from("padron").select("*");
    const { data: coords } = await supabase.from("coordinadores").select("*");
    const { data: subs } = await supabase.from("subcoordinadores").select("*");
    const { data: votos } = await supabase.from("votantes").select("*");

    const mapPersona = (p) =>
      padronData.find((x) => normalizeCI(x.ci) === normalizeCI(p.ci));

    setEstructura({
      coordinadores: (coords || []).map((c) => ({ ...c, ...mapPersona(c) })),
      subcoordinadores: (subs || []).map((s) => ({ ...s, ...mapPersona(s) })),
      votantes: (votos || []).map((v) => ({ ...v, ...mapPersona(v) })),
    });
  };

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    if (!loginID) return alert("Ingrese código");

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
    setExpandedCoords({});
  };

  // ======================= BUSCADOR =======================
  const buscarPorCI = (value) => {
    if (!value) return setSearchResult(null);

    const ci = value.replace(/\D/g, "");
    const persona = padron.find((p) => String(p.ci).includes(ci));

    if (!persona)
      return setSearchResult({ tipo: "noExiste", data: { ci } });

    const realCI = normalizeCI(persona.ci);

    const coord = estructura.coordinadores.find(
      (c) => normalizeCI(c.ci) === realCI
    );
    if (coord) return setSearchResult({ tipo: "coordinador", data: coord });

    const sub = estructura.subcoordinadores.find(
      (s) => normalizeCI(s.ci) === realCI
    );
    if (sub) return setSearchResult({ tipo: "subcoordinador", data: sub });

    const vot = estructura.votantes.find(
      (v) => normalizeCI(v.ci) === realCI
    );
    if (vot) return setSearchResult({ tipo: "votante", data: vot });

    setSearchResult({ tipo: "padron", data: persona });
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
    <Dashboard
      currentUser={currentUser}
      estructura={estructura}
      padron={padron}
      stats={stats}
      expandedCoords={expandedCoords}
      setExpandedCoords={setExpandedCoords}
      showAddModal={showAddModal}
      setShowAddModal={setShowAddModal}
      modalType={modalType}
      setModalType={setModalType}
      searchCI={searchCI}
      setSearchCI={setSearchCI}
      searchResult={searchResult}
      buscarPorCI={buscarPorCI}
      handleLogout={handleLogout}
      generarPDF={(tipo) =>
        generarPDF({ tipo, estructura, padron, currentUser })
      }
      normalizeCI={normalizeCI}
    />
  );
};

export default App;
