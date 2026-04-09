// ======================= APP SISTEMA ELECTORAL =======================
// App maneja SOLO sesión/login.
// Dashboard maneja TODO lo demás.

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import Dashboard from "./components/Dashboard";
import { normalizeCI } from "./utils/estructuraHelpers";

const App = () => {
  // ======================= SESIÓN =======================
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

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
    const username = loginUsername.trim();
    const password = loginPass.trim();

    if (!username) return alert("Ingrese usuario o código de acceso.");

    setIsLogging(true);

    try {
      // ======================= ADMIN LOGIN (CON PASSWORD) =======================
      // Si hay password, intentar login como admin
      if (password) {
        const { data: admin, error: adminErr } = await supabase
          .from("usuarios_admin")
          .select("id,username,role,nombre,apellido")
          .eq("username", username)
          .eq("password", password)
          .maybeSingle();

        if (adminErr) {
          console.error("[v0] Error login admin:", adminErr);
        }

        if (admin) {
          // Validación de roles permitidos
          const rolesPermitidos = ['owner', 'superadmin'];
          if (!rolesPermitidos.includes(admin.role)) {
            alert("Rol de usuario no válido.");
            setIsLogging(false);
            return;
          }

          const u = {
            username: admin.username,
            nombre: admin.nombre || "Admin",
            apellido: admin.apellido || "",
            role: admin.role,
          };
          setCurrentUser(u);
          localStorage.setItem("currentUser", JSON.stringify(u));
          setIsLogging(false);
          return;
        } else {
          alert("Usuario o contraseña incorrectos.");
          setIsLogging(false);
          return;
        }
      }

      // ======================= COORDINADOR/SUBCOORDINADOR LOGIN (SIN PASSWORD) =======================
      // Si no hay password, usar el username como código de acceso
      
      // Intentar como coordinador
      const { data: coord, error: coordErr } = await supabase
        .from("coordinadores")
        .select("ci,login_code,telefono,padron(*)")
        .eq("login_code", username)
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
        setIsLogging(false);
        return;
      }

      // Intentar como subcoordinador
      const { data: sub, error: subErr } = await supabase
        .from("subcoordinadores")
        .select("ci,login_code,telefono,coordinador_ci,padron(*)")
        .eq("login_code", username)
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
        setIsLogging(false);
        return;
      }

      alert("Código de acceso no encontrado.");
    } catch (err) {
      console.error("[v0] Error en login:", err);
      alert("Error al iniciar sesión.");
    } finally {
      setIsLogging(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setLoginUsername("");
    setLoginPass("");
  };

  // ======================= DASHBOARD =======================
  if (currentUser) {
    return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  // ======================= LOGIN VIEW =======================
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      {/* Background decoration */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-100 opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-50 opacity-60" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card-md overflow-hidden">
          {/* Header band */}
          <div className="bg-brand-700 px-8 py-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-full mb-3">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Sistema Electoral
            </h1>
            <p className="text-brand-200 text-sm mt-1">
              Gestión de Votantes — Internas 2026
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-7 space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="loginUsername"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Usuario
              </label>
              <input
                id="loginUsername"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
                placeholder="Usuario o código de acceso"
                autoComplete="username"
              />
            </div>

            {/* Password - conditional */}
            {loginUsername && (
              <div className="animate-fade-in">
                <label
                  htmlFor="loginPass"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="loginPass"
                    type={showPass ? "text" : "password"}
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-2.5 pr-11 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
                    placeholder="Ingrese contraseña"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0 border-0 bg-transparent shadow-none"
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={isLogging}
              className="w-full h-11 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isLogging ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </div>

          {/* Footer note */}
          <div className="px-8 pb-7">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700 mb-2">Instrucciones</p>
              <ol className="list-decimal ml-4 space-y-1 leading-relaxed">
                <li>Ingrese su usuario o código de acceso en el primer campo.</li>
                <li>Si tiene contraseña (administradores), ingrese su contraseña cuando aparezca el campo.</li>
                <li>Si solo tiene código de acceso (coordinadores/subcoordinadores), presione "Iniciar Sesión" directamente.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
