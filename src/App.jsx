// ======================= APP SISTEMA ELECTORAL =======================
// Control total de roles y estructura con PDF por tipo de usuario
// Clean build (sin duplicados) – Versión organizada con menú PDF

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

// ======================= COMPONENTE PRINCIPAL =======================
const App = () => {
  // PADRÓN COMPLETO DESDE SUPABASE
  const [padron, setPadron] = useState([]);

  // AUTENTICACIÓN
  const [currentUser, setCurrentUser] = useState(null);
  const [loginID, setLoginID] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // ESTRUCTURA CAPTADA
  const [estructura, setEstructura] = useState({
    coordinadores: [],
    subcoordinadores: [],
    votantes: [],
  });

  // UI estados
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [expandedCoords, setExpandedCoords] = useState({});
  const [searchCI, setSearchCI] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // Modal teléfono
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneTarget, setPhoneTarget] = useState(null);
  const [phoneValue, setPhoneValue] = useState("+595");

  // ======================= HELPERS BASE =======================
  const normalizeCI = (v) => Number(v) || 0;

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("Código copiado!");
    } catch {
      alert("No se pudo copiar.");
    }
  };

  const toggleExpand = (ci) => {
    setExpandedCoords((prev) => ({
      ...prev,
      [normalizeCI(ci)]: !prev[normalizeCI(ci)],
    }));
  };
  // ======================= CARGAR PADRÓN COMPLETO =======================
  const cargarPadronCompleto = async () => {
    const { count, error: countError } = await supabase
      .from("padron")
      .select("ci", { count: "exact", head: true });

    if (countError) return;

    const { data, error } = await supabase
      .from("padron")
      .select("*")
      .range(0, count - 1);

    if (!error && data) setPadron(data);
  };

  useEffect(() => {
    cargarPadronCompleto();
  }, []);

  // ======================= SESIÓN PERSISTENTE =======================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (!saved) return;

    try {
      const u = JSON.parse(saved);
      if (u && u.ci && u.role) setCurrentUser(u);
    } catch {}
  }, []);

  useEffect(() => {
    if (currentUser) recargarEstructura();
  }, [currentUser]);

 // ======================= CARGAR ESTRUCTURA (CORRECTO) =======================
const recargarEstructura = async () => {
  try {
    const { data: coords } = await supabase
      .from("coordinadores")
      .select(`
        ci,
        login_code,
        asignado_por_nombre,
        telefono,
        padron (
          ci, nombre, apellido, seccional, local_votacion, mesa, orden, direccion
        )
      `);

    const { data: subs } = await supabase
      .from("subcoordinadores")
      .select(`
        ci,
        coordinador_ci,
        login_code,
        asignado_por_nombre,
        telefono,
        padron (
          ci, nombre, apellido, seccional, local_votacion, mesa, orden, direccion
        )
      `);

    const { data: votos } = await supabase
      .from("votantes")
      .select(`
        ci,
        asignado_por,
        coordinador_ci,
        asignado_por_nombre,
        telefono,
        padron (
          ci, nombre, apellido, seccional, local_votacion, mesa, orden, direccion
        )
      `);

    setEstructura({
      coordinadores: coords?.map(x => ({ ...x.padron, ...x })) || [],
      subcoordinadores: subs?.map(x => ({ ...x.padron, ...x })) || [],
      votantes: votos?.map(x => ({ ...x.padron, ...x })) || [],
    });
  } catch (e) {
    console.error("Error recargando estructura", e);
  }
};

  // ======================= BUSCADOR GLOBAL POR CI =======================
  const buscarPorCI = (input) => {
    if (!input.trim()) return setSearchResult(null);
    const clean = input.replace(/\D/g, "");

    const persona = padron.find(p => {
      const raw = String(p.ci || "");
      return raw.includes(clean);
    });

    if (!persona) {
      setSearchResult({ tipo: "noExiste", data: { ci: clean } });
      return;
    }

    const ci = normalizeCI(persona.ci);

    const coord = estructura.coordinadores.find(c => normalizeCI(c.ci) === ci);
    if (coord) return setSearchResult({ tipo: "coordinador", data: coord });

    const sub = estructura.subcoordinadores.find(s => normalizeCI(s.ci) === ci);
    if (sub) return setSearchResult({ tipo: "subcoordinador", data: sub });

    const vot = estructura.votantes.find(v => normalizeCI(v.ci) === ci);
    if (vot) return setSearchResult({ tipo: "votante", data: vot });

    return setSearchResult({ tipo: "padron", data: persona });
  };

  // ======================= LOGIN =======================
  const handleLogin = async () => {
    if (!loginID.trim()) return alert("Ingrese código.");

    // SUPERADMIN
    if (loginID === "4630621") {
      if (loginPass !== "12345") return alert("Contraseña incorrecta.");

      const u = {
        ci: 4630621,
        nombre: "Denis",
        apellido: "Ramos",
        role: "superadmin",
      };

      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    // COORD
    const { data: coord } = await supabase
      .from("coordinadores")
      .select("ci,login_code,telefono,padron(*)")
      .eq("login_code", loginID)
      .maybeSingle();

    if (coord) {
      const u = {
        ci: normalizeCI(coord.ci),
        nombre: coord.padron.nombre,
        apellido: coord.padron.apellido,
        telefono: coord.telefono,
        role: "coordinador",
      };

      setCurrentUser(u);
      localStorage.setItem("currentUser", JSON.stringify(u));
      return;
    }

    // SUB
    const { data: sub } = await supabase
      .from("subcoordinadores")
      .select("ci,login_code,telefono,padron(*)")
      .eq("login_code", loginID)
      .maybeSingle();

    if (sub) {
      const u = {
        ci: normalizeCI(sub.ci),
        nombre: sub.padron.nombre,
        apellido: sub.padron.apellido,
        telefono: sub.telefono,
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
    setExpandedCoords({});
    setSearchResult(null);
  };
  // ======================= CRUD / TELÉFONO =======================
  const abrirTelefono = (tipo, p) => {
    setPhoneTarget({ tipo, ...p });
    setPhoneValue(p.telefono || "+595");
    setPhoneModalOpen(true);
  };

  const guardarTelefono = async () => {
    if (!phoneTarget) return;

    const telefono = phoneValue.trim();
    if (!telefono) return alert("Ingrese número");

    let tabla = "votantes";
    if (phoneTarget.tipo === "coordinador") tabla = "coordinadores";
    if (phoneTarget.tipo === "subcoordinador") tabla = "subcoordinadores";

    await supabase.from(tabla).update({ telefono }).eq("ci", phoneTarget.ci);

    alert("Número actualizado.");
    setPhoneModalOpen(false);
    setPhoneTarget(null);
    setPhoneValue("+595");
    recargarEstructura();
  };

  // ======================= AGREGAR PERSONA =======================
const handleAgregarPersona = async (persona) => {
  if (!modalType) return alert("Seleccione tipo.");

  const ci = normalizeCI(persona.ci); // Siempre número
  let tabla = "";
  let data = {};

  if (modalType === "coordinador") {
    tabla = "coordinadores";
    data = {
      ci,
      login_code: String(ci),
      asignado_por_nombre: "Superadmin",
    };
  }

  if (modalType === "subcoordinador") {
    tabla = "subcoordinadores";
    data = {
      ci,
      coordinador_ci: normalizeCI(currentUser.ci),
      login_code: String(ci),
      asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
    };
  }

  if (modalType === "votante") {
  tabla = "votantes";

  let asignadorCI;
  let coordinadorCI;

  if (currentUser.role === "subcoordinador") {
    asignadorCI = normalizeCI(currentUser.ci);

    const sub = estructura.subcoordinadores.find(
      (s) => normalizeCI(s.ci) === asignadorCI
    );

    coordinadorCI = normalizeCI(sub?.coordinador_ci);
  }

  if (currentUser.role === "coordinador") {
    // el coordinador actúa como su propio subcoordinador
    asignadorCI = normalizeCI(currentUser.ci);
    coordinadorCI = normalizeCI(currentUser.ci);
  }

  if (!asignadorCI || !coordinadorCI) {
    return alert("No se pudo determinar la estructura del votante.");
  }

  data = {
    ci,
    asignado_por: asignadorCI,          // SIEMPRE quien lo gestiona directo
    asignado_por_nombre: `${currentUser.nombre} ${currentUser.apellido}`,
    coordinador_ci: coordinadorCI,      // SIEMPRE el coordinador
  };
}


  const { error } = await supabase.from(tabla).insert([data]);
  if (error) {
    console.error("Supabase error:", error);
    alert(error.message || "Error desconocido");
    return;
  }

  alert("Agregado correctamente.");
  setShowAddModal(false);
  recargarEstructura();
};

  // ======================= QUITAR PERSONA =======================
  const quitarPersona = async (ci, tipo) => {
    if (!window.confirm("¿Quitar persona?")) return;

    const isSuper = currentUser.role === "superadmin";
    ci = normalizeCI(ci);

    if (tipo === "coordinador") {
      if (!isSuper) return alert("Solo superadmin.");
      await supabase.from("subcoordinadores").delete().eq("coordinador_ci", ci);
      await supabase.from("votantes").delete().eq("asignado_por", ci);
      await supabase.from("coordinadores").delete().eq("ci", ci);
    }

    if (tipo === "subcoordinador") {
      await supabase.from("votantes").delete().eq("asignado_por", ci);
      await supabase.from("subcoordinadores").delete().eq("ci", ci);
    }

    if (tipo === "votante") {
      await supabase.from("votantes").delete().eq("ci", ci);
    }

    recargarEstructura();
  };

  // ======================= MIS DATOS / FILTROS =======================
const getMisVotantes = () => {
  if (!currentUser) return [];

  // SUBCOORDINADOR → solo los que él asignó (asignado_por = su CI)
  if (currentUser.role === "subcoordinador") {
    return estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === normalizeCI(currentUser.ci)
    );
  }

  // COORDINADOR → sus votantes DIRECTOS (asignado_por = su CI)
  // y además que pertenezcan a su red (coordinador_ci = su CI)
  if (currentUser.role === "coordinador") {
    return estructura.votantes.filter(
      (v) =>
        normalizeCI(v.asignado_por) === normalizeCI(currentUser.ci) &&
        normalizeCI(v.coordinador_ci) === normalizeCI(currentUser.ci)
    );
  }

  return [];
};


  // ======================= COMPONENTE DATOS PERSONA =======================
  const DatosPersona = ({ persona, rol, loginCode }) => {
    return (
      <div className="space-y-1 text-xs md:text-sm">
        <p className="font-semibold">
          {persona.nombre} {persona.apellido}
        </p>
        <p><b>CI:</b> {persona.ci}</p>
        {rol && <p><b>Rol:</b> {rol}</p>}
        {loginCode && (
          <button
            onClick={() => copyToClipboard(loginCode)}
            className="p-1 border rounded text-red-600"
          >
            Copiar acceso
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
  };
  // ======================= DISPONIBLES (PADRÓN + ROL REAL) =======================
const getPersonasDisponibles = () => {
  return padron.map((p) => {
    const ci = normalizeCI(p.ci);

    const coord = estructura.coordinadores.find((c) => normalizeCI(c.ci) === ci);
    const sub = estructura.subcoordinadores.find((s) => normalizeCI(s.ci) === ci);
    const vot = estructura.votantes.find((v) => normalizeCI(v.ci) === ci);

    let rol = null;
    if (coord) rol = "coordinador";
    else if (sub) rol = "subcoordinador";
    else if (vot) rol = "votante";

    return {
      ...p,
      ci,
      asignado: rol !== null,
      asignadoRol: rol,
      asignadoPorNombre: sub?.asignado_por_nombre || vot?.asignado_por_nombre || "",
    };
  });
};


  // ======================= ESTRUCTURA PROPIA PARA ESTADÍSTICAS/PDF =======================
  const getEstructuraPropia = () => {
    if (!currentUser) {
      return {
        isCoord: false,
        misSubcoords: [],
        misVotantes: [],
        votantesIndirectos: 0,
        totalVotos: 0,
      };
    }

    const isCoord = currentUser.role === "coordinador";
    const isSub = currentUser.role === "subcoordinador";

    let misSubcoords = [];
    let misVotantes = [];

    if (isCoord) {
      misSubcoords = getMisSubcoordinadores();
      misVotantes = getMisVotantes();
    } else if (isSub) {
      misVotantes = getMisVotantes();
    }

    const votantesIndirectos = isCoord
      ? misSubcoords.reduce(
          (acc, s) => acc + getVotantesDeSubcoord(s.ci).length,
          0
        )
      : 0;

    const totalVotos = misVotantes.length + votantesIndirectos;

    return { isCoord, misSubcoords, misVotantes, votantesIndirectos, totalVotos };
  };

  // ======================= ESTADÍSTICAS PARA CARDS =======================
  const getEstadisticas = () => {
    if (!currentUser) return {};

    if (currentUser.role === "superadmin") {
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
        total: totalVotos,
      };
    }

    if (currentUser.role === "subcoordinador") {
      return {
        votantes: misVotantes.length,
      };
    }

    return {};
  };

  // ======================= PDF (MENÚ: RANKING / ESTRUCTURA) =======================
  const generarPDF = (tipo = "estructura") => {
    if (!currentUser) return;

    const doc = new jsPDF({ orientation: "portrait" });
    const colorRojo = [200, 0, 0];

    const resolvePadron = (ci) =>
      padron.find((x) => normalizeCI(x.ci) === normalizeCI(ci));

    const resolveSeccional = (persona) => {
      const padronEntry = resolvePadron(persona.ci);
      return persona.seccional || padronEntry?.seccional || "-";
    };

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

    // Encabezado
    doc.setFont("helvetica", "bold");
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

    // ----- SUPERADMIN: PDF RANKING O ESTRUCTURA GLOBAL -----
    if (currentUser.role === "superadmin") {
      const totalCoordinadores = estructura.coordinadores.length;
      const totalSub = estructura.subcoordinadores.length;
      const totalVotantes = estructura.votantes.length;

      // Resumen de totales
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

      y = doc.lastAutoTable.finalY + 10;

      if (tipo === "ranking") {
        // ---------- RANKING GLOBAL ----------
        doc.setFont("helvetica", "bold");
        doc.text("Ranking de Coordinadores y Subcoordinadores", 14, y);
        y += 4;

        const ranking = [
          ...estructura.coordinadores,
          ...estructura.subcoordinadores,
        ].map((p) => {
          const directos = estructura.votantes.filter(
            (v) => normalizeCI(v.asignado_por) === normalizeCI(p.ci)
          ).length;
          return {
            ci: p.ci,
            nombre: `${p.nombre} ${p.apellido}`,
            seccional: resolveSeccional(p),
            telefono: p.telefono || "-",
            rol: estructura.coordinadores.some(
              (c) => normalizeCI(c.ci) === normalizeCI(p.ci)
            )
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
            totalGlobal > 0
              ? ((p.cantidad / totalGlobal) * 100).toFixed(1)
              : "0",
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
        doc.save("informe_ranking_global.pdf");
        return;
      } else {
        // ---------- ESTRUCTURA COMPLETA (GLOBAL) ----------
        doc.setFont("helvetica", "bold");
        doc.text("Estructura general (Coordinadores / Sub / Votantes)", 14, y);
        y += 6;

        estructura.coordinadores.forEach((coord) => {
          doc.setFont("helvetica", "bold");
          doc.text(
            `Coordinador: ${coord.nombre} ${coord.apellido} (CI ${coord.ci})`,
            14,
            y
          );
          y += 4;

          const subs = estructura.subcoordinadores.filter(
            (s) => normalizeCI(s.coordinador_ci) === normalizeCI(coord.ci)
          );

          if (subs.length > 0) {
            autoTable(doc, {
              startY: y,
              head: [
                [
                  "CI",
                  "Nombre",
                  "Seccional",
                  "Local",
                  "Mesa",
                  "Orden",
                  "Dirección",
                  "Teléfono",
                ],
              ],
              body: subs.map((s) => personaToRow(s)),
              theme: "striped",
              headStyles: { fillColor: colorRojo },
              bodyStyles: { fontSize: 9 },
            });
            y = doc.lastAutoTable.finalY + 4;
          }

          subs.forEach((sub) => {
            const votantesSub = getVotantesDeSubcoord(sub.ci);
            if (votantesSub.length === 0) return;

            doc.setFont("helvetica", "bold");
            doc.text(
              `Votantes de ${sub.nombre} ${sub.apellido} (CI ${sub.ci})`,
              18,
              y
            );
            y += 4;

            autoTable(doc, {
              startY: y,
              head: [
                [
                  "CI",
                  "Nombre",
                  "Seccional",
                  "Local",
                  "Mesa",
                  "Orden",
                  "Dirección",
                  "Teléfono",
                ],
              ],
              body: votantesSub.map((v) => personaToRow(v)),
              theme: "striped",
              headStyles: { fillColor: colorRojo },
              bodyStyles: { fontSize: 9 },
            });
            y = doc.lastAutoTable.finalY + 4;
          });

          const directosCoord = estructura.votantes.filter(
            (v) => normalizeCI(v.asignado_por) === normalizeCI(coord.ci)
          );

          if (directosCoord.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Votantes directos del coordinador", 18, y);
            y += 4;

            autoTable(doc, {
              startY: y,
              head: [
                [
                  "CI",
                  "Nombre",
                  "Seccional",
                  "Local",
                  "Mesa",
                  "Orden",
                  "Dirección",
                  "Teléfono",
                ],
              ],
              body: directosCoord.map((v) => personaToRow(v)),
              theme: "striped",
              headStyles: { fillColor: colorRojo },
              bodyStyles: { fontSize: 9 },
            });
            y = doc.lastAutoTable.finalY + 6;
          }
        });

        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text(
          "Generado automáticamente por el Sistema Electoral — Uso privado y estratégico",
          14,
          y
        );
        doc.save("informe_estructura_general.pdf");
        return;
      }
    }

    // ----- COORDINADOR / SUBCOORDINADOR: ESTRUCTURA PROPIA -----
    const { isCoord, misSubcoords, misVotantes, votantesIndirectos, totalVotos } =
      getEstructuraPropia();

    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Cantidad"]],
      body: [
        isCoord && ["Subcoordinadores", misSubcoords.length],
        isCoord && ["Votantes directos", misVotantes.length],
        isCoord && ["Votantes de subcoordinadores", votantesIndirectos],
        !isCoord && ["Votantes", misVotantes.length],
        ["Total de votantes", totalVotos],
      ].filter(Boolean),
      theme: "grid",
      headStyles: { fillColor: colorRojo },
    });

    y = doc.lastAutoTable.finalY + 10;

    if (isCoord) {
      doc.setFont("helvetica", "bold");
      doc.text("Subcoordinadores", 14, y);
      y += 4;

      if (misSubcoords.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [
            [
              "CI",
              "Nombre",
              "Seccional",
              "Local",
              "Mesa",
              "Orden",
              "Dirección",
              "Teléfono",
            ],
          ],
          body: misSubcoords.map((s) => personaToRow(s)),
          theme: "striped",
          headStyles: { fillColor: colorRojo },
          bodyStyles: { fontSize: 9 },
        });
        y = doc.lastAutoTable.finalY + 6;
      }

      misSubcoords.forEach((sub) => {
        const votantesSub = getVotantesDeSubcoord(sub.ci);
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
            [
              "CI",
              "Nombre",
              "Seccional",
              "Local",
              "Mesa",
              "Orden",
              "Dirección",
              "Teléfono",
            ],
          ],
          body: votantesSub.map((v) => personaToRow(v)),
          theme: "striped",
          headStyles: { fillColor: colorRojo },
          bodyStyles: { fontSize: 9 },
        });
        y = doc.lastAutoTable.finalY + 6;
      });

      if (misVotantes.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Votantes directos del coordinador", 14, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [
            [
              "CI",
              "Nombre",
              "Seccional",
              "Local",
              "Mesa",
              "Orden",
              "Dirección",
              "Teléfono",
            ],
          ],
          body: misVotantes.map((v) => personaToRow(v)),
          theme: "striped",
          headStyles: { fillColor: colorRojo },
          bodyStyles: { fontSize: 9 },
        });
        y = doc.lastAutoTable.finalY + 6;
      }
    } else {
      // SUBCOORDINADOR
      doc.setFont("helvetica", "bold");
      doc.text("Mis votantes", 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [
          [
            "CI",
            "Nombre",
            "Seccional",
            "Local",
            "Mesa",
            "Orden",
            "Dirección",
            "Teléfono",
          ],
        ],
        body: misVotantes.map((v) => personaToRow(v)),
        theme: "striped",
        headStyles: { fillColor: colorRojo },
        bodyStyles: { fontSize: 9 },
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(`Total de votantes: ${totalVotos}`, 14, y);
    y += 6;
    doc.text(
      "Generado automáticamente por el Sistema Electoral — Uso privado y estratégico",
      14,
      y
    );

    doc.save("informe_mi_estructura.pdf");
  };

  // ======================= PANTALLA LOGIN =======================
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
            <p className="font-semibold mb-2">📋 Instrucciones:</p>
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

  // ======================= DASHBOARD LOGUEADO =======================
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

      {/* TARJETAS ESTADÍSTICAS */}
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
      <div className="max-w-7xl mx-auto px-4 mb-6 flex flex-wrap gap-3 items-center">
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

        {/* MENÚ PDF */}
        <div className="relative inline-block">
          <button
            className="flex items-center gap-2 border-2 border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
            onClick={(e) => {
              const menu = e.currentTarget.nextSibling;
              if (menu) menu.classList.toggle("hidden");
            }}
          >
            <BarChart3 className="w-4 h-4" />
            Descargar PDF
          </button>
          <div className="absolute mt-1 bg-white border rounded-lg shadow-lg hidden z-20 min-w-[220px]">
            {currentUser.role === "superadmin" && (
              <>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                  onClick={() => generarPDF("ranking")}
                >
                  Ranking Global
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                  onClick={() => generarPDF("estructura")}
                >
                  Estructura Completa
                </button>
              </>
            )}
            {currentUser.role !== "superadmin" && (
              <button
                className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50"
                onClick={() => generarPDF("estructura")}
              >
                Mi Estructura
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BUSCADOR GLOBAL POR CI */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="font-semibold">Buscar por CI</label>
          <input
            type="text"
            value={searchCI}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setSearchCI(value);
              buscarPorCI(value);
            }}
            placeholder="Ingrese CI (solo números)"
            className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
            inputMode="numeric"
            pattern="[0-9]*"
          />

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

              {searchResult.data && searchResult.tipo !== "noExiste" && (
                <>
                  <p>
                    <b>Nombre:</b> {searchResult.data.nombre}{" "}
                    {searchResult.data.apellido}
                  </p>
                  <p>
                    <b>CI:</b> {searchResult.data.ci}
                  </p>
                  {searchResult.data.seccional && (
                    <p>
                      <b>Seccional:</b> {searchResult.data.seccional}
                    </p>
                  )}
                  {searchResult.data.local_votacion && (
                    <p>
                      <b>Local de votación:</b>{" "}
                      {searchResult.data.local_votacion}
                    </p>
                  )}
                  {searchResult.data.mesa && (
                    <p>
                      <b>Mesa:</b> {searchResult.data.mesa}
                    </p>
                  )}
                  {searchResult.data.orden && (
                    <p>
                      <b>Orden:</b> {searchResult.data.orden}
                    </p>
                  )}
                  {searchResult.data.direccion && (
                    <p>
                      <b>Dirección:</b> {searchResult.data.direccion}
                    </p>
                  )}
                  <p>
                    <b>Teléfono:</b>{" "}
                    {searchResult.data.telefono || "-"}
                  </p>
                </>
              )}

              {searchResult.tipo === "noExiste" && (
                <p>
                  Este CI <b>{searchResult.data.ci}</b> no pertenece al
                  padrón.
                </p>
              )}

              {(searchResult.tipo === "coordinador" ||
                searchResult.tipo === "subcoordinador" ||
                searchResult.tipo === "votante") && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      abrirTelefono(searchResult.tipo, searchResult.data)
                    }
                    className="px-3 py-1 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                  >
                    Teléfono
                  </button>
                  <button
                    onClick={() =>
                      quitarPersona(
                        searchResult.data.ci,
                        searchResult.tipo
                      )
                    }
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Borrar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MI ESTRUCTURA */}
      <div className="max-w-7xl mx-auto px-4 mb-10">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">Mi Estructura</h2>
          </div>

          <div className="p-6">
            {/* SUPERADMIN: VER TODA LA RED */}
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
                        {expandedCoords[normalizeCI(coord.ci)] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}
                        <DatosPersona
                          persona={coord}
                          rol="Coordinador"
                          loginCode={coord.login_code}
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("coordinador", coord);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
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

                    {expandedCoords[normalizeCI(coord.ci)] && (
                      <div className="bg-white px-4 pb-4">
                        {/* SUBCOORDINADORES DEL COORD */}
                        {estructura.subcoordinadores
                          .filter(
                            (s) =>
                              normalizeCI(s.coordinador_ci) ===
                              normalizeCI(coord.ci)
                          )
                          .map((sub) => (
                            <div
                              key={sub.ci}
                              className="border rounded p-3 mb-2 bg-red-50/40 flex flex-col gap-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <DatosPersona
                                  persona={sub}
                                  rol="Sub-coordinador"
                                  loginCode={sub.login_code}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      abrirTelefono("subcoordinador", sub)
                                    }
                                    className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                  >
                                    <Phone className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      quitarPersona(sub.ci, "subcoordinador")
                                    }
                                    className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>

                              {/* Votantes de ese sub */}
                              {getVotantesDeSubcoord(sub.ci).map((v) => (
                                <div
                                  key={v.ci}
                                  className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                                >
                                  <DatosPersona persona={v} rol="Votante" />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        abrirTelefono("votante", v)
                                      }
                                      className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                    >
                                      <Phone className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        quitarPersona(v.ci, "votante")
                                      }
                                      className="inline-flex items-center justify-center w-10 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}

                        {/* VOTANTES DIRECTOS DEL COORD */}
                        {estructura.votantes
                          .filter(
                            (v) =>
                              normalizeCI(v.asignado_por) ===
                              normalizeCI(coord.ci)
                          )
                          .map((v) => (
                            <div
                              key={v.ci}
                              className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                            >
                              <DatosPersona persona={v} rol="Votante" />
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    abrirTelefono("votante", v)
                                  }
                                  className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                                >
                                  <Phone className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    quitarPersona(v.ci, "votante")
                                  }
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

            {/* COORDINADOR: VE SUBS Y SUS VOTANTES + SUS VOTANTES DIRECTOS */}
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
                        {expandedCoords[normalizeCI(sub.ci)] ? (
                          <ChevronDown className="w-5 h-5 text-red-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-red-600" />
                        )}
                        <DatosPersona
                          persona={sub}
                          rol="Sub-coordinador"
                          loginCode={sub.login_code}
                        />
                      </div>
                      <div className="flex flex-col md:flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirTelefono("subcoordinador", sub);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5" />
                        </button>
                        <button
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

                    {expandedCoords[normalizeCI(sub.ci)] && (
                      <div className="bg-white px-4 pb-4">
                        <p className="text-sm font-semibold mt-2">Votantes</p>
                        {getVotantesDeSubcoord(sub.ci).map((v) => (
                          <div
                            key={v.ci}
                            className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                          >
                            <DatosPersona persona={v} rol="Votante" />
                            <div className="flex gap-2">
                              <button
                                onClick={() => abrirTelefono("votante", v)}
                                className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                              >
                                <Phone className="w-5 h-5" />
                              </button>
                              <button
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
                        className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                      >
                        <DatosPersona persona={v} rol="Votante" />
                        <div className="flex gap-2">
                          <button
                            onClick={() => abrirTelefono("votante", v)}
                            className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                          <button
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

                {getMisSubcoordinadores().length === 0 &&
                  getMisVotantes().length === 0 && (
                    <p className="text-gray-500 py-6">
                      Aún no tiene subcoordinadores ni votantes asignados.
                    </p>
                  )}
              </>
            )}

            {/* SUBCOORDINADOR: SOLO SUS VOTANTES */}
            {currentUser.role === "subcoordinador" && (
              <>
                {getMisVotantes().map((v) => (
                  <div
                    key={v.ci}
                    className="bg-white border p-3 mt-2 rounded flex justify-between items-start gap-3"
                  >
                    <DatosPersona persona={v} rol="Votante" />
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirTelefono("votante", v)}
                        className="inline-flex items-center justify-center w-10 h-10 border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button
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
