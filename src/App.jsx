// App.jsx – Versión Supabase + padrón remoto (COMPLETA, CON LOGIN PERSISTENTE, BUSCADOR CI Y TELÉFONO)

import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  Search,
  Users,
  UserPlus,
  LogOut,
  BarChart3,
  ChevronDown,
  ChevronRight,
  X,
  Trash2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ======================= APLICACIÓN PRINCIPAL =======================
const App = () => {
  // PADRÓN REMOTO DESDE SUPABASE
  const [padron, setPadron] = useState([]);

  // ESTADO PRINCIPAL
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [estructura, setEstructura] = useState({
    coordinadores: [],
    subcoordinadores: [],
    votantes: [],
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [expandedCoords, setExpandedCoords] = useState({});

  // Buscador global por CI (en el panel)
  const [searchCI, setSearchCI] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Estado para modal de teléfono
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneTarget, setPhoneTarget] = useState(null); // {tipo, ci, nombre, apellido}
  const [phoneValue, setPhoneValue] = useState("+595");

  // ======================= CARGAR SESIÓN DESDE LOCALSTORAGE =======================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.ci && parsed.role) {
          setCurrentUser(parsed);
        }
      } catch (e) {
        console.error("Error parseando currentUser desde localStorage", e);
      }
    }
  }, []);

  // ======================= CARGAR PADRÓN COMPLETO =======================
const cargarPadronCompleto = async () => {
  console.log("Solicitando conteo total del padrón...");

  const { count, error: countError } = await supabase
    .from("padron")
    .select("ci", { count: "exact", head: true });

  if (countError) {
    console.error("Error obteniendo conteo:", countError);
    return;
  }

  console.log("TOTAL PERSONAS EN PADRÓN:", count);

  const { data, error } = await supabase
    .from("padron")
    .select("*")
    .range(0, count - 1); // ← AQUÍ CARGAMOS TODO EL PADRÓN SIN LÍMITES

  if (error) {
    console.error("Error cargando padrón:", error);
    return;
  }

  console.log("PADRÓN CARGADO:", data.length);
  setPadron(data);
};

useEffect(() => {
  cargarPadronCompleto();
}, []);


  // ======================= HELPERS =======================
  const generarCodigo = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const normalizarCoordinador = (row) => ({
    ci: row.ci,
    nombre: row.nombre,
    apellido: row.apellido,
    localidad: row.localidad,
    mesa: row.mesa,
    loginCode: row.login_code,
    asignadoPorNombre: row.asignado_por_nombre,
    telefono: row.telefono || null,
  });

  const normalizarSubcoordinador = (row) => ({
    ci: row.ci,
    nombre: row.nombre,
    apellido: row.apellido,
    localidad: row.localidad,
    mesa: row.mesa,
    coordinadorCI: row.coordinador_ci,
    loginCode: row.login_code,
    asignadoPorNombre: row.asignado_por_nombre,
    telefono: row.telefono || null,
  });

  const normalizarVotante = (row) => ({
    ci: row.ci,
    nombre: row.nombre,
    apellido: row.apellido,
    localidad: row.localidad,
    mesa: row.mesa,
    asignadoPor: row.asignado_por,
    asignadoPorNombre: row.asignado_por_nombre,
    telefono: row.telefono || null,
  });

  // ======================= RECARGAR ESTRUCTURA =======================
  const recargarEstructura = async () => {
    const { data: coords, error: errC } = await supabase
      .from("coordinadores")
      .select("*");
    if (errC) console.error(errC);

    const { data: subs, error: errS } = await supabase
      .from("subcoordinadores")
      .select("*");
    if (errS) console.error(errS);

    const { data: votos, error: errV } = await supabase
      .from("votantes")
      .select("*");
    if (errV) console.error(errV);

    setEstructura({
      coordinadores: (coords || []).map(normalizarCoordinador),
      subcoordinadores: (subs || []).map(normalizarSubcoordinador),
      votantes: (votos || []).map(normalizarVotante),
    });
  };

  useEffect(() => {
    recargarEstructura();
  }, []);

  // ======================= PADRÓN DISPONIBLE =======================
const getPersonasDisponibles = () => {
  return padron.map((p) => {
    const ciStr = p.ci.toString();

    const coordItem = estructura.coordinadores.find((c) => c.ci === ciStr);
    if (coordItem) {
      return {
        ...p,
        asignado: true,
        asignadoRol: "Coordinador",
        asignadoPorNombre: coordItem.asignado_por_nombre || "Superadmin",
      };
    }

    const subItem = estructura.subcoordinadores.find((s) => s.ci === ciStr);
    if (subItem) {
      return {
        ...p,
        asignado: true,
        asignadoRol: "Subcoordinador",
        asignadoPorNombre:
          subItem.asignado_por_nombre || "Asignado por coordinador",
      };
    }

    const votItem = estructura.votantes.find((v) => v.ci === ciStr);
    if (votItem) {
      return {
        ...p,
        asignado: true,
        asignadoRol: "Votante",
        asignadoPorNombre:
          votItem.asignado_por_nombre || "Asignado",
      };
    }

    return {
      ...p,
      asignado: false,
      asignadoRol: null,
      asignadoPorNombre: null,
    };
  });
};


  // ======================= BUSCADOR GLOBAL POR CI =======================
const buscarPorCI = (input) => {
  if (!input?.trim()) {
    setSearchResult(null);
    return;
  }

  const clean = input.replace(/\D/g, "");

  // Búsqueda textual dentro del padrón
  const personaPadron = padron.find((p) => {
    const ciRaw = (p.ci || "").toString();
    const ciClean = ciRaw.replace(/\D/g, "");
    return ciRaw.includes(input) || ciClean.includes(clean);
  });

  if (personaPadron) {
    const ci = personaPadron.ci;

    const coord = estructura.coordinadores.find((c) => c.ci == ci);
    if (coord)
      return setSearchResult({ tipo: "coordinador", data: coord });

    const sub = estructura.subcoordinadores.find((s) => s.ci == ci);
    if (sub)
      return setSearchResult({ tipo: "subcoordinador", data: sub });

    const vot = estructura.votantes.find((v) => v.ci == ci);
    if (vot) {
      const asignadoPor =
        estructura.subcoordinadores.find((s) => s.ci == vot.asignadoPor) ||
        estructura.coordinadores.find((c) => c.ci == vot.asignadoPor) ||
        null;

      return setSearchResult({
        tipo: "votante",
        data: vot,
        asignadoPor,
      });
    }

    return setSearchResult({ tipo: "padron", data: personaPadron });
  }

  setSearchResult({ tipo: "noExiste", data: { ci: input } });
};

  // ======================= MODAL TELÉFONO =======================
  const abrirTelefono = (tipo, persona) => {
    setPhoneTarget({
      tipo,
      ci: persona.ci,
      nombre: persona.nombre,
      apellido: persona.apellido,
    });
    setPhoneValue(persona.telefono || "+595");
    setPhoneModalOpen(true);
  };

  const guardarTelefono = async () => {
    if (!phoneTarget) return;
    const telefono = phoneValue.trim();

    if (!telefono) {
      alert("Ingrese un número de teléfono.");
      return;
    }

    if (!telefono.startsWith("+595")) {
      const ok = window.confirm(
        "El número no inicia con +595. ¿Desea guardar de todas formas?"
      );
      if (!ok) return;
    }

    let tabla = "votantes";
    if (phoneTarget.tipo === "coordinador") tabla = "coordinadores";
    else if (phoneTarget.tipo === "subcoordinador") tabla = "subcoordinadores";

    const { error } = await supabase
      .from(tabla)
      .update({ telefono })
      .eq("ci", phoneTarget.ci);

    if (error) {
      alert("Error al guardar teléfono.");
      console.error(error);
      return;
    }

    alert("Teléfono actualizado correctamente.");
    setPhoneModalOpen(false);
    setPhoneTarget(null);
    setPhoneValue("+595");
    await recargarEstructura();
  };

  // ======================= AGREGAR PERSONA =======================
const handleAgregarPersona = async (persona) => {
  if (!modalType) {
    alert("Seleccione un tipo de asignación.");
    return;
  }

  const ciStr = persona.ci.toString();

  const yaEsCoord = estructura.coordinadores.some((c) => c.ci === ciStr);
  const yaEsSub = estructura.subcoordinadores.some((s) => s.ci === ciStr);
  const yaEsVot = estructura.votantes.some((v) => v.ci === ciStr);

  if (yaEsCoord || yaEsSub || yaEsVot) {
    alert("Esta persona ya fue asignada.");
    return;
  }

  let tabla = "";
  let data = {};

  if (modalType === "coordinador") {
    tabla = "coordinadores";
    data = {
      ci: ciStr,
      nombre: persona.nombre,
      apellido: persona.apellido,
      localidad: persona.localidad || null,
      mesa: persona.mesa ? persona.mesa.toString() : null,
      login_code: ciStr,
      asignado_por_nombre: "Superadmin",
      telefono: null,
    };
  }

  if (modalType === "subcoordinador") {
    tabla = "subcoordinadores";
    data = {
      ci: ciStr,
      nombre: persona.nombre,
      apellido: persona.apellido,
      localidad: persona.localidad || null,
      mesa: persona.mesa ? persona.mesa.toString() : null,
      coordinador_ci: currentUser.ci.toString(),
      login_code: ciStr,
      asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
      telefono: null,
    };
  }

  if (modalType === "votante") {
    tabla = "votantes";
    data = {
      ci: ciStr,
      nombre: persona.nombre,
      apellido: persona.apellido,
      localidad: persona.localidad || null,
      mesa: persona.mesa ? persona.mesa.toString() : null,
      asignado_por: currentUser.ci.toString(),
      asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
      telefono: null,
    };
  }

  const { error } = await supabase.from(tabla).insert([data]);

  if (error) {
    console.error(error);
    alert("Error guardando en Supabase");
    return;
  }

  alert("Agregado correctamente.");
  setShowAddModal(false);
  await recargarEstructura();
};

  // ======================= QUITAR PERSONA (Supabase) =======================
  const quitarPersona = async (ci, tipo) => {
    const mensajes = {
      coordinador:
        "¿Quitar jerarquía de coordinador? También se quitarán sus subcoordinadores y sus votantes.",
      subcoordinador:
        "¿Quitar jerarquía de sub-coordinador? También se quitarán sus votantes.",
      votante: "¿Quitar votante de la lista? Volverá al padrón disponible.",
    };

    if (!window.confirm(mensajes[tipo])) return;

    if (tipo === "coordinador") {
      const { data: subs } = await supabase
        .from("subcoordinadores")
        .select("ci")
        .eq("coordinador_ci", ci);

      const subCIs = (subs || []).map((s) => s.ci);

      if (subCIs.length > 0) {
        await supabase.from("votantes").delete().in("asignado_por", subCIs);
      }

      await supabase.from("votantes").delete().eq("asignado_por", ci);
      await supabase.from("subcoordinadores").delete().eq("coordinador_ci", ci);
      await supabase.from("coordinadores").delete().eq("ci", ci);
    } else if (tipo === "subcoordinador") {
      await supabase.from("votantes").delete().eq("asignado_por", ci);
      await supabase.from("subcoordinadores").delete().eq("ci", ci);
    } else if (tipo === "votante") {
      // Solo eliminar la asignación hecha por el usuario logueado
      await supabase
        .from("votantes")
        .delete()
        .match({
          ci: ci,
          asignado_por: currentUser.ci,
        });
    }

    await recargarEstructura();
    alert("Persona removida correctamente.");
  };

  // ======================= MIS SUBS / VOTANTES =======================
  const getMisSubcoordinadores = () => {
    if (!currentUser || currentUser.role !== "coordinador") return [];
    return estructura.subcoordinadores.filter(
      (s) => s.coordinadorCI === currentUser.ci
    );
  };

  const getMisVotantes = () => {
    if (!currentUser) return [];
    return estructura.votantes.filter((v) => v.asignadoPor === currentUser.ci);
  };

  const getVotantesDeSubcoord = (subcoordCI) =>
    estructura.votantes.filter((v) => v.asignadoPor === subcoordCI);

  // ======================= ESTADÍSTICAS =======================
  const getEstadisticas = () => {
    if (currentUser?.role === "superadmin") {
      return {
        coordinadores: estructura.coordinadores.length,
        subcoordinadores: estructura.subcoordinadores.length,
        votantes: estructura.votantes.length,
      };
    }

    if (currentUser?.role === "coordinador") {
      const misSubcoords = getMisSubcoordinadores();
      const directos = getMisVotantes();
      let indirectos = 0;

      misSubcoords.forEach((s) => {
        indirectos += getVotantesDeSubcoord(s.ci).length;
      });

      return {
        subcoordinadores: misSubcoords.length,
        votantesDirectos: directos.length,
        votantesIndirectos: indirectos,
        total: directos.length + indirectos,
      };
    }

    if (currentUser?.role === "subcoordinador") {
      const directos = getMisVotantes();
      return {
        votantes: directos.length,
      };
    }

    return {};
  };

  // ======================= REPORTE PDF =======================
  const generarPDF = () => {
    if (!currentUser) return;
    const doc = new jsPDF({ orientation: "portrait" });

    doc.setFontSize(16);
    doc.text("Reporte de Estructura Electoral", 14, 20);

    doc.setFontSize(12);
    doc.text(
      `Generado por: ${currentUser.nombre} ${currentUser.apellido} (${currentUser.role})`,
      14,
      30
    );
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 38);

    let y = 50;

    if (currentUser.role === "superadmin") {
      doc.setFontSize(14);
      doc.text("Listado de Coordinadores", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["CI", "Nombre", "Apellido", "Código", "Telefono"]],
        body: estructura.coordinadores.map((c) => [
          c.ci,
          c.nombre,
          c.apellido,
          c.loginCode || "-",
          c.telefono || "-",
        ]),
        theme: "striped",
        headStyles: { fillColor: [220, 0, 0] },
      });

      y = doc.lastAutoTable.finalY + 15;
    }

    if (currentUser.role === "coordinador") {
      const subcoords = getMisSubcoordinadores();

      subcoords.forEach((sub) => {
        doc.setFontSize(14);
        doc.text(`Subcoordinador: ${sub.nombre} ${sub.apellido}`, 14, y);
        y += 5;

        const votantesSub = getVotantesDeSubcoord(sub.ci);
        doc.setFontSize(12);
        doc.text("Votantes asignados:", 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa", "Telefono"]],
          body: votantesSub.map((v) => [
            v.ci,
            v.nombre,
            v.apellido,
            v.localidad,
            v.mesa,
            v.telefono || "_",
          ]),
          theme: "grid",
          headStyles: { fillColor: [255, 80, 80] },
        });

        y = doc.lastAutoTable.finalY + 12;
      });

      const directos = getMisVotantes();
      if (directos.length > 0) {
        doc.setFontSize(14);
        doc.text("Votantes directos del Coordinador:", 14, y);
        y += 6;

        autoTable(doc, {
          startY: y,
          head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa", "Telefono"]],
          body: directos.map((v) => [
            v.ci,
            v.nombre,
            v.apellido,
            v.localidad,
            v.mesa,
            v.telefono || "_",
          ]),
          theme: "grid",
          headStyles: { fillColor: [255, 80, 80] },
        });

        y = doc.lastAutoTable.finalY + 10;
      }
    }

    if (currentUser.role === "subcoordinador") {
      doc.setFontSize(14);
      doc.text("Mis votantes asignados:", 14, y);

      autoTable(doc, {
        startY: y + 4,
        head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa", "Telefono"]],
        body: getMisVotantes().map((v) => [
          v.ci,
          v.nombre,
          v.apellido,
          v.localidad,
          v.mesa,
          v.telefono || "_",
        ]),
        theme: "grid",
        headStyles: { fillColor: [255, 80, 80] },
      });
    }

    doc.save("reporte_estructura.pdf");
  };

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    if (!loginID.trim()) {
      alert("Ingrese su Código de acceso.");
      return;
    }

    // SUPERADMIN
    if (loginID === "4630621") {
      if (loginPass !== "12345") {
        alert("Contraseña incorrecta para el Super Administrador.");
        return;
      }

      const superUser = {
        ci: "4630621",
        nombre: "Denis",
        apellido: "Ramos",
        role: "superadmin",
      };

      setCurrentUser(superUser);
      localStorage.setItem("currentUser", JSON.stringify(superUser));
      setLoginPass("");
      return;
    }

    // COORDINADOR
    const coordRes = await supabase
      .from("coordinadores")
      .select("*")
      .eq("login_code", loginID.trim());

    if (coordRes.data && coordRes.data.length > 0) {
      const c = normalizarCoordinador(coordRes.data[0]);
      const user = { ...c, role: "coordinador" };
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      return;
    }

    // SUBCOORDINADOR
    const subRes = await supabase
      .from("subcoordinadores")
      .select("*")
      .eq("login_code", loginID.trim());

    if (subRes.data && subRes.data.length > 0) {
      const s = normalizarSubcoordinador(subRes.data[0]);
      const user = { ...s, role: "subcoordinador" };
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      return;
    }

    alert("Usuario no encontrado. Verifique el código.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginID("");
    setLoginPass("");
    setExpandedCoords({});
    setSearchCI("");
    setSearchResult(null);
    localStorage.removeItem("currentUser");
  };

  const toggleExpand = (ci) => {
    setExpandedCoords((prev) => ({
      ...prev,
      [ci]: !prev[ci],
    }));
  };

  // ======================= LOGIN SCREEN =======================
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
            placeholder="Ej: 1234567 o ABC123"
          />

          {loginID === "4630621" && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Contraseña de Superadmin
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
            <p className="font-semibold mb-2">📋 Instrucciones:</p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Ingrese el código proporcionado por el Coordinador.</li>
              <li>
                Ante dudas o consultas, comuniquese con el Admin del Sistema.
              </li>
              <li>
                En caso de ser Subcoordinador cuide su clave de ingreso.
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ======================= DASHBOARD =======================
  const stats = getEstadisticas();

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
                : "Sub-coordinador"}
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

      {/* TARJETAS DE ESTADÍSTICAS */}
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
              <p className="text-gray-600 text-sm">Votantes Directos</p>
              <p className="text-4xl font-bold text-red-600">
                {stats.votantesDirectos}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm">Total en Red</p>
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
            className="flex items-center gap-2 bg-red-600 text_WHITE px-4 py-2 rounded-lg hover:bg-red-700 text-white"
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
          onClick={generarPDF}
          className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
        >
          <BarChart3 className="w-4 h-4" />
          Descargar Reporte PDF
        </button>
      </div>

      {/* BUSCADOR GLOBAL POR CI */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg_white p-4 rounded-lg shadow mb-4 bg-white">
          <label className="font-semibold">Buscar por CI</label>
          <input
  type="text"
  value={searchCI}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, ""); // Eliminar todo lo que no sea número
    setSearchCI(value);
    buscarPorCI(value);
  }}
  placeholder="Ingrese CI (solo números)"
  className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={10}
/>


          {/* RESULTADOS DE BÚSQUEDA */}
          {searchResult && (
            <div className="mt-4 p-4 border rounded bg-gray-50 text-sm">
              {/* === COORDINADOR === */}
              {searchResult.tipo === "coordinador" && (
                <>
                  <p className="font-bold text-red-700 mb-1">
                    Coordinador encontrado
                  </p>

                  <p>
                    <b>Nombre:</b> {searchResult.data.nombre}{" "}
                    {searchResult.data.apellido}
                  </p>
                  <p>
                    <b>CI:</b> {searchResult.data.ci}
                  </p>
                  <p>
                    <b>Localidad:</b>{" "}
                    {searchResult.data.localidad || "Sin datos"}
                  </p>
                  <p>
                    <b>Mesa:</b> {searchResult.data.mesa || "-"}
                  </p>
                  <p>
                    <b>Teléfono:</b> {searchResult.data.telefono || "-"}
                  </p>
                </>
              )}

              {/* === SUBCOORDINADOR === */}
              {searchResult.tipo === "subcoordinador" && (
                <>
                  <p className="font-bold text-red-700 mb-1">
                    Subcoordinador encontrado
                  </p>

                  <p>
                    <b>Nombre:</b> {searchResult.data.nombre}{" "}
                    {searchResult.data.apellido}
                  </p>
                  <p>
                    <b>CI:</b> {searchResult.data.ci}
                  </p>
                  <p>
                    <b>Localidad:</b>{" "}
                    {searchResult.data.localidad || "Sin datos"}
                  </p>
                  <p>
                    <b>Mesa:</b> {searchResult.data.mesa || "-"}
                  </p>
                  <p>
                    <b>Teléfono:</b> {searchResult.data.telefono || "-"}
                  </p>

                  <p className="mt-2">
                    <b>Asignado por:</b>{" "}
                    {searchResult.data.asignadoPorNombre || "Superadmin"}
                  </p>
                </>
              )}

              {/* === VOTANTE === */}
              {searchResult.tipo === "votante" && (
                <>
                  <p className="font-bold text-red-700 mb-1">
                    Votante encontrado
                  </p>

                  <p>
                    <b>Nombre:</b> {searchResult.data.nombre}{" "}
                    {searchResult.data.apellido}
                  </p>
                  <p>
                    <b>CI:</b> {searchResult.data.ci}
                  </p>
                  <p>
                    <b>Localidad:</b>{" "}
                    {searchResult.data.localidad || "Sin datos"}
                  </p>
                  <p>
                    <b>Mesa:</b> {searchResult.data.mesa || "-"}
                  </p>
                  <p>
                    <b>Teléfono:</b> {searchResult.data.telefono || "-"}
                  </p>

                  <p className="mt-2">
                    <b>Asignado por:</b>{" "}
                    {searchResult.asignadoPor ? (
                      <>
                        {searchResult.asignadoPor.nombre}{" "}
                        {searchResult.asignadoPor.apellido} —{" "}
                        <b>
                          {estructura.coordinadores.some(
                            (c) => c.ci === searchResult.asignadoPor.ci
                          )
                            ? "Coordinador"
                            : estructura.subcoordinadores.some(
                                (s) => s.ci === searchResult.asignadoPor.ci
                              )
                            ? "Subcoordinador"
                            : "Rol desconocido"}
                        </b>
                      </>
                    ) : (
                      "No encontrado"
                    )}
                  </p>
                </>
              )}

              {/* === EN PADRÓN PERO NO ASIGNADO === */}
              {searchResult.tipo === "padron" && (
                <div className="text-gray-700">
                  <p className="font-bold text-red-700 mb-1">
                    Persona encontrada en padrón (no asignada)
                  </p>
                  <p>
                    <b>Nombre:</b> {searchResult.data.nombre}{" "}
                    {searchResult.data.apellido}
                  </p>
                  <p>
                    <b>CI:</b> {searchResult.data.ci}
                  </p>
                  <p>
                    <b>Localidad:</b>{" "}
                    {searchResult.data.localidad ||
                      searchResult.data.local ||
                      "Sin datos"}
                  </p>
                  <p>
                    <b>Mesa:</b> {searchResult.data.mesa || "-"}
                  </p>
                  <p className="mt-2">
                    Esta persona está en el padrón y disponible para ser
                    asignada como coordinador, subcoordinador o votante.
                  </p>
                </div>
              )}

              {/* === NO EXISTE NI EN PADRÓN === */}
              {searchResult.tipo === "noExiste" && (
                <p className="text-gray-600">
                  Este CI <b>{searchResult.data.ci}</b> no pertenece al padrón.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* LISTAS */}
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Mi Estructura</h2>
          </div>

          <div className="p-6">
            {/* SUPERADMIN */}
            {currentUser.role === "superadmin" && (
              <>
                {estructura.coordinadores.map((coord) => (
                  <div
                    key={coord.ci}
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleExpand(coord.ci)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {expandedCoords[coord.ci] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}

                        <div>
                          <p className="font-semibold text-gray-800">
                            {coord.nombre} {coord.apellido}
                          </p>
                          <p className="text-sm text-gray-600">
                            CI: {coord.ci} — Coordinador
                          </p>
                          {coord.telefono && (
                            <p className="text-xs text-gray-500">
                              Tel: {coord.telefono}
                            </p>
                          )}
                          {coord.loginCode && (
                            <p className="text-xs text-gray-500">
                              Código de acceso: {coord.loginCode}
                            </p>
                          )}
                          {coord.localidad && coord.mesa && (
                            <p className="text-xs text-gray-500">
                              {coord.localidad} — Mesa {coord.mesa}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("coordinador", coord);
                          }}
                          className="px-3 py-2 border-2 border-green-600 text-green-700 rounded-lg text-xs md:text-sm hover:bg-green-50"
                        >
                          Teléfono
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPersona(coord.ci, "coordinador");
                          }}
                          className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-xs md:text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Borrar
                        </button>
                      </div>
                    </div>

                    {expandedCoords[coord.ci] && (
                      <div className="bg-white px-4 pb-4">
                        {estructura.subcoordinadores
                          .filter((s) => s.coordinadorCI === coord.ci)
                          .map((sub) => (
                            <div
                              key={sub.ci}
                              className="border rounded p-3 mb-2 bg-red-50/40"
                            >
                              <p className="font-semibold text-gray-800">
                                {sub.nombre} {sub.apellido}
                              </p>
                              <p className="text-sm text-gray-600">
                                CI: {sub.ci} — Sub-coordinador
                              </p>
                              {sub.telefono && (
                                <p className="text-xs text-gray-500">
                                  Tel: {sub.telefono}
                                </p>
                              )}
                              {sub.loginCode && (
                                <p className="text-xs text-gray-500">
                                  Código de acceso: {sub.loginCode}
                                </p>
                              )}
                              {sub.localidad && sub.mesa && (
                                <p className="text-xs text-gray-500">
                                  {sub.localidad} — Mesa {sub.mesa}
                                </p>
                              )}

                              <p className="text-sm font-semibold mt-2">
                                Votantes
                              </p>
                              {estructura.votantes
                                .filter((v) => v.asignadoPor === sub.ci)
                                .map((v) => (
                                  <div
                                    key={v.ci}
                                    className="bg-white border p-2 mt-2 rounded text-sm"
                                  >
                                    {v.nombre} {v.apellido} — CI: {v.ci}
                                    {v.localidad ? ` — ${v.localidad}` : ""}
                                    {v.mesa ? ` — Mesa ${v.mesa}` : ""}
                                    {v.telefono ? ` — Tel: ${v.telefono}` : ""}
                                  </div>
                                ))}
                            </div>
                          ))}

                        {estructura.votantes
                          .filter((v) => v.asignadoPor === coord.ci)
                          .map((v) => (
                            <div
                              key={v.ci}
                              className="bg-white border p-2 mt-2 rounded text-sm"
                            >
                              {v.nombre} {v.apellido} — CI: {v.ci}
                              {v.localidad ? ` — ${v.localidad}` : ""}
                              {v.mesa ? ` — Mesa ${v.mesa}` : ""}
                              {v.telefono ? ` — Tel: ${v.telefono}` : ""}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ))}

                {estructura.coordinadores.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No hay coordinadores aún.
                  </p>
                )}
              </>
            )}

            {/* COORDINADOR */}
            {currentUser.role === "coordinador" && (
              <>
                {getMisSubcoordinadores().map((sub) => (
                  <div
                    key={sub.ci}
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleExpand(sub.ci)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {expandedCoords[sub.ci] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}

                        <div>
                          <p className="font-semibold text-gray-800">
                            {sub.nombre} {sub.apellido}
                          </p>
                          <p className="text-sm text-gray-600">
                            CI: {sub.ci} — Sub-coordinador
                          </p>
                          {sub.telefono && (
                            <p className="text-xs text-gray-500">
                              Tel: {sub.telefono}
                            </p>
                          )}
                          {sub.loginCode && (
                            <p className="text-xs text-gray-500">
                              Código: {sub.loginCode}
                            </p>
                          )}
                          {sub.localidad && sub.mesa && (
                            <p className="text-xs text-gray-500">
                              {sub.localidad} — Mesa {sub.mesa}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("subcoordinador", sub);
                          }}
                          className="px-3 py-2 border-2 border-green-600 text-green-700 rounded-lg text-xs md:text-sm hover:bg-green-50"
                        >
                          Teléfono
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPersona(sub.ci, "subcoordinador");
                          }}
                          className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-xs md:text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Borrar
                        </button>
                      </div>
                    </div>

                    {expandedCoords[sub.ci] && (
                      <div className="bg-white px-4 pb-4">
                        <p className="text-sm font-semibold mt-2">Votantes</p>
                        {getVotantesDeSubcoord(sub.ci).map((v) => (
                          <div
                            key={v.ci}
                            className="bg-white border p-2 mt-2 rounded text-sm flex justify-between items-center"
                          >
                            <span>
                              {v.nombre} {v.apellido} — CI: {v.ci}
                              {v.localidad ? ` — ${v.localidad}` : ""}
                              {v.mesa ? ` — Mesa ${v.mesa}` : ""}
                              {v.telefono ? ` — Tel: ${v.telefono}` : ""}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirTelefono("votante", v)}
                                className="px-3 py-1 border-2 border-green-600 text-green-700 rounded-lg text-xs md:text-sm hover:bg-green-50"
                              >
                                Teléfono
                              </button>
                              <button
                                onClick={() => quitarPersona(v.ci, "votante")}
                                className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-xs md:text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                Borrar
                              </button>
                            </div>
                          </div>
                        ))}

                        {getVotantesDeSubcoord(sub.ci).length === 0 && (
                          <p className="text-gray-500 text-sm mt-2">
                            Sin votantes asignados.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {getMisVotantes().length > 0 && (
                  <div className="border rounded-lg mb-3 p-4">
                    <p className="font-semibold text-gray-700 mb-3">
                      Mis votantes directos
                    </p>

                    {getMisVotantes().map((v) => (
                      <div
                        key={v.ci}
                        className="bg-white border p-2 mt-2 rounded text-sm flex justify-between items-center"
                      >
                        <span>
                          {v.nombre} {v.apellido} — CI: {v.ci}
                          {v.localidad ? ` — ${v.localidad}` : ""}
                          {v.mesa ? ` — Mesa ${v.mesa}` : ""}
                          {v.telefono ? ` — Tel: ${v.telefono}` : ""}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirTelefono("votante", v)}
                            className="px-3 py-1 border-2 border-green-600 text-green-700 rounded-lg text-xs md:text-sm hover:bg-green-50"
                          >
                            Teléfono
                          </button>
                          <button
                            onClick={() => quitarPersona(v.ci, "votante")}
                            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-xs md:text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Borrar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* SUBCOORDINADOR */}
            {currentUser.role === "subcoordinador" && (
              <>
                {getMisVotantes().map((v) => (
                  <div
                    key={v.ci}
                    className="bg-white border p-2 mt-2 rounded text-sm flex justify-between items-center"
                  >
                    <span>
                      {v.nombre} {v.apellido} — CI: {v.ci}
                      {v.localidad ? ` — ${v.localidad}` : ""}
                      {v.mesa ? ` — Mesa ${v.mesa}` : ""}
                      {v.telefono ? ` — Tel: ${v.telefono}` : ""}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirTelefono("votante", v)}
                        className="px-3 py-1 border-2 border-green-600 text-green-700 rounded-lg text-xs md:text-sm hover:bg-green-50"
                      >
                        Teléfono
                      </button>
                      <button
                        onClick={() => quitarPersona(v.ci, "votante")}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-xs md:text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Borrar
                      </button>
                    </div>
                  </div>
                ))}

                {getMisVotantes().length === 0 && (
                  <p className="text-gray-500 py-6">
                    No tiene votantes asignados.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL TELÉFONO */}
      {phoneModalOpen && phoneTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl p-6">
            <h3 className="text-lg font-bold mb-2">Editar teléfono</h3>
            <p className="text-sm text-gray-600 mb-4">
              {phoneTarget.nombre} {phoneTarget.apellido} — CI:{" "}
              {phoneTarget.ci}
            </p>
            <label className="text-sm font-medium text-gray-700">
              Número (formato +595…)
            </label>
            <input
              type="tel"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="+595..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setPhoneModalOpen(false);
                  setPhoneTarget(null);
                  setPhoneValue("+595");
                }}
                className="px-4 py-2 rounded-lg border"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTelefono}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR PERSONA */}
      <AddPersonModal
  show={showAddModal}
  onClose={() => setShowAddModal(false)}
  tipo={modalType}
  onAdd={handleAgregarPersona}
  disponibles={getPersonasDisponibles(padron)}
/>

    </div>
  );
};

export default App;