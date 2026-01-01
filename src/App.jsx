// App.jsx – Versión Supabase + padrón remoto (COMPLETA, CON LOGIN PERSISTENTE, BUSCADOR CI Y TELÉFONO)

import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AddPersonModal from "./AddPersonModal";

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

  const normalizeCI = (value) => Number(value) || 0;

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("Código copiado al portapapeles");
    } catch (err) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        alert("Código copiado al portapapeles");
      } catch (e) {
        console.error("No se pudo copiar", err || e);
        alert("No se pudo copiar el código.");
      }
    }
  };

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

  // Cargar estructura cuando haya sesión persistida
  useEffect(() => {
    if (currentUser) {
      recargarEstructura();
    }
  }, [currentUser]);

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
const toggleExpand = (ci) => {
  const key = normalizeCI(ci);
  setExpandedCoords((prev) => ({
    ...prev,
    [key]: !prev[key],
  }));
};

  // ======================= RECARGAR ESTRUCTURA =======================
const recargarEstructura = async () => {
  try {
    const { data: coords, error: coordsErr } = await supabase
      .from("coordinadores")
      .select(`
        ci,
        login_code,
        asignado_por_nombre,
        telefono,
        padron!inner (
          ci,
          nombre,
          apellido,
          seccional,
          local_votacion,
          mesa,
          orden,
          direccion
        )
      `);

    if (coordsErr) console.error("Error coords:", coordsErr);

    const { data: subs, error: subsErr } = await supabase
      .from("subcoordinadores")
      .select(`
        ci,
        coordinador_ci,
        login_code,
        asignado_por_nombre,
        telefono,
        padron!inner (
          ci,
          nombre,
          apellido,
          seccional,
          local_votacion,
          mesa,
          orden,
          direccion
        )
      `);

    if (subsErr) console.error("Error subs:", subsErr);

    const { data: votos, error: votosErr } = await supabase
      .from("votantes")
      .select(`
        ci,
        asignado_por,
        asignado_por_nombre,
        telefono,
        padron!inner (
          ci,
          nombre,
          apellido,
          seccional,
          local_votacion,
          mesa,
          orden,
          direccion
        )
      `);

    if (votosErr) console.error("Error votos:", votosErr);

   setEstructura({
  coordinadores:
    coords?.map((x) => ({
      ci: normalizeCI(x.ci),
      loginCode: x.login_code,
      asignadoPorNombre: x.asignado_por_nombre,
      telefono: x.telefono,
      nombre: x.padron?.nombre,
      apellido: x.padron?.apellido,
      seccional: x.padron?.seccional,
      local_votacion: x.padron?.local_votacion,
      mesa: x.padron?.mesa,
      orden: x.padron?.orden,
      direccion: x.padron?.direccion,
    })) || [],

  subcoordinadores:
    subs?.map((x) => ({
      ci: normalizeCI(x.ci),
      coordinadorCI: normalizeCI(x.coordinador_ci),
      loginCode: x.login_code,
      asignadoPorNombre: x.asignado_por_nombre,
      telefono: x.telefono,
      nombre: x.padron?.nombre,
      apellido: x.padron?.apellido,
      seccional: x.padron?.seccional,
      local_votacion: x.padron?.local_votacion,
      mesa: x.padron?.mesa,
      orden: x.padron?.orden,
      direccion: x.padron?.direccion,
    })) || [],

  votantes:
    votos?.map((x) => ({
      ci: normalizeCI(x.ci),
      asignadoPor: normalizeCI(x.asignado_por),
      asignadoPorNombre: x.asignado_por_nombre,
      telefono: x.telefono,
      nombre: x.padron?.nombre,
      apellido: x.padron?.apellido,
      seccional: x.padron?.seccional,
      local_votacion: x.padron?.local_votacion,
      mesa: x.padron?.mesa,
      orden: x.padron?.orden,
      direccion: x.padron?.direccion,
    })) || [],
});

console.log("Estructura mapeada correctamente");

  } catch (err) {
    console.error("Error al mapear estructura:", err);
  }
};


  // ======================= PADRÓN DISPONIBLE =======================
const getPersonasDisponibles = () => {
  return padron.map((p) => {
    const ciNumber = normalizeCI(p.ci);
    const personaBase = { ...p, ci: ciNumber };
    let asignadoPorNombreResolved = null;
    let asignadoPorRolResolved = null;

    const coordItem = estructura.coordinadores.find((c) => c.ci === ciNumber);
    if (coordItem) {
      asignadoPorNombreResolved =
        coordItem.asignado_por_nombre || "Superadmin";
      asignadoPorRolResolved = "Superadmin";
      return {
        ...personaBase,
        asignado: true,
        asignadoRol: "Coordinador",
        asignadoPorNombre: coordItem.asignado_por_nombre || "Superadmin",
        asignadoPorNombreResolved,
        asignadoPorRolResolved,
      };
    }

    const subItem = estructura.subcoordinadores.find((s) => s.ci === ciNumber);
    if (subItem) {
      const coordAsignador = estructura.coordinadores.find(
        (c) => c.ci === subItem.coordinadorCI
      );
      asignadoPorNombreResolved =
        coordAsignador?.nombre && coordAsignador?.apellido
          ? `${coordAsignador.nombre} ${coordAsignador.apellido}`
          : subItem.asignado_por_nombre || "Asignado por coordinador";
      asignadoPorRolResolved = coordAsignador ? "Coordinador" : "Coordinador";
      return {
        ...personaBase,
        asignado: true,
        asignadoRol: "Subcoordinador",
        asignadoPorNombre:
          subItem.asignado_por_nombre || "Asignado por coordinador",
        asignadoPorNombreResolved,
        asignadoPorRolResolved,
      };
    }

    const votItem = estructura.votantes.find((v) => v.ci === ciNumber);
    if (votItem) {
      const asignador =
        estructura.subcoordinadores.find(
          (s) => s.ci === votItem.asignadoPor
        ) ||
        estructura.coordinadores.find((c) => c.ci === votItem.asignadoPor) ||
        null;
      asignadoPorNombreResolved =
        asignador && asignador.nombre && asignador.apellido
          ? `${asignador.nombre} ${asignador.apellido}`
          : votItem.asignado_por_nombre || "Asignado";
      asignadoPorRolResolved = asignador
        ? estructura.coordinadores.some((c) => c.ci === asignador.ci)
          ? "Coordinador"
          : "Subcoordinador"
        : null;
      return {
        ...personaBase,
        asignado: true,
        asignadoRol: "Votante",
        asignadoPorNombre: votItem.asignado_por_nombre || "Asignado",
        asignadoPorNombreResolved,
        asignadoPorRolResolved,
      };
    }

    return {
      ...personaBase,
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
    const ci = normalizeCI(personaPadron.ci);

    const coord = estructura.coordinadores.find((c) => c.ci === ci);
    if (coord)
      return setSearchResult({ tipo: "coordinador", data: coord });

    const sub = estructura.subcoordinadores.find((s) => s.ci === ci);
    if (sub)
      return setSearchResult({ tipo: "subcoordinador", data: sub });

    const vot = estructura.votantes.find((v) => v.ci === ci);
    if (vot) {
      const asignadoPor =
        estructura.subcoordinadores.find((s) => s.ci === vot.asignadoPor) ||
        estructura.coordinadores.find((c) => c.ci === vot.asignadoPor) ||
        null;

      return setSearchResult({
        tipo: "votante",
        data: vot,
        asignadoPor,
      });
    }

    return setSearchResult({ tipo: "padron", data: { ...personaPadron, ci } });
  }

  setSearchResult({ tipo: "noExiste", data: { ci: input } });
};

const DatosPersona = ({ persona, rol, loginCode }) => {
  const nombre = (persona.nombre || "").toUpperCase();
  const apellido = (persona.apellido || "").toUpperCase();

  return (
    <div className="space-y-1 text-xs md:text-sm text-gray-700 w-full">
      <p className="font-semibold text-gray-800 text-sm md:text-base">
        {nombre} {apellido}
      </p>
      <p className="text-xs md:text-sm text-gray-700">
        <span className="font-semibold">CI:</span> {persona.ci}
        {rol ? ` — ${rol}` : ""}
      </p>
      {loginCode && (
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-700">
          <span>Código de acceso: {loginCode}</span>
          <button
            onClick={() => copyToClipboard(loginCode)}
            className="p-1.5 border border-red-600 text-red-700 rounded-lg hover:bg-red-50"
            title="Copiar código"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
      {persona.seccional && (
        <p className="text-xs md:text-sm text-gray-700">
          <span className="font-semibold">Seccional:</span> {persona.seccional}
        </p>
      )}
      {persona.local_votacion && (
        <p className="text-xs md:text-sm text-gray-700">
          <span className="font-semibold">Local de Votación:</span>{" "}
          {persona.local_votacion}
        </p>
      )}
      {persona.mesa && (
        <p className="text-xs md:text-sm text-gray-700">
          <span className="font-semibold">Mesa:</span> {persona.mesa}
        </p>
      )}
      {persona.orden && (
        <p className="text-xs md:text-sm text-gray-700">
          <span className="font-semibold">Orden:</span> {persona.orden}
        </p>
      )}
      {persona.direccion && (
        <p className="text-xs md:text-sm text-gray-700">
          <span className="font-semibold">Dirección domicilio:</span>{" "}
          {persona.direccion}
        </p>
      )}
      {persona.telefono && (
        <p className="text-xs md:text-sm text-gray-700">
          <span className="font-semibold">Teléfono:</span> {persona.telefono}
        </p>
      )}
    </div>
  );
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

  // Determinar tabla destino
  let tabla = "";
  let data = {};

  if (modalType === "coordinador") {
    tabla = "coordinadores";
    data = {
      ci: ciStr,
      login_code: ciStr,
      asignado_por_nombre: "Superadmin",
      telefono: null,
    };
  }

  if (modalType === "subcoordinador") {
    tabla = "subcoordinadores";
    data = {
      ci: ciStr,
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

    const isSuper = currentUser.role === "superadmin";

    if (tipo === "coordinador") {
      if (!isSuper) {
        alert("Solo el superadmin puede eliminar coordinadores.");
        return;
      }
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
      if (!isSuper) {
        const ownsSub =
          currentUser.role === "coordinador" &&
          estructura.subcoordinadores.some(
            (s) => s.ci === ci && s.coordinadorCI === currentUser.ci
          );
        if (!ownsSub) {
          alert("Solo el superadmin puede eliminar este subcoordinador.");
          return;
        }
      }
      await supabase.from("votantes").delete().eq("asignado_por", ci);
      await supabase.from("subcoordinadores").delete().eq("ci", ci);
    } else if (tipo === "votante") {

      // SUPERADMIN puede eliminar cualquier votante
      if (isSuper) {
        await supabase.from("votantes").delete().eq("ci", ci);
      } else {
        // Coordinador o Subcoordinador solo eliminan los que agregaron
        const { data: voterOwner } = await supabase
          .from("votantes")
          .select("asignado_por")
          .eq("ci", ci)
          .maybeSingle();

        if (voterOwner?.asignado_por != currentUser.ci) {
          alert("Solo puedes eliminar tus propios votantes.");
          return;
        }

        await supabase
          .from("votantes")
          .delete()
          .match({
            ci: ci,
            asignado_por: currentUser.ci,
          });
      }
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

  const getEstructuraPropia = () => {
    const isCoord = currentUser?.role === "coordinador";
    const misSubcoords = isCoord ? getMisSubcoordinadores() : [];
    const misVotantes = getMisVotantes();
    const votantesIndirectos = isCoord
      ? misSubcoords.reduce(
          (acc, s) => acc + estructura.votantes.filter((v) => v.asignadoPor === s.ci).length,
          0
        )
      : 0;

    return {
      isCoord,
      misSubcoords,
      misVotantes,
      votantesIndirectos,
      totalVotos: misVotantes.length + votantesIndirectos,
    };
  };

  // ======================= ESTADÍSTICAS =======================
  const getEstadisticas = () => {
    if (currentUser?.role === "superadmin") {
      return {
        coordinadores: estructura.coordinadores.length,
        subcoordinadores: estructura.subcoordinadores.length,
        votantes: estructura.votantes.length,
      };
    }

    const { isCoord, misSubcoords, misVotantes, votantesIndirectos, totalVotos } =
      getEstructuraPropia();

    if (isCoord) {
      return {
        subcoordinadores: misSubcoords.length,
        votantesDirectos: misVotantes.length,
        votantesIndirectos,
        total: totalVotos,
      };
    }

    if (currentUser?.role === "subcoordinador") {
      return { votantes: misVotantes.length };
    }

    return {};
  };

  // ======================= REPORTE PDF COMPLETO =======================
const generarPDF = () => {
  if (!currentUser) return;

  const doc = new jsPDF({ orientation: "portrait" });

  // Estilos
  const colorRojo = [200, 0, 0];
  doc.setFont("helvetica", "bold");

  // Encabezado
  doc.setFontSize(18);
  doc.setTextColor(...colorRojo);
  doc.text("INFORME DE CAPTACIÓN ELECTORAL", 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Generado por: ${currentUser.nombre} ${currentUser.apellido} — (${currentUser.role})`,
    14,
    28
  );
  doc.text(`Fecha y hora: ${new Date().toLocaleString()}`, 14, 34);

  let y = 42;

  const resolvePadron = (ci) => padron.find((x) => normalizeCI(x.ci) === normalizeCI(ci));
  const resolveSeccional = (persona) => {
    const padronEntry = resolvePadron(persona.ci);
    return persona.seccional || padronEntry?.seccional || "-";
  };

  if (currentUser.role === "superadmin") {
    const totalCoordinadores = estructura.coordinadores.length;
    const totalSub = estructura.subcoordinadores.length;
    const totalVotantes = estructura.votantes.length;

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Cantidad"]],
      body: [
        ["Coordinadores", totalCoordinadores],
        ["Subcoordinadores", totalSub],
        ["Total de Votantes Captados", totalVotantes],
      ],
      theme: "grid",
      headStyles: { fillColor: colorRojo },
    });

    y = doc.lastAutoTable.finalY + 12;

    const mensaje =
      totalVotantes > 50
        ? "El equipo demuestra un crecimiento sólido y una captación activa en terreno."
        : totalVotantes > 0
        ? "El proceso de captación está en marcha, pero requiere intensificar acciones en campo."
        : "No se observan aún avances significativos en captación.";

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Resumen Ejecutivo:", 14, y);
    y += 6;
    doc.text(mensaje, 14, y);
    y += 12;

    // Ranking global
    doc.setFont("helvetica", "bold");
    doc.text("Ranking de Coordinadores y Subcoordinadores", 14, y);
    y += 4;

    const ranking = [...estructura.coordinadores, ...estructura.subcoordinadores].map((p) => {
      const directos = estructura.votantes.filter((v) => v.asignadoPor === p.ci).length;
      return {
        ci: p.ci,
        nombre: `${p.nombre} ${p.apellido}`,
        seccional: resolveSeccional(p),
        telefono: p.telefono || "-",
        rol: estructura.coordinadores.some((c) => c.ci === p.ci)
          ? "Coordinador"
          : "Subcoordinador",
        cantidad: directos,
      };
    });

    const ordenado = ranking.sort((a, b) => b.cantidad - a.cantidad);
    const totalGlobal = ordenado.reduce((acc, a) => acc + a.cantidad, 0);

    autoTable(doc, {
      startY: y + 4,
      head: [["#", "Nombre", "Rol", "Seccional", "Teléfono", "Votantes", "%"]],
      body: ordenado.map((p, i) => [
        i + 1,
        p.nombre,
        p.rol,
        p.seccional,
        p.telefono,
        p.cantidad,
        totalGlobal > 0 ? ((p.cantidad / totalGlobal) * 100).toFixed(1) : "0",
      ]),
      theme: "striped",
      headStyles: { fillColor: colorRojo },
      bodyStyles: { fontSize: 10 },
    });

    y = doc.lastAutoTable.finalY + 10;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(`Total global de votantes: ${totalGlobal}`, 14, y);
    y += 6;
    doc.text(
      "Generado automáticamente por el Sistema Electoral — Uso privado y estratégico",
      14,
      y
    );
    doc.save("informe_captacion.pdf");
    return;
  }

  // ========== COORDINADOR / SUBCOORDINADOR ==========
  const { isCoord, misSubcoords, misVotantes, totalVotos } = getEstructuraPropia();

  doc.setFont("helvetica", "bold");
  doc.text("Mi Estructura", 14, y);
  y += 6;

  // Estadísticas básicas (solo estructura propia)
  autoTable(doc, {
    startY: y,
    head: [["Indicador", "Cantidad"]],
    body: [
      isCoord ? ["Subcoordinadores", misSubcoords.length] : null,
      isCoord ? ["Votantes directos", misVotantes.length] : null,
      isCoord ? ["Votantes de subcoordinadores", totalVotos - misVotantes.length] : null,
      !isCoord ? ["Votantes", misVotantes.length] : null,
      ["Total de votantes", totalVotos],
    ].filter(Boolean),
    theme: "grid",
    headStyles: { fillColor: colorRojo },
  });

  y = doc.lastAutoTable.finalY + 10;

  const personaToRow = (p) => {
    const padronEntry = resolvePadron(p.ci);
    return [
      p.ci,
      `${p.nombre} ${p.apellido}`,
      resolveSeccional(p),
      padronEntry?.local_votacion || p.local_votacion || "-",
      padronEntry?.mesa || p.mesa || "-",
      padronEntry?.orden || p.orden || "-",
      padronEntry?.direccion || p.direccion || "-",
      p.telefono || "-",
    ];
  };

  if (isCoord) {
    // Subcoordinadores
    if (misSubcoords.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Subcoordinadores", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [
          ["CI", "Nombre", "Seccional", "Local votación", "Mesa", "Orden", "Dirección", "Teléfono"],
        ],
        body: misSubcoords.map((p) => personaToRow(p)),
        theme: "striped",
        headStyles: { fillColor: colorRojo },
        bodyStyles: { fontSize: 9 },
      });
      y = doc.lastAutoTable.finalY + 6;

      // Votantes por subcoordinador
      misSubcoords.forEach((sub) => {
        const votantesSub = estructura.votantes.filter((v) => v.asignadoPor === sub.ci);
        if (votantesSub.length === 0) return;

        doc.setFont("helvetica", "bold");
        doc.text(
          `Votantes de ${sub.nombre} ${sub.apellido} (CI ${sub.ci})`,
          14,
          y
        );
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [
            ["CI", "Nombre", "Seccional", "Local votación", "Mesa", "Orden", "Dirección", "Teléfono"],
          ],
          body: votantesSub.map((v) => personaToRow(v)),
          theme: "striped",
          headStyles: { fillColor: colorRojo },
          bodyStyles: { fontSize: 9 },
        });
        y = doc.lastAutoTable.finalY + 6;
      });
    }

    // Votantes directos del coordinador
    if (misVotantes.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Votantes directos del coordinador", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [
          ["CI", "Nombre", "Seccional", "Local votación", "Mesa", "Orden", "Dirección", "Teléfono"],
        ],
        body: misVotantes.map((v) => personaToRow(v)),
        theme: "striped",
        headStyles: { fillColor: colorRojo },
        bodyStyles: { fontSize: 9 },
      });
      y = doc.lastAutoTable.finalY + 6;
    }
  } else {
    // Subcoordinador: solo sus votantes
    doc.setFont("helvetica", "bold");
    doc.text("Mis votantes", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [
        ["CI", "Nombre", "Seccional", "Local votación", "Mesa", "Orden", "Dirección", "Teléfono"],
      ],
      body: misVotantes.map((v) => personaToRow(v)),
      theme: "striped",
      headStyles: { fillColor: colorRojo },
      bodyStyles: { fontSize: 9 },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Pie final
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text(`Total de votantes: ${totalVotos}`, 14, y);
  y += 6;
  doc.text(
    "Generado automáticamente por el Sistema Electoral — Uso privado y estratégico",
    14,
    y
  );

  doc.save("informe_captacion.pdf");
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
      ci: normalizeCI("4630621"),
      nombre: "Denis",
      apellido: "Ramos",
      role: "superadmin",
    };

    setCurrentUser(superUser);
    localStorage.setItem("currentUser", JSON.stringify(superUser));
    setLoginPass("");
    return;
  }

  // =============== LOGIN COORDINADOR =============== 
  const { data: coord, error: coordErr } = await supabase
    .from("coordinadores")
    .select("ci, login_code, asignado_por_nombre, telefono")
    .eq("login_code", loginID.trim())
    .maybeSingle();

  if (coordErr) {
    console.error("Error buscando coordinador:", coordErr);
  }

  if (coord) {
    const { data: pad, error: padErr } = await supabase
      .from("padron")
      .select("*")
      .eq("ci", coord.ci)
      .maybeSingle();

    if (padErr) {
      console.error("Error cargando datos de padrón (coord):", padErr);
    }

    const user = {
      ci: normalizeCI(coord.ci),
      nombre: pad?.nombre || "(Sin nombre)",
      apellido: pad?.apellido || "",
      seccional: pad?.seccional,
      local_votacion: pad?.local_votacion,
      mesa: pad?.mesa,
      orden: pad?.orden,
      direccion: pad?.direccion,
      telefono: coord.telefono || null,
      role: "coordinador",
    };

    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setLoginPass("");
    return;
  }

  // =============== LOGIN SUBCOORDINADOR =============== 
  const { data: sub, error: subErr } = await supabase
    .from("subcoordinadores")
    .select("ci, login_code, asignado_por_nombre, telefono")
    .eq("login_code", loginID.trim())
    .maybeSingle();

  if (subErr) {
    console.error("Error buscando subcoordinador:", subErr);
  }

  if (sub) {
    const { data: pad, error: padErr } = await supabase
      .from("padron")
      .select("*")
      .eq("ci", sub.ci)
      .maybeSingle();

    if (padErr) {
      console.error("Error cargando datos de padrón (sub):", padErr);
    }

    const user = {
      ci: normalizeCI(sub.ci),
      nombre: pad?.nombre || "(Sin nombre)",
      apellido: pad?.apellido || "",
      seccional: pad?.seccional,
      local_votacion: pad?.local_votacion,
      mesa: pad?.mesa,
      orden: pad?.orden,
      direccion: pad?.direccion,
      telefono: sub.telefono || null,
      role: "subcoordinador",
    };

    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setLoginPass("");
    return;
  }

  alert("Usuario no encontrado. Verifique el código.");
};

// ======================= LOGOUT =======================
const handleLogout = () => {
  setCurrentUser(null);
  setLoginID("");
  setLoginPass("");
  setExpandedCoords({});
  setSearchCI("");
  setSearchResult(null);
  localStorage.removeItem("currentUser");
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

    <p className="font-bold text-red-700 mb-2">
      {searchResult.tipo === "coordinador"
        ? "Coordinador encontrado"
        : searchResult.tipo === "subcoordinador"
        ? "Subcoordinador encontrado"
        : searchResult.tipo === "votante"
        ? "Votante encontrado"
        : searchResult.tipo === "padron"
        ? "Persona en padrón (no asignada)"
        : "No existe en el padrón"}
    </p>

    {/* Datos generales */}
{searchResult.data && (
  <>
    <p><b>Nombre:</b> {searchResult.data.nombre} {searchResult.data.apellido}</p>

    {searchResult.data.seccional && (
      <p><b>Seccional:</b> {searchResult.data.seccional}</p>
    )}

    {searchResult.data.local_votacion && (
      <p><b>Local de Votación:</b> {searchResult.data.local_votacion}</p>
    )}

    {searchResult.data.mesa && (
      <p><b>Mesa:</b> {searchResult.data.mesa}</p>
    )}

    {searchResult.data.orden && (
      <p><b>Orden:</b> {searchResult.data.orden}</p>
    )}

    {searchResult.data.direccion && (
      <p><b>Dirección domicilio:</b> {searchResult.data.direccion}</p>
    )}

    <p><b>CI:</b> {searchResult.data.ci}</p>
    <p><b>Teléfono:</b> {searchResult.data.telefono || "-"}</p>
  </>
)}


    {/* Asignado Por */}
    {searchResult.tipo === "votante" && searchResult.asignadoPor && (
      <p className="mt-2">
        <b>Asignado por:</b> {searchResult.asignadoPor.nombre} {searchResult.asignadoPor.apellido}
      </p>
    )}

    {/* Acciones */}
    {(searchResult.tipo === "coordinador" ||
      searchResult.tipo === "subcoordinador" ||
      searchResult.tipo === "votante") && (
      <div className="mt-4 flex gap-2 flex-wrap">

        {/* Editar teléfono */}
        <button
          onClick={() => abrirTelefono(searchResult.tipo, searchResult.data)}
          className="px-3 py-1 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
        >
          Teléfono
        </button>

        {/* Borrar con permisos */}
        {(currentUser.role === "superadmin" ||
          (searchResult.tipo === "votante" &&
           searchResult.data.asignadoPor === currentUser.ci)) && (
          <button
            onClick={() =>
              quitarPersona(
                searchResult.data.ci,
                searchResult.tipo === "votante"
                  ? "votante"
                  : searchResult.tipo === "subcoordinador"
                  ? "subcoordinador"
                  : "coordinador"
              )
            }
            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4"/>
            Borrar
          </button>
        )}

      </div>
    )}
  </div>
)}

{/* === NO EXISTE NI EN PADRÓN === */}
{searchResult && searchResult.tipo === "noExiste" && (
  <p className="text-gray-600">
    Este CI <b>{searchResult.data.ci}</b> no pertenece al padrón.
  </p>
)}

    </div> {/* Cierra el contenedor del resultado */}
     {/* Cierra searchResult */}
</div> {/* Cierra contenedor del buscador */}

  

{/* RANKING DE CAPTACIÓN (SOLO SUPERADMIN) */}
{currentUser.role === "superadmin" && (
  <div className="max-w-7xl mx-auto px-4 mt-4 mb-4">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Ranking de Captación
      </h2>

      {(() => {
        const ranking = [...estructura.coordinadores, ...estructura.subcoordinadores].map((p) => {
          const directos = estructura.votantes.filter((v) => v.asignadoPor === p.ci).length;
          const padronEntry = padron.find((x) => normalizeCI(x.ci) === p.ci);
          const seccionalResolved = p.seccional || padronEntry?.seccional || "-";
          return {
            ci: p.ci,
            nombre: p.nombre,
            apellido: p.apellido,
            seccional: seccionalResolved,
            telefono: p.telefono || "-",
            rol: estructura.coordinadores.some((c) => c.ci === p.ci)
              ? "Coordinador"
              : "Subcoordinador",
            cantidad: directos,
          };
        });

        const totalGlobal = ranking.reduce((acc, p) => acc + p.cantidad, 0);
        const ordenado = ranking.sort((a, b) => b.cantidad - a.cantidad);

        const getMedal = (index) => {
          if (index === 0) return "text-yellow-600 font-bold"; // Oro
          if (index === 1) return "text-gray-600 font-bold"; // Plata
          if (index === 2) return "text-amber-700 font-bold"; // Bronce
          return "";
        };

        return (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-lg">
                <thead className="bg-red-600 text-white text-center">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2 text-left">Nombre / Rol</th>
                    <th className="px-3 py-2 text-left">Seccional</th>
                    <th className="px-3 py-2">Teléfono</th>
                    <th className="px-3 py-2">Votantes</th>
                    <th className="px-3 py-2">%</th>
                  </tr>
                </thead>

                <tbody className="text-center">
                  {ordenado.map((p, i) => (
                    <tr
                      key={p.ci}
                      className={`border-b ${
                        i < 3 ? "bg-red-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className={`px-3 py-2 ${getMedal(i)}`}>
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 text-left">
                        <div className="font-semibold text-gray-800">
                          {p.nombre} {p.apellido}
                        </div>
                        <div className="text-xs text-gray-600">{p.rol}</div>
                      </td>
                      <td className="px-3 py-2 text-left">
                        {p.seccional || "-"}
                      </td>
                      <td className="px-3 py-2">{p.telefono}</td>
                      <td className="px-3 py-2 font-semibold text-red-700">
                        {p.cantidad}
                      </td>
                      <td className="px-3 py-2">
                        {totalGlobal > 0
                          ? ((p.cantidad / totalGlobal) * 100).toFixed(1)
                          : "0"}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TOTAL GLOBAL */}
            <div className="mt-4 text-right pr-1">
              <p className="font-bold text-red-700 text-lg">
                Total global de votantes: {totalGlobal}
              </p>
            </div>
          </>
        );
      })()}
    </div>
  </div>
)}


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
          className="flex items-start justify-between p-4 cursor-pointer gap-4"
          onClick={() => toggleExpand(coord.ci)}
        >
          <div className="flex items-start gap-3 flex-1">
            {expandedCoords[coord.ci] ? (
              <ChevronDown className="w-5 h-5 text-red-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-red-600" />
            )}

            <DatosPersona
              persona={coord}
              rol="Coordinador"
              loginCode={coord.loginCode}
            />
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <button
              aria-label="Teléfono"
              onClick={(e) => {
                e.stopPropagation();
                abrirTelefono("coordinador", coord);
              }}
              className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              aria-label="Borrar"
              onClick={(e) => {
                e.stopPropagation();
                quitarPersona(coord.ci, "coordinador");
              }}
              className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {expandedCoords[coord.ci] && (
          <div className="bg-white px-4 pb-4">


            {/* SUBCOORDINADORES DEL COORDINADOR */}
            {estructura.subcoordinadores
              .filter((s) => s.coordinadorCI === coord.ci)
              .map((sub) => (
                <div
                  key={sub.ci}
                  className="border rounded p-3 mb-2 bg-red-50/40 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <DatosPersona
                      persona={sub}
                      rol="Sub-coordinador"
                      loginCode={sub.loginCode}
                    />
                    <div className="flex gap-2">
                      <button
                        aria-label="Teléfono"
                        onClick={() => abrirTelefono("subcoordinador", sub)}
                        className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button
                        aria-label="Borrar"
                        onClick={() => quitarPersona(sub.ci, "subcoordinador")}
                        className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <button
                      className="text-sm font-semibold mt-2"
                      disabled
                    >
                      Votantes
                    </button>
                  </div>

                  {/* VOTANTES DE ESE SUBCOORDINADOR */}
                  {estructura.votantes
                    .filter((v) => v.asignadoPor === sub.ci)
                    .map((v) => (
                      <div
                        key={v.ci}
                        className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                      >
                        <DatosPersona persona={v} rol="Votante" />

                      <div className="flex gap-2">
                        <button
                          aria-label="Teléfono"
                          onClick={() => abrirTelefono("votante", v)}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          aria-label="Borrar"
                          onClick={() => quitarPersona(v.ci, "votante")}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    ))}
                </div>
              ))}

            {/* VOTANTES DIRECTOS DEL COORDINADOR */}
            {estructura.votantes
              .filter((v) => v.asignadoPor === coord.ci)
              .map((v) => (
                <div
                  key={v.ci}
                  className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                >
                  <DatosPersona persona={v} rol="Votante" />

                      <div className="flex gap-2">
                        <button
                          aria-label="Teléfono"
                          onClick={() => abrirTelefono("votante", v)}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          aria-label="Borrar"
                          onClick={() => quitarPersona(v.ci, "votante")}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
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
                {getMisSubcoordinadores().map((sub) => (
                  <div
                    key={sub.ci}
                    className="border rounded-lg mb-3 bg-red-50/40"
                  >
                    <div
                      className="flex items-start justify-between p-4 cursor-pointer gap-4"
                      onClick={() => toggleExpand(sub.ci)}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {expandedCoords[sub.ci] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}

                        <DatosPersona
                          persona={sub}
                          rol="Sub-coordinador"
                          loginCode={sub.loginCode}
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          aria-label="Teléfono"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("subcoordinador", sub);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          aria-label="Borrar"
                          onClick={(e) => {
                            e.stopPropagation();
                            quitarPersona(sub.ci, "subcoordinador");
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {expandedCoords[sub.ci] && (
                      <div className="bg-white px-4 pb-4">
                        <p className="text-sm font-semibold mt-2">Votantes</p>
                        {getVotantesDeSubcoord(sub.ci).map((v) => (
                          <div
                      key={v.ci}
                      className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3 w-full"
                    >
                      <DatosPersona persona={v} rol="Votante" />
                      <div className="flex gap-2">
                        <button
                          aria-label="Teléfono"
                          onClick={() => abrirTelefono("votante", v)}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
                          aria-label="Borrar"
                          onClick={() => quitarPersona(v.ci, "votante")}
                          className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
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
                        className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3 w-full"
                      >
                        <DatosPersona persona={v} rol="Votante" />
                        <div className="flex gap-2">
                          <button
                            aria-label="Teléfono"
                            onClick={() => abrirTelefono("votante", v)}
                            className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                          <button
                            aria-label="Borrar"
                            onClick={() => quitarPersona(v.ci, "votante")}
                            className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs md:text-sm"
                          >
                            <Trash2 className="w-5 h-5" />
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
                    className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3 w-full"
                  >
                    <DatosPersona persona={v} rol="Votante" />
                    <div className="flex gap-2">
                      <button
                        aria-label="Teléfono"
                        onClick={() => abrirTelefono("votante", v)}
                        className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button
                        aria-label="Borrar"
                        onClick={() => quitarPersona(v.ci, "votante")}
                        className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
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
  disponibles={getPersonasDisponibles()}
/>

    </div>
  );
};

export default App;
