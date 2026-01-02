// ======================= DASHBOARD =======================
// UI COMPLETA del sistema electoral
// NO contiene lógica de Supabase
// TODO viene por props desde App.jsx

import React from "react";
import {
  Users,
  UserPlus,
  LogOut,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Copy,
  Phone,
  Trash2,
} from "lucide-react";

import AddPersonModal from "../AddPersonModal";
import BuscadorCI from "../components/BuscadorCI";
import ModalTelefono from "../components/ModalTelefono";

const Dashboard = ({
  currentUser,
  estructura,
  padron,
  stats,

  expandedCoords,
  setExpandedCoords,

  showAddModal,
  setShowAddModal,
  modalType,
  setModalType,

  searchCI,
  setSearchCI,
  searchResult,
  buscarPorCI,

  handleLogout,
  generarPDF,
  normalizeCI,
}) => {
  // ======================= HELPERS UI =======================
  const toggleExpand = (ci) => {
    setExpandedCoords((prev) => ({
      ...prev,
      [normalizeCI(ci)]: !prev[normalizeCI(ci)],
    }));
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert("Código copiado");
  };

  // ======================= COMPONENTE DATOS =======================
  const DatosPersona = ({ persona, rol, loginCode }) => (
    <div className="space-y-1 text-xs md:text-sm">
      <p className="font-semibold">
        {persona.nombre} {persona.apellido}
      </p>
      <p>
        <b>CI:</b> {persona.ci}
      </p>
      {rol && (
        <p>
          <b>Rol:</b> {rol}
        </p>
      )}
      {loginCode && (
        <button
          onClick={() => copyToClipboard(loginCode)}
          className="p-1 border rounded text-red-600 inline-flex items-center gap-1"
        >
          <Copy className="w-4 h-4" /> Copiar acceso
        </button>
      )}
      {persona.seccional && <p>Seccional: {persona.seccional}</p>}
      {persona.local_votacion && <p>Local: {persona.local_votacion}</p>}
      {persona.mesa && <p>Mesa: {persona.mesa}</p>}
      {persona.orden && <p>Orden: {persona.orden}</p>}
      {persona.direccion && <p>Dirección: {persona.direccion}</p>}
      {persona.telefono && <p>Tel: {persona.telefono}</p>}
    </div>
  );

  // ======================= RENDER =======================
  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Sistema Electoral</h1>
            <p className="text-red-200 text-sm mt-1">
              {currentUser.nombre} {currentUser.apellido} —{" "}
              {currentUser.role === "superadmin"
                ? "⭐ Superadmin"
                : currentUser.role === "coordinador"
                ? "Coordinador"
                : "Subcoordinador"}
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

      {/* TARJETAS */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentUser.role === "superadmin" && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Coordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.coordinadores}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Subcoordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.subcoordinadores}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Votantes</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.votantes}
              </p>
            </div>
          </>
        )}

        {currentUser.role === "coordinador" && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Subcoordinadores</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.subcoordinadores}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Votantes directos</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.votantesDirectos}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total en red</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.total}
              </p>
            </div>
          </>
        )}

        {currentUser.role === "subcoordinador" && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Mis votantes</p>
            <p className="text-4xl font-bold text-red-600">
              {stats.votantes}
            </p>
          </div>
        )}
      </div>

      {/* ACCIONES */}
      <div className="max-w-7xl mx-auto px-4 mb-6 flex flex-wrap gap-3">
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
            Agregar Subcoordinador
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
          onClick={() => generarPDF("estructura")}
          className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
        >
          <BarChart3 className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      {/* BUSCADOR */}
      <BuscadorCI
        value={searchCI}
        onChange={(v) => {
          setSearchCI(v);
          buscarPorCI(v);
        }}
        resultado={searchResult}
      />

      {/* MODAL AGREGAR */}
      <AddPersonModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        tipo={modalType}
        disponibles={padron}
      />
    </div>
  );
};

export default Dashboard;
