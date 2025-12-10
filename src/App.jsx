// App.jsx — Sistema electoral completo con Supabase, login persistente,
// buscador CI, loader ANR y teléfonos editables por rol.

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
  Phone,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ====================== LOADER ANR ====================== */
const LoaderANR = ({ text = "Cargando…" }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-700">
      <div
        className="animate-spin rounded-full border-4 border-red-600 border-t-transparent h-16 w-16 mb-4"
        style={{ borderTopColor: "transparent" }}
      ></div>
      <p className="text-lg font-semibold">{text}</p>
    </div>
  );
};

/* ======================= MODAL EDITAR TELÉFONO ======================= */
const EditPhoneModal = ({
  open,
  persona,
  tipo,
  onClose,
  newTelefono,
  setNewTelefono,
  onSave,
}) => {
  if (!open || !persona) return null;

  const tituloTipo =
    tipo === "coordinador"
      ? "Coordinador"
      : tipo === "subcoordinador"
      ? "Subcoordinador"
      : "Votante";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Editar teléfono ({tituloTipo})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-3">
          {persona.nombre} {persona.apellido} — CI: {persona.ci}
        </p>

        <label className="text-sm font-medium text-gray-700">
          Teléfono (formato +595…)
        </label>
        <input
          type="text"
          value={newTelefono}
          onChange={(e) => setNewTelefono(e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          placeholder="+595..."
        />

        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>

          <button
            onClick={onSave}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ====================== MODAL AGREGAR PERSONA ====================== */
const AddPersonModal = ({ show, onClose, tipo, onAdd, disponibles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  if (!show) return null;

  // Filtro mejorado: CI, nombre, apellido, nombre+apellido
  let filtered = [];
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();

    const exactCI = disponibles.filter((p) =>
      (p.ci || "").toString().startsWith(searchTerm)
    );

    const nameMatches = disponibles.filter((p) => {
      const nombre = (p.nombre || "").toLowerCase();
      const apellido = (p.apellido || "").toLowerCase();
      const full1 = `${nombre} ${apellido}`.trim();
      const full2 = `${apellido} ${nombre}`.trim();

      return (
        nombre.includes(term) ||
        apellido.includes(term) ||
        full1.includes(term) ||
        full2.includes(term)
      );
    });

    const combined = [...exactCI, ...nameMatches].filter(
      (p, i, arr) => arr.findIndex((x) => x.ci === p.ci) === i
    );

    filtered = combined.slice(0, 50);
  }

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  const titulo =
    tipo === "coordinador"
      ? "Agregar Coordinador"
      : tipo === "subcoordinador"
      ? "Agregar Subcoordinador"
      : "Agregar Votante";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-red-600 text-white">
          <h3 className="text-xl font-bold">{titulo}</h3>
          <button onClick={onClose} className="hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar por CI, nombre o apellido..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
          {searchTerm.trim().length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              🔎 Escriba para buscar…
            </p>
          ) : paginated.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              ❌ No se encontraron resultados.
            </p>
          ) : (
            paginated.map((persona) => {
              const bloqueado = persona.asignado === true;

              const localTexto =
                persona.localidad ||
                persona.local ||
                persona.local_votacion ||
                "Sin localidad";

              return (
                <div
                  key={persona.ci}
                  onClick={() => {
                    if (!bloqueado) onAdd(persona);
                  }}
                  className={`p-4 border rounded-lg transition relative ${
                    bloqueado
                      ? "bg-gray-200 cursor-not-allowed opacity-60"
                      : "bg-gray-50 hover:bg-red-50 cursor-pointer"
                  }`}
                >
                  <p className="font-semibold text-gray-800">
                    {persona.nombre} {persona.apellido}
                  </p>
                  <p className="text-sm text-gray-600">
                    CI: {persona.ci} • {localTexto} • Mesa:{" "}
                    {persona.mesa || "-"}
                  </p>

                  {bloqueado && (
                    <p className="text-xs text-red-600 mt-2">
                      Ya fue agregado por{" "}
                      <b>
                        {persona.asignadoPorNombre ||
                          persona.asignadoPor ||
                          "otro referente"}
                      </b>{" "}
                      {persona.asignadoRol ? `(${persona.asignadoRol})` : ""}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PAGINACIÓN */}
        {filtered.length > pageSize && (
          <div className="px-6 pb-3 flex justify-between items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ◀ Anterior
            </button>

            <span>
              Página {page} de {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente ▶
            </button>
          </div>
        )}

        {/* BOTÓN CERRAR */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full mt-2 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

/* ====================== APP PRINCIPAL ====================== */
const App = () => {
  // PADRÓN REMOTO
  const [padron, setPadron] = useState([]);

  // SESIÓN
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ESTRUCTURA
  const [estructura, setEstructura] = useState({
    coordinadores: [],
    subcoordinadores: [],
    votantes: [],
  });

  // UI
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [expandedCoords, setExpandedCoords] = useState({});

  // Buscador global CI
  const [searchCI, setSearchCI] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Loader
  const [loading, setLoading] = useState(true);

  // Editar teléfono
  const [editPhoneOpen, setEditPhoneOpen] = useState(false);
  const [editPhoneTipo, setEditPhoneTipo] = useState(null); // "coordinador" | "subcoordinador" | "votante"
  const [editPhonePersona, setEditPhonePersona] = useState(null);
  const [newTelefono, setNewTelefono] = useState("+595");

  /* ===== Persistencia de sesión ===== */
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.ci && parsed.role) {
          setCurrentUser(parsed);
        }
      } catch (e) {
        console.error("Error leyendo sesión:", e);
      }
    }
  }, []);

  /* ===== Cargar padrón ===== */
  useEffect(() => {
    const cargarPadron = async () => {
      const { data, error } = await supabase.from("padron").select("*");
      if (error) {
        console.error("Error cargando padrón:", error);
        setPadron([]);
        return;
      }
      setPadron(data || []);
    };

    cargarPadron();
  }, []);

  /* ===== Normalizadores ===== */
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

  /* ===== Recargar estructura ===== */
  const recargarEstructura = async () => {
    setLoading(true);

    const { data: coords, error: errC } = await supabase
      .from("coordinadores")
      .select("*");
    const { data: subs, error: errS } = await supabase
      .from("subcoordinadores")
      .select("*");
    const { data: votos, error: errV } = await supabase
      .from("votantes")
      .select("*");

    if (errC) console.error("Error coordinadores:", errC);
    if (errS) console.error("Error subcoordinadores:", errS);
    if (errV) console.error("Error votantes:", errV);

    setEstructura({
      coordinadores: (coords || []).map(normalizarCoordinador),
      subcoordinadores: (subs || []).map(normalizarSubcoordinador),
      votantes: (votos || []).map(normalizarVotante),
    });

    setLoading(false);
  };

  useEffect(() => {
    recargarEstructura();
  }, []);

  /* ===== Loader global ===== */
  if (loading) {
    return <LoaderANR text="Cargando estructura electoral…" />;
  }

  /* ===== Helpers ===== */
  const generarCodigo = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  /* ===== Padrón disponible con flags de asignación ===== */
  const getPersonasDisponibles = () => {
    return padron.map((p) => {
      const coord = estructura.coordinadores.find((c) => c.ci === p.ci);
      if (coord) {
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: `${coord.nombre} ${coord.apellido}`,
          asignadoRol: "Coordinador",
        };
      }

      const sub = estructura.subcoordinadores.find((s) => s.ci === p.ci);
      if (sub) {
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: `${sub.nombre} ${sub.apellido}`,
          asignadoRol: "Subcoordinador",
        };
      }

      const vot = estructura.votantes.find((v) => v.ci === p.ci);
      if (vot) {
        return {
          ...p,
          asignado: true,
          asignadoPorNombre: vot.asignadoPorNombre || "Referente",
          asignadoRol: "Votante",
        };
      }

      return {
        ...p,
        asignado: false,
        asignadoPorNombre: null,
        asignadoRol: null,
      };
    });
  };

  /* ===== Buscador global por CI ===== */
  const buscarPorCI = (ci) => {
    if (!ci) {
      setSearchResult(null);
      return;
    }

    const coord = estructura.coordinadores.find((c) => c.ci == ci);
    if (coord) {
      setSearchResult({ tipo: "coordinador", data: coord });
      return;
    }

    const sub = estructura.subcoordinadores.find((s) => s.ci == ci);
    if (sub) {
      setSearchResult({ tipo: "subcoordinador", data: sub });
      return;
    }

    const vot = estructura.votantes.find((v) => v.ci == ci);
    if (vot) {
      const asignadoPor =
        estructura.subcoordinadores.find((s) => s.ci == vot.asignadoPor) ||
        estructura.coordinadores.find((c) => c.ci == vot.asignadoPor) ||
        null;

      setSearchResult({
        tipo: "votante",
        data: vot,
        asignadoPor,
      });
      return;
    }

    setSearchResult({ tipo: "ninguno", data: { ci } });
  };

  /* ===== Agregar persona (coordinador/sub/votante) ===== */
  const handleAgregarPersona = async (persona) => {
    const codigo = generarCodigo();

    const yaCoord = estructura.coordinadores.some((c) => c.ci === persona.ci);
    const yaSub = estructura.subcoordinadores.some((s) => s.ci === persona.ci);
    const yaVot = estructura.votantes.some((v) => v.ci === persona.ci);

    if (yaCoord || yaSub || yaVot) {
      const rol = yaCoord
        ? "Coordinador"
        : yaSub
        ? "Subcoordinador"
        : "Votante";

      alert(
        `⚠️ Esta persona ya está asignada como ${rol}. No puede repetirse en la estructura.`
      );
      return;
    }

    const localidadBase =
      persona.localidad ||
      persona.local ||
      persona.local_votacion ||
      "Sin especificar";

    // COORDINADOR
    if (modalType === "coordinador") {
      const { error } = await supabase.from("coordinadores").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          localidad: localidadBase,
          mesa: persona.mesa || "",
          login_code: codigo,
          asignado_por_nombre: "Superadmin",
          telefono: null,
        },
      ]);

      if (error) {
        alert("Error al guardar coordinador.");
        console.error(error);
        return;
      }

      alert(
        `Coordinador agregado.\nNombre: ${persona.nombre} ${persona.apellido}\nCódigo: ${codigo}`
      );
    }

    // SUBCOORDINADOR
    else if (modalType === "subcoordinador") {
      if (!currentUser || currentUser.role !== "coordinador") {
        alert("Solo un coordinador puede agregar subcoordinadores.");
        return;
      }

      const { error } = await supabase.from("subcoordinadores").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          localidad: localidadBase,
          mesa: persona.mesa || "",
          coordinador_ci: currentUser.ci,
          login_code: codigo,
          asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
          telefono: null,
        },
      ]);

      if (error) {
        alert("Error al guardar subcoordinador.");
        console.error(error);
        return;
      }

      alert(
        `Subcoordinador agregado.\nNombre: ${persona.nombre} ${persona.apellido}\nCódigo: ${codigo}`
      );
    }

    // VOTANTE
    else if (modalType === "votante") {
      if (!currentUser) {
        alert("Debe iniciar sesión para asignar votantes.");
        return;
      }

      const { error } = await supabase.from("votantes").insert([
        {
          ci: persona.ci,
          nombre: persona.nombre,
          apellido: persona.apellido,
          localidad: localidadBase,
          mesa: persona.mesa || "",
          asignado_por: currentUser.ci,
          asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
          telefono: null,
        },
      ]);

      if (error) {
        alert("Error al guardar votante.");
        console.error(error);
        return;
      }

      alert("Votante asignado correctamente.");
    }

    setShowAddModal(false);
    await recargarEstructura();
  };

  /* ===== Quitar persona ===== */
  const quitarPersona = async (ci, tipo) => {
    const mensajes = {
      coordinador:
        "Quitar coordinador eliminará también sus subcoordinadores y sus votantes. ¿Seguro?",
      subcoordinador:
        "Quitar subcoordinador eliminará también sus votantes. ¿Seguro?",
      votante: "¿Quitar votante de la estructura?",
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
      await supabase
        .from("votantes")
        .delete()
        .match({ ci: ci, asignado_por: currentUser.ci });
    }

    await recargarEstructura();
    alert("Persona removida.");
  };

  /* ===== Estadísticas ===== */
  const getEstadisticas = () => {
    if (currentUser?.role === "superadmin") {
      return {
        coordinadores: estructura.coordinadores.length,
        subcoordinadores: estructura.subcoordinadores.length,
        votantes: estructura.votantes.length,
      };
    }

    if (currentUser?.role === "coordinador") {
      const misSubs = estructura.subcoordinadores.filter(
        (s) => s.coordinadorCI === currentUser.ci
      );

      const directos = estructura.votantes.filter(
        (v) => v.asignadoPor === currentUser.ci
      );

      let indirectos = 0;
      misSubs.forEach((s) => {
        indirectos += estructura.votantes.filter(
          (v) => v.asignadoPor === s.ci
        ).length;
      });

      return {
        subcoordinadores: misSubs.length,
        votantesDirectos: directos.length,
        votantesIndirectos: indirectos,
        total: directos.length + indirectos,
      };
    }

    if (currentUser?.role === "subcoordinador") {
      const directos = estructura.votantes.filter(
        (v) => v.asignadoPor === currentUser.ci
      );

      return { votantes: directos.length };
    }

    return {};
  };

  /* ===== Reporte PDF ===== */
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
        head: [["CI", "Nombre", "Apellido", "Teléfono", "Código"]],
        body: estructura.coordinadores.map((c) => [
          c.ci,
          c.nombre,
          c.apellido,
          c.telefono || "-",
          c.loginCode || "-",
        ]),
        theme: "striped",
        headStyles: { fillColor: [220, 0, 0] },
      });

      y = doc.lastAutoTable.finalY + 15;
    }

    if (currentUser.role === "coordinador") {
      const misSubs = estructura.subcoordinadores.filter(
        (s) => s.coordinadorCI === currentUser.ci
      );

      misSubs.forEach((sub) => {
        doc.setFontSize(14);
        doc.text(`Subcoordinador: ${sub.nombre} ${sub.apellido}`, 14, y);
        y += 5;

        const votantesSub = estructura.votantes.filter(
          (v) => v.asignadoPor === sub.ci
        );

        autoTable(doc, {
          startY: y,
          head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa", "Teléfono"]],
          body: votantesSub.map((v) => [
            v.ci,
            v.nombre,
            v.apellido,
            v.localidad,
            v.mesa,
            v.telefono || "-",
          ]),
          theme: "grid",
          headStyles: { fillColor: [255, 80, 80] },
        });

        y = doc.lastAutoTable.finalY + 12;
      });

      const directos = estructura.votantes.filter(
        (v) => v.asignadoPor === currentUser.ci
      );

      if (directos.length > 0) {
        doc.setFontSize(14);
        doc.text("Votantes directos del Coordinador:", 14, y);

        autoTable(doc, {
          startY: y + 4,
          head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa", "Teléfono"]],
          body: directos.map((v) => [
            v.ci,
            v.nombre,
            v.apellido,
            v.localidad,
            v.mesa,
            v.telefono || "-",
          ]),
          theme: "grid",
          headStyles: { fillColor: [255, 80, 80] },
        });
      }
    }

    if (currentUser.role === "subcoordinador") {
      doc.setFontSize(14);
      doc.text("Mis votantes:", 14, y);

      const directos = estructura.votantes.filter(
        (v) => v.asignadoPor === currentUser.ci
      );

      autoTable(doc, {
        startY: y + 4,
        head: [["CI", "Nombre", "Apellido", "Localidad", "Mesa", "Teléfono"]],
        body: directos.map((v) => [
          v.ci,
          v.nombre,
          v.apellido,
          v.localidad,
          v.mesa,
          v.telefono || "-",
        ]),
        theme: "grid",
        headStyles: { fillColor: [255, 80, 80] },
      });
    }

    doc.save("reporte_estructura.pdf");
  };

  /* ===== LOGIN ===== */
  const handleLogin = async () => {
    if (!loginID.trim()) {
      alert("Ingrese su CI o código de acceso.");
      return;
    }

    // SUPERADMIN
    if (loginID === "4630621") {
      if (loginPass !== "12345") {
        alert("Contraseña incorrecta.");
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

    if (coordRes.data?.length > 0) {
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

    if (subRes.data?.length > 0) {
      const s = normalizarSubcoordinador(subRes.data[0]);
      const user = { ...s, role: "subcoordinador" };
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
      return;
    }

    alert("Código no encontrado.");
  };

  /* ===== LOGOUT ===== */
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

  /* ===== Editar teléfono (guardar) ===== */
  const guardarTelefono = async () => {
    if (!editPhonePersona || !editPhoneTipo) return;

    if (!newTelefono.startsWith("+595")) {
      alert("El número debe comenzar con +595");
      return;
    }

    let table = "";
    if (editPhoneTipo === "coordinador") table = "coordinadores";
    if (editPhoneTipo === "subcoordinador") table = "subcoordinadores";
    if (editPhoneTipo === "votante") table = "votantes";

    const { error } = await supabase
      .from(table)
      .update({ telefono: newTelefono })
      .eq("ci", editPhonePersona.ci);

    if (error) {
      alert("Error al actualizar teléfono");
      console.error(error);
      return;
    }

    alert("Teléfono actualizado correctamente");
    setEditPhoneOpen(false);
    setEditPhonePersona(null);
    setEditPhoneTipo(null);
    setNewTelefono("+595");
    await recargarEstructura();
  };

  /* ===== LOGIN SCREEN ===== */
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white/95 p-8 rounded-xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-red-600 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800 mt-3">
              Sistema Electoral
            </h1>
            <p className="text-gray-600">Gestión de Votantes</p>
          </div>

          <label className="text-sm font-medium text-gray-700">
            CI o Código
          </label>
          <input
            type="text"
            value={loginID}
            onChange={(e) => setLoginID(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
          />

          {loginID === "4630621" && (
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold mb-3"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  /* ===== DASHBOARD ===== */
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
                : "Subcoordinador"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg"
          >
            <LogOut className="w-4 h-4" /> Salir
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
          onClick={generarPDF}
          className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
        >
          <BarChart3 className="w-4 h-4" />
          Descargar Reporte PDF
        </button>
      </div>

      {/* BUSCADOR GLOBAL POR CI */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <label className="font-semibold">Buscar por CI</label>
          <input
            type="text"
            value={searchCI}
            onChange={(e) => {
              const valor = e.target.value;
              setSearchCI(valor);
              buscarPorCI(valor.trim());
            }}
            placeholder="Ingrese CI (solo números)"
            className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
          />

          {searchResult && (
            <div className="mt-4 p-3 border rounded bg-gray-50 text-sm">
              {searchResult.tipo === "coordinador" && (
                <p>
                  <b>Coordinador:</b> {searchResult.data.nombre}{" "}
                  {searchResult.data.apellido} — CI: {searchResult.data.ci}
                  {searchResult.data.telefono
                    ? ` — Tel: ${searchResult.data.telefono}`
                    : ""}
                </p>
              )}

              {searchResult.tipo === "subcoordinador" && (
                <p>
                  <b>Subcoordinador:</b> {searchResult.data.nombre}{" "}
                  {searchResult.data.apellido} — CI: {searchResult.data.ci}
                  <br />
                  Asignado por:{" "}
                  {searchResult.data.asignadoPorNombre || "Superadmin"}
                  {searchResult.data.telefono
                    ? ` — Tel: ${searchResult.data.telefono}`
                    : ""}
                </p>
              )}

              {searchResult.tipo === "votante" && (
                <>
                  <p>
                    <b>Votante asignado por:</b>{" "}
                    {searchResult.asignadoPor?.nombre}{" "}
                    {searchResult.asignadoPor?.apellido} (
                    {searchResult.asignadoPor?.ci || "CI no registrado"})
                  </p>
                  <p>
                    Localidad: {searchResult.data.localidad || "Sin datos"} –{" "}
                    Mesa: {searchResult.data.mesa || "-"}
                    {searchResult.data.telefono
                      ? ` — Tel: ${searchResult.data.telefono}`
                      : ""}
                  </p>
                </>
              )}

              {searchResult.tipo === "ninguno" && (
                <p className="text-gray-600">
                  Este CI <b>{searchResult.data.ci}</b> no está asignado a
                  nadie.
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
                              Teléfono: {coord.telefono}
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

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditPhoneTipo("coordinador");
                            setEditPhonePersona(coord);
                            setNewTelefono(coord.telefono || "+595");
                            setEditPhoneOpen(true);
                          }}
                          className="text-blue-600 text-xs hover:underline"
                        >
                          Teléfono
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPersona(coord.ci, "coordinador");
                          }}
                          className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedCoords[coord.ci] && (
                      <div className="bg-white px-4 pb-4">
                        {/* Subcoordinadores */}
                        {estructura.subcoordinadores
                          .filter((s) => s.coordinadorCI === coord.ci)
                          .map((sub) => (
                            <div
                              key={sub.ci}
                              className="border rounded p-3 mb-2 bg-red-50/40"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {sub.nombre} {sub.apellido}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    CI: {sub.ci} — Subcoordinador
                                  </p>
                                  {sub.telefono && (
                                    <p className="text-xs text-gray-500">
                                      Teléfono: {sub.telefono}
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
                                </div>

                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => {
                                      setEditPhoneTipo("subcoordinador");
                                      setEditPhonePersona(sub);
                                      setNewTelefono(sub.telefono || "+595");
                                      setEditPhoneOpen(true);
                                    }}
                                    className="text-blue-600 text-xs hover:underline"
                                  >
                                    Teléfono
                                  </button>
                                  <button
                                    onClick={() =>
                                      quitarPersona(sub.ci, "subcoordinador")
                                    }
                                    className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-sm font-semibold mt-2">
                                Votantes
                              </p>
                              {estructura.votantes
                                .filter((v) => v.asignadoPor === sub.ci)
                                .map((v) => (
                                  <div
                                    key={v.ci}
                                    className="bg-white border p-2 mt-2 rounded text-sm flex justify-between items-center"
                                  >
                                    <span>
                                      {v.nombre} {v.apellido} — CI: {v.ci}
                                      {v.localidad
                                        ? ` — ${v.localidad}`
                                        : ""}
                                      {v.mesa ? ` — Mesa ${v.mesa}` : ""}
                                      {v.telefono
                                        ? ` — Tel: ${v.telefono}`
                                        : ""}
                                    </span>

                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setEditPhoneTipo("votante");
                                          setEditPhonePersona(v);
                                          setNewTelefono(
                                            v.telefono || "+595"
                                          );
                                          setEditPhoneOpen(true);
                                        }}
                                        className="text-blue-600 text-xs hover:underline"
                                      >
                                        Teléfono
                                      </button>
                                      <button
                                        onClick={() =>
                                          quitarPersona(v.ci, "votante")
                                        }
                                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ))}

                        {/* Votantes directos del coordinador */}
                        {estructura.votantes
                          .filter((v) => v.asignadoPor === coord.ci)
                          .map((v) => (
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
                                  onClick={() => {
                                    setEditPhoneTipo("votante");
                                    setEditPhonePersona(v);
                                    setNewTelefono(v.telefono || "+595");
                                    setEditPhoneOpen(true);
                                  }}
                                  className="text-blue-600 text-xs hover:underline"
                                >
                                  Teléfono
                                </button>
                                <button
                                  onClick={() =>
                                    quitarPersona(v.ci, "votante")
                                  }
                                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
                {/* Subcoordinadores */}
                {estructura.subcoordinadores
                  .filter((s) => s.coordinadorCI === currentUser.ci)
                  .map((sub) => (
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
                              CI: {sub.ci} — Subcoordinador
                            </p>
                            {sub.telefono && (
                              <p className="text-xs text-gray-500">
                                Teléfono: {sub.telefono}
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

                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditPhoneTipo("subcoordinador");
                              setEditPhonePersona(sub);
                              setNewTelefono(sub.telefono || "+595");
                              setEditPhoneOpen(true);
                            }}
                            className="text-blue-600 text-xs hover:underline"
                          >
                            Teléfono
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              quitarPersona(sub.ci, "subcoordinador");
                            }}
                            className="bg-red-600 text-white p-2 rounded hover:bg-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {expandedCoords[sub.ci] && (
                        <div className="bg-white px-4 pb-4">
                          <p className="text-sm font-semibold mt-2">
                            Votantes
                          </p>
                          {estructura.votantes
                            .filter((v) => v.asignadoPor === sub.ci)
                            .map((v) => (
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
                                    onClick={() => {
                                      setEditPhoneTipo("votante");
                                      setEditPhonePersona(v);
                                      setNewTelefono(v.telefono || "+595");
                                      setEditPhoneOpen(true);
                                    }}
                                    className="text-blue-600 text-xs hover:underline"
                                  >
                                    Teléfono
                                  </button>
                                  <button
                                    onClick={() =>
                                      quitarPersona(v.ci, "votante")
                                    }
                                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}

                          {estructura.votantes.filter(
                            (v) => v.asignadoPor === sub.ci
                          ).length === 0 && (
                            <p className="text-gray-500 text-sm mt-2">
                              Sin votantes asignados.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                {/* Votantes directos del coordinador */}
                {estructura.votantes.filter(
                  (v) => v.asignadoPor === currentUser.ci
                ).length > 0 && (
                  <div className="border rounded-lg mb-3 p-4">
                    <p className="font-semibold text-gray-700 mb-3">
                      Mis votantes directos
                    </p>

                    {estructura.votantes
                      .filter((v) => v.asignadoPor === currentUser.ci)
                      .map((v) => (
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
                              onClick={() => {
                                setEditPhoneTipo("votante");
                                setEditPhonePersona(v);
                                setNewTelefono(v.telefono || "+595");
                                setEditPhoneOpen(true);
                              }}
                              className="text-blue-600 text-xs hover:underline"
                            >
                              Teléfono
                            </button>
                            <button
                              onClick={() => quitarPersona(v.ci, "votante")}
                              className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
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
                {estructura.votantes
                  .filter((v) => v.asignadoPor === currentUser.ci)
                  .map((v) => (
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
                          onClick={() => {
                            setEditPhoneTipo("votante");
                            setEditPhonePersona(v);
                            setNewTelefono(v.telefono || "+595");
                            setEditPhoneOpen(true);
                          }}
                          className="text-blue-600 text-xs hover:underline"
                        >
                          Teléfono
                        </button>
                        <button
                          onClick={() => quitarPersona(v.ci, "votante")}
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                {estructura.votantes.filter(
                  (v) => v.asignadoPor === currentUser.ci
                ).length === 0 && (
                  <p className="text-gray-500 py-6">
                    No tiene votantes asignados.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODALES */}
      <AddPersonModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        tipo={modalType}
        onAdd={handleAgregarPersona}
        disponibles={getPersonasDisponibles()}
      />

      <EditPhoneModal
        open={editPhoneOpen}
        persona={editPhonePersona}
        tipo={editPhoneTipo}
        onClose={() => {
          setEditPhoneOpen(false);
          setEditPhonePersona(null);
          setEditPhoneTipo(null);
          setNewTelefono("+595");
        }}
        newTelefono={newTelefono}
        setNewTelefono={setNewTelefono}
        onSave={guardarTelefono}
      />
    </div>
  );
};

export default App;
