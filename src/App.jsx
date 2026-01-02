// ======================= APP SISTEMA ELECTORAL =======================
// Opción A: App maneja SOLO sesión/login.
// Dashboard maneja TODO lo demás (estado + UI del sistema).

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { generarCodigoAcceso } from "./utils/accessCode";
import { Users } from "lucide-react";
import Dashboard from "./components/Dashboard";
import { normalizeCI } from "./utils/estructuraHelpers";

const App = () => {
  // ======================= SESIÓN =======================
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ======================= SESIÓN PERSISTENTE =======================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (!saved) return;

    try {
      const u = JSON.parse(saved);
      if (u && u.ci && u.role) setCurrentUser(u);
    } catch (e) {
      console.error("Error leyendo sesión local:", e);
    }
  }, []);

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    const code = loginID.trim().toUpperCase();
    if (!code) return alert("Ingrese código.");


    // SUPERADMIN
    if (loginID === "4630621") {
      if (loginPass !== "12345") return alert("Contraseña incorrecta.");

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

    // COORDINADOR
    const { data: coord, error: coordErr } = await supabase
      .from("coordinadores")
      .select("ci,login_code,telefono,padron(*)")
      .eq("login_code", code)
      .maybeSingle();

    if (coordErr) console.error("Error login coord:", coordErr);

    if (coord?.padron) {
      const u = {
        ci: normalizeCI(coord.ci),
        nombre: coord.padron.nombre,
        apellido: coord.padron.apellido,
        telefono: coord.telefono || "",
        role: "coordinador",
      };
      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    // SUBCOORDINADOR
    const { data: sub, error: subErr } = await supabase
      .from("subcoordinadores")
      .select("ci,login_code,telefono,coordinador_ci,padron(*)")
      .eq("login_code", code)
      .maybeSingle();

    if (subErr) console.error("Error login sub:", subErr);

    if (sub?.padron) {
      const u = {
        ci: normalizeCI(sub.ci),
        nombre: sub.padron.nombre,
        apellido: sub.padron.apellido,
        telefono: sub.telefono || "",
        role: "subcoordinador",
      };
      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    alert("Usuario no encontrado.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setLoginID("");
    setLoginPass("");
  };

  // ======================= LOGIN VIEW (UI REAL) =======================
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
            placeholder="Ej: 1234567"
          />

          {loginID === "4630621" && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Contraseña Superadmin
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
            <p className="font-semibold mb-2">Instrucciones:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Ingrese el código proporcionado.</li>
              <li>Si es coordinador o sub, cuide su acceso.</li>
              <li>Ante dudas, comuníquese con el administrador.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ======================= DASHBOARD =======================
  return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;
