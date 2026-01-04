// services/pdf/pdfCoordinador.js
import pdfMake from "pdfmake/build/pdfmake.min";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

import { normalizeCI } from "../../utils/estructuraHelpers";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generarPDFCoordinador = ({
  estructura,
  padron,
  currentUser,
}) => {
  const miCI = normalizeCI(currentUser.ci);

  // ======================= DATOS BASE =======================
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

  const totalVotantes = votantesDirectos.length + votantesIndirectos.length;

  // ======================= RENDIMIENTO POR SUB =======================
  const rendimientoSubs = misSubcoordinadores.map((sub) => {
    const votos = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === normalizeCI(sub.ci)
    );

    return {
      ...sub,
      votantes: votos.length,
    };
  });

  // ======================= ALERTAS =======================
  const alertas = [];

  if (misSubcoordinadores.length === 0) {
    alertas.push("No registra subcoordinadores asignados.");
  }

  rendimientoSubs.forEach((s) => {
    if (s.votantes === 0) {
      alertas.push(
        `El subcoordinador ${s.nombre} ${s.apellido} no registra votantes.`
      );
    }
  });

  // ======================= DOCUMENTO PDF =======================
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
          `Total de votantes en red: ${totalVotantes}`,
        ],
      },

      { text: "Rendimiento de Subcoordinadores", style: "subtitle" },
      misSubcoordinadores.length > 0
        ? {
            table: {
              widths: ["*", 80],
              body: [
                [
                  { text: "Subcoordinador", style: "tableHeader" },
                  { text: "Votantes", style: "tableHeader" },
                ],
                ...rendimientoSubs.map((s) => [
                  `${s.nombre} ${s.apellido}`,
                  s.votantes,
                ]),
              ],
            },
          }
        : { text: "No registra subcoordinadores.", style: "text" },

      { text: "Votantes Directos", style: "subtitle" },
      votantesDirectos.length > 0
        ? {
            ul: votantesDirectos.map(
              (v) => `${v.nombre} ${v.apellido} — CI ${v.ci}`
            ),
          }
        : { text: "No registra votantes directos.", style: "text" },

      { text: "Alertas de Gestión", style: "subtitle" },
      alertas.length > 0
        ? alertas.map((a) => ({ text: a, style: "alert" }))
        : { text: "Sin alertas detectadas.", style: "text" },
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
