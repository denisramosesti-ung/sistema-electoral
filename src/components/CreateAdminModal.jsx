import React, { useState } from "react";
import { Shield, X, Eye, EyeOff } from "lucide-react";
import { crearUsuarioAdmin } from "../utils/adminHelpers";

/**
 * Modal para crear nuevos usuarios administradores
 * Solo visible para usuarios con role 'owner'
 */
export default function CreateAdminModal({ isOpen, onClose, currentUser, onSuccess }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "superadmin",
    nombre: "",
    apellido: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      alert("Username y contraseña son requeridos");
      return;
    }

    setIsLoading(true);

    const result = await crearUsuarioAdmin(currentUser, formData);

    setIsLoading(false);

    if (result.success) {
      alert(result.message);
      setFormData({
        username: "",
        password: "",
        role: "superadmin",
        nombre: "",
        apellido: "",
      });
      onSuccess && onSuccess(result.data);
      onClose();
    } else {
      alert(result.message);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Crear Administrador</h2>
              <p className="text-xs text-brand-100">Solo para usuarios Owner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Usuario <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50"
              placeholder="nombre_usuario"
              required
              autoComplete="off"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className="w-full px-4 py-2.5 pr-11 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50"
              required
            >
              <option value="superadmin">Superadmin (acceso completo)</option>
              <option value="owner">Owner (puede crear admins)</option>
            </select>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre (opcional)
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50"
              placeholder="Juan"
              autoComplete="given-name"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Apellido (opcional)
            </label>
            <input
              type="text"
              value={formData.apellido}
              onChange={(e) => handleChange("apellido", e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50"
              placeholder="Pérez"
              autoComplete="family-name"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 px-4 border border-slate-300 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-11 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Administrador"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
