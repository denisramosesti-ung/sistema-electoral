// ======================= SERVICIO PDF =======================

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  normalizeCI,
  getMisSubcoordinadores,
  getVotantesDeSubcoord,
  getMisVotantes,
  getVotantesDirectosCoord,
  getEstructuraPropia,
} from "../utils/estructuraHelpers";

export const generarPDF = ({
  tipo = "estructura",
  estructura,
  padron,
  currentUser,
}) => {
  if (!currentUser) return;

  const doc = new jsPDF({ orientation: "portrait" });
  const colorRojo = [200, 0, 0];

  const resolvePadron = (ci) =>
    padron.find((p) => normalizeCI(p.ci) === normalizeCI(ci));

  const personaToRow = (p) => {
    const pad = resolvePadron(p.ci);
    return [
      p.ci,
      `${p.nombre || ""} ${p.apellido || ""}`.trim(),
      pad?.seccional || "-",
      pad?.local_votacion || "-",
      pad?.mesa || "-",
      pad?.orden || "-",
      pad?.direccion || "-",
      p.telefono || "-",
    ];
  };

  // ======================= HEADER =======================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...colorRojo);
  doc.text("INFORME DE CAPTACIÓN ELECTORAL", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `Generado por: ${currentUser.nombre} ${currentUser.apellido} (${currentUser.role})`,
    14,
    26
  );
  doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 32);

  let y = 40;

  // ======================= SUPERADMIN =======================
  if (currentUser.role === "superadmin") {
    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Cantidad"]],
      body: [
        ["Coordinadores", estructura.coordinadores.length],
        ["Subcoordinadores", estructura.subcoordinadores.length],
        ["Votantes", estructura.votantes.length],
      ],
      theme: "grid",
      headStyles: { fillColor: colorRojo },
    });

    doc.save(
      tipo === "ranking"
        ? "ranking_global.pdf"
        : "estructura_general.pdf"
    );
    return;
  }

  // ======================= COORD / SUB =======================
  const {
    isCoord,
    misSubcoords,
    misVotantes,
    votantesIndirectos,
    totalVotos,
  } = getEstructuraPropia(estructura, currentUser);

  autoTable(doc, {
    startY: y,
    head: [["Indicador", "Cantidad"]],
    body: [
      isCoord && ["Subcoordinadores", misSubcoords.length],
      isCoord && ["Votantes directos", misVotantes.length],
      isCoord && ["Votantes indirectos", votantesIndirectos],
      !isCoord && ["Votantes", misVotantes.length],
      ["Total", totalVotos],
    ].filter(Boolean),
    theme: "grid",
    headStyles: { fillColor: colorRojo },
  });

  doc.save("mi_estructura.pdf");
};
