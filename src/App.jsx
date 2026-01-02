// ======================= APP SISTEMA ELECTORAL =======================
// Orquestador principal
// - Mantiene la UI original de LOGIN (pantalla roja con instrucciones)
// - Renderiza Dashboard luego del login
// - No rompe Supabase ni servicios

import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "./supabaseClient";

// DASHBOARD (UI completa post-login)
import Dashboard from "./components/Dashboard";

// ======================= COMPONENTE =======================
const App = () => {
  // ======================= SESIÓN =======================
  const [currentUser, setCurrentUser] = useState(null);

  // ======================= LOGIN =======================
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ======================= SESIÓN PERSISTENTE =======================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.ci && parsed?.role) {
        setCurrentUser(parsed);
      }
    } catch {
      localStorage.removeItem("currentUser");
    }
  }, []);

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    if (!loginID.trim()) {
      alert("Ingrese el código de acceso");
      return;
    }

    // ===== SUPERADMIN =====
    if (loginID === "4630621") {
      if (loginPass !== "12345") {
        alert("Contraseña incorrecta");
        return;
      }

      const user = {
        ci: 4630621,
        nombre: "Denis",
        apellido: "Ramos",
        role: "superadmin",
      };

      localStorage.setItem("currentUser", JSON.stringify(user));
      setCurrentUser(user);
      return;
    }

    // ===== COORDINADOR =====
    const { data: coord, error: coordErr } = await supabase
      .from("coordinadores")
      .select("ci,login_code,padron(*)")
      .eq("login_code", loginID)
      .maybeSingle();

    if (coordErr) console.error("Login coord error:", coordErr);

    if (coord?.padron) {
      const user = {
        ci: Number(coord.ci),
        nombre: coord.padron.nombre,
        apellido: coord.padron.apellido,
        role: "coordinador",
      };
      localStorage.setItem("currentUser", JSON.stringify(user));
      setCurrentUser(user);
      return;
    }

    // ===== SUBCOORDINADOR =====
    const { data: sub, error: subErr } = await supabase
      .from("subcoordinadores")
      .select("ci,login_code,padron(*)")
      .eq("login_code", loginID)
      .maybeSingle();

    if (subErr) console.error("Login sub error:", subErr);

    if (sub?.padron) {
      const user = {
        ci: Number(sub.ci),
        nombre: sub.padron.nombre,
        apellido: sub.padron.apellido,
        role: "subcoordinador",
      };
      localStorage.setItem("currentUser", JSON.stringify(user));
      setCurrentUser(user);
      return;
    }

    alert("Usuario no encontrado");
  };

  // ======================= LOGOUT =======================
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setLoginID("");
    setLoginPass("");
  };

  // ======================= LOGIN UI (PANTALLA ROJA ORIGINAL) =======================
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
            <>
              <label className="text-sm font-medium text-gray-700">
                Contraseña Superadmin
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
                placeholder="Ingrese contraseña"
              />
            </>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
          >
            Ingresar
          </button>

          <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-700">
            <p className="font-semibold mb-2">📋 Instrucciones</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Ingrese el código de acceso proporcionado.</li>
              <li>No comparta su código con terceros.</li>
              <li>Si tiene problemas, contacte al administrador.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ======================= DASHBOARD =======================
  return (
    <Dashboard
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );
};

export default App;
