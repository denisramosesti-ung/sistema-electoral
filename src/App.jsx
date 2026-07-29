// ======================= APP SISTEMA ELECTORAL =======================
// App maneja SOLO sesión/login.
// Dashboard maneja TODO lo demás.

import React, { useEffect, useRef, useState } from "react";
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

  // ======================= DETECCIÓN PROGRESIVA DE ADMIN =======================
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const debounceRef = useRef(null);
  const usernameRef = useRef("");

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ======================= SESIÓN PERSISTENTE =======================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (!saved) return;
    try {
      const u = JSON.parse(saved);
      if (u && (u.ci || u.username) && u.role) setCurrentUser(u);
    } catch (e) {
      console.error("Error leyendo sesión local:", e);
    }
  }, []);

  // ======================= DETECCIÓN DE ADMIN (username -> owner/superadmin) =======================
  // Escapa "%" y "_" para que ilike haga coincidencia exacta (case-insensitive),
  // sin interpretarlos como comodines de patrón.
  const escapeIlikePattern = (value) => value.replace(/[%_]/g, (ch) => `\\${ch}`);

  const detectarAdminDebounced = async (trimmedUsername) => {
    try {
      const { data, error } = await supabase
        .from("usuarios_admin")
        .select("username,role")
        .ilike("username", escapeIlikePattern(trimmedUsername))
        .maybeSingle();

      // Si el usuario ya modificó el campo mientras se consultaba, descartar el resultado.
      if (usernameRef.current.trim() !== trimmedUsername) return;

      if (error) {
        console.error("[v0] Error detectando usuario admin:", error);
        setShowPasswordField(false);
        return;
      }

      const esAdmin = Boolean(data && ["owner", "superadmin"].includes(data.role));
      setShowPasswordField(esAdmin);
    } catch (e) {
      if (usernameRef.current.trim() !== trimmedUsername) return;
      console.error("[v0] Error detectando usuario admin:", e);
      setShowPasswordField(false);
    } finally {
      if (usernameRef.current.trim() === trimmedUsername) {
        setCheckingUsername(false);
      }
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setLoginUsername(value);
    usernameRef.current = value;

    // Ocultar inmediatamente la contraseña al modificar el primer campo.
    setShowPasswordField(false);
    setLoginPass("");
    setShowPass(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (!trimmed) {
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    debounceRef.current = setTimeout(() => {
      detectarAdminDebounced(trimmed);
    }, 350);
  };

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    const username = loginUsername.trim();
    const password = loginPass.trim();

    if (!username) return alert("Ingrese usuario o código de acceso.");

    setIsLogging(true);

    try {
      // ======================= FLUJO 1: ADMIN (owner/superadmin) =======================
      // No depender del resultado previo del debounce: se vuelve a comprobar
      // directamente contra usuarios_admin al enviar el formulario, para
      // evitar condiciones de carrera si el usuario presiona el botón antes
      // de que termine la detección progresiva.
      const rolesPermitidos = ["owner", "superadmin"];

      const { data: adminCheck, error: adminCheckErr } = await supabase
        .from("usuarios_admin")
        .select("username,role")
        .ilike("username", escapeIlikePattern(username))
        .maybeSingle();

      if (adminCheckErr) {
        console.error("[v0] Error verificando usuario administrativo:", adminCheckErr);
        alert("Error al consultar base de datos.");
        setIsLogging(false);
        return;
      }

      const esAdmin = Boolean(adminCheck && rolesPermitidos.includes(adminCheck.role));

      if (esAdmin) {
        console.log("[v0] Admin login attempt", { username });

        if (!password) {
          alert("Ingrese su contraseña");
          setIsLogging(false);
          return;
        }

        const { data: admin, error: adminErr } = await supabase
          .from("usuarios_admin")
          .select("id,username,role,nombre,apellido")
          .ilike("username", escapeIlikePattern(username))
          .eq("password", password)
          .maybeSingle();

        if (adminErr) {
          console.error("[v0] Admin login failed - Database error:", adminErr);
          alert("Error al consultar base de datos.");
          setIsLogging(false);
          return;
        }

        if (!admin || !rolesPermitidos.includes(admin.role)) {
          console.log("[v0] Admin login failed - Invalid credentials");
          alert("Usuario o contraseña incorrectos.");
          setIsLogging(false);
          return;
        }

        console.log("[v0] Admin login success", {
          username: admin.username,
          role: admin.role,
          nombre: admin.nombre
        });

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
      }

      // ======================= FLUJO 2: COORDINADOR/SUBCOORDINADOR (SIN PASSWORD) =======================
      // Si no es un usuario administrativo → intentar coordinador/sub, sin pedir password.

      // Intentar como coordinador
      const { data: coord, error: coordErr } = await supabase
        .from("coordinadores")
        .select("ci,login_code,telefono,padron(*)")
        .eq("login_code", username)
        .maybeSingle();

      if (coordErr) {
        console.error("[v0] Error login coord:", coordErr);
      }

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

      if (subErr) {
        console.error("[v0] Error login sub:", subErr);
      }

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

      // No se encontró el código
      alert("Código de acceso no encontrado.");
      setIsLogging(false);
    } catch (err) {
      console.error("[v0] Error en login:", err);
      alert("Error al iniciar sesión.");
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
            {/* Usuario / Código */}
            <div>
              <label
                htmlFor="loginUsername"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Usuario / Código
              </label>
              <input
                id="loginUsername"
                type="text"
                value={loginUsername}
                onChange={handleUsernameChange}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
                placeholder="Usuario o código de acceso"
                autoComplete="username"
              />
              {checkingUsername && (
                <p className="text-xs text-slate-400 mt-1.5">Verificando usuario…</p>
              )}
            </div>

            {/* Contraseña - solo visible si el usuario/código detectado es owner o superadmin */}
            {showPasswordField && (
            <div>
              <label
                htmlFor="loginPass"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Contraseña <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  id="loginPass"
                  type={showPass ? "text" : "password"}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-2.5 pr-11 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50 placeholder-slate-400"
                  placeholder="Solo para administradores"
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
              <ul className="space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-slate-700">Administradores</strong> deben ingresar usuario y contraseña.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-slate-700">Coordinadores y subcoordinadores</strong> deben ingresar solo su código de acceso.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
