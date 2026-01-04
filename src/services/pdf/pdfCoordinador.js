// src/services/pdf/pdfCoordinador.js

import pdfMake from "pdfmake/build/pdfmake.min";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generarPDFCoordinador = ({
  estructura,
  padron,
  currentUser,
}) => {
  const miCI = normalizeCI(currentUser.ci);

  // ================= DATOS BASE =================
  const misSubcoordinadores = estructura.subcoordinadores.filter(
    (s) => normalizeCI(s.coordinador_ci) === miCI
  );

  const votantesDirectos = estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === miCI
  );

  const votantesIndirectos = estructura.votantes.filter((v) =>
    misSubcoordinadores.some(
      (s) => normalizeCI(v.asignado_por) === normalizeCI(s.ci)
    )
  );

  const totalVotantes =
    votantesDirectos.length + votantesIndirectos.length;

  // ================= RENDIMIENTO SUBS =================
  const rendimientoSubs = misSubcoordinadores.map((sub) => {
    const votos = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === normalizeCI(sub.ci)
    );

    return {
      nombre: `${sub.nombre} ${sub.apellido}`,
      votantes: votos.length,
    };
  });

  // ================= ALERTAS =================
  const alertas = [];

  if (misSubcoordinadores.length === 0) {
    alertas.push("No registra subcoordinadores asignados.");
  }

  rendimientoSubs.forEach((s) => {
    if (s.votantes === 0) {
      alertas.push(
        `El subcoordinador ${s.nombre} no registra votantes.`
      );
    }
  });

  // ================= DOCUMENTO =================
  const docDefinition = {
    content: [
      { text: "REPORTE DE COORDINADOR", style: "title" },

      {
        text: `Coordinador: ${currentUser.nombre} ${currentUser.apellido}`,
        style: "text",
      },
      { text: `CI: ${currentUser.ci}`, style: "text" },
      { text: new Date().toLocaleString(), style: "text" },

      { text: "Resumen General", style: "subtitle" },
      {
        ul: [
          `Subcoordinadores: ${misSubcoordinadores.length}`,
          `Votantes directos: ${votantesDirectos.length}`,
          `Votantes indirectos: ${votantesIndirectos.length}`,
          `Total de votantes: ${totalVotantes}`,
        ],
      },

      { text: "Rendimiento de Subcoordinadores", style: "subtitle" },
      rendimientoSubs.length > 0
        ? {
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Subcoordinador", style: "tableHeader" },
                  { text: "Votantes", style: "tableHeader" },
                ],
                ...rendimientoSubs.map((s) => [
                  s.nombre,
                  s.votantes,
                ]),
              ],
            },
          }
        : { text: "Sin subcoordinadores.", style: "text" },

      { text: "Alertas de Gestión", style: "subtitle" },
      alertas.length > 0
        ? alertas.map((a) => ({ text: `⚠ ${a}`, style: "alert" }))
        : { text: "Sin alertas.", style: "text" },
    ],

    styles,

    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount}`,
      alignment: "center",
      fontSize: 8,
    }),
  };

  pdfMake.createPdf(docDefinition).download(
    `reporte-coordinador-${currentUser.ci}.pdf`
  );
};
