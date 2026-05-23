import React, { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import ConsultarDatos from "../components/ConsultarDatos";

// Roles con acceso permitido
const ROLES_PERMITIDOS = ["superadmin", "owner"];

export default function ConsultarDatosPage() {
  const [status, setStatus] = useState("checking"); // "checking" | "allowed" | "denied"
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Leer sesión desde localStorage (mismo mecanismo que App.jsx)
    try {
      const saved = localStorage.getItem("currentUser");
      if (!saved) {
        setStatus("denied");
        return;
      }
      const u = JSON.parse(saved);
      if (u && u.role && (u.ci || u.username) && ROLES_PERMITIDOS.includes(u.role)) {
        setCurrentUser(u);
        setStatus("allowed");
      } else {
        setStatus("denied");
      }
    } catch {
      setStatus("denied");
    }
  }, []);

  // Verificando sesión
  if (status === "checking") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Acceso denegado
  if (status === "denied") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-10 flex flex-col items-center gap-4 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Acceso restringido</h1>
          <p className="text-sm text-slate-500">
            No tienes permisos para acceder a esta sección. Inicia sesión como superadmin.
          </p>
          <button
            onClick={() => window.close()}
            className="mt-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Acceso permitido — renderizar ConsultarDatos sin prop onBack (es página completa)
  return <ConsultarDatos currentUser={currentUser} onBack={() => window.history.back()} />;
}
