// src/services/pdf/pdfSuperadmin.js

import pdfMake from "pdfmake/build/pdfmake.min";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generarPDFSuperadmin = ({
  estructura,
  padron,
  currentUser,
  tipo, // 👈 ESTE ES CLAVE
}) => {
  // ================= VALIDACIÓN =================
  if (!tipo) {
    alert("Error: tipo de reporte no definido");
    return;
  }

  // =========================================================
  // ================= RANKING GLOBAL ========================
  // =========================================================
  if (tipo === "ranking") {
    const ranking = estructura.coordinadores.map((coord) => {
      const ciCoord = normalizeCI(coord.ci);

      const subs = estructura.subcoordinadores.filter(
        (s) => normalizeCI(s.coordinador_ci) === ciCoord
      );

      const votantesDirectos = estructura.votantes.filter(
        (v) => normalizeCI(v.asignado_por) === ciCoord
      );

      const votantesIndirectos = estructura.votantes.filter((v) =>
        subs.some((s) => normalizeCI(v.asignado_por) === normalizeCI(s.ci))
      );

      return {
        nombre: `${coord.nombre} ${coord.apellido}`,
        subcoordinadores: subs.length,
        directos: votantesDirectos.length,
        indirectos: votantesIndirectos.length,
        total: votantesDirectos.length + votantesIndirectos.length,
      };
    });

    ranking.sort((a, b) => b.total - a.total);

    const docDefinition = {
      content: [
        { text: "RANKING GLOBAL DE COORDINADORES", style: "title" },
        { text: new Date().toLocaleString(), style: "text" },

        {
          table: {
            widths: ["*", "auto", "auto", "auto", "auto"],
            body: [
              [
                { text: "Coordinador", style: "tableHeader" },
                { text: "Subcoord.", style: "tableHeader" },
                { text: "Directos", style: "tableHeader" },
                { text: "Indirectos", style: "tableHeader" },
                { text: "Total", style: "tableHeader" },
              ],
              ...ranking.map((r) => [
                r.nombre,
                r.subcoordinadores,
                r.directos,
                r.indirectos,
                r.total,
              ]),
            ],
          },
        },
      ],
      styles,
      footer: (currentPage, pageCount) => ({
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: "center",
        fontSize: 8,
      }),
    };

    pdfMake.createPdf(docDefinition).download(
      "ranking-global-coordinadores.pdf"
    );
    return;
  }

  // =========================================================
  // ================= ESTRUCTURA COMPLETA ===================
  // =========================================================
  if (tipo === "estructura") {
    const content = [
      { text: "ESTRUCTURA COMPLETA DEL SISTEMA", style: "title" },
      { text: new Date().toLocaleString(), style: "text" },
    ];

    estructura.coordinadores.forEach((coord) => {
      content.push({
        text: `\nCOORDINADOR: ${coord.nombre} ${coord.apellido} (CI ${coord.ci})`,
        style: "subtitle",
      });

      const subs = estructura.subcoordinadores.filter(
        (s) => normalizeCI(s.coordinador_ci) === normalizeCI(coord.ci)
      );

      if (subs.length === 0) {
        content.push({ text: "Sin subcoordinadores.", style: "text" });
      }

      subs.forEach((sub) => {
        content.push({
          text: `Subcoordinador: ${sub.nombre} ${sub.apellido} (CI ${sub.ci})`,
          margin: [20, 5, 0, 0],
        });

        const votantes = estructura.votantes.filter(
          (v) => normalizeCI(v.asignado_por) === normalizeCI(sub.ci)
        );

        if (votantes.length === 0) {
          content.push({
            text: "Sin votantes.",
            margin: [40, 0, 0, 5],
            fontSize: 9,
          });
        }

        votantes.forEach((v) => {
          content.push({
            text: `• ${v.nombre} ${v.apellido} — CI ${v.ci}`,
            margin: [40, 0, 0, 0],
            fontSize: 9,
          });
        });
      });
    });

    const docDefinition = {
      content,
      styles,
      footer: (currentPage, pageCount) => ({
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: "center",
        fontSize: 8,
      }),
    };

    pdfMake.createPdf(docDefinition).download(
      "estructura-completa-sistema.pdf"
    );
    return;
  }

  // ================= FALLBACK =================
  alert("Tipo de reporte no reconocido: " + tipo);
};
