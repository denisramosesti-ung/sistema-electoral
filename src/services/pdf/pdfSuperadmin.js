// services/pdf/pdfSuperadmin.js
import pdfMake from "pdfmake/build/pdfmake.min";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake.vfs;
import { styles } from "./pdfStyles";
import {
  calcularResumenGlobal,
  rankingCoordinadores,
  detectarAlertas,
} from "./pdfUtils";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generarPDFSuperadmin = ({ estructura, currentUser }) => {
  const resumen = calcularResumenGlobal(estructura);
  const ranking = rankingCoordinadores(estructura);
  const alertas = detectarAlertas(estructura);

  const docDefinition = {
    content: [
      { text: "INFORME GENERAL DE CAPTACIÓN ELECTORAL", style: "title" },
      {
        text: `Generado por: ${currentUser.nombre} ${currentUser.apellido}`,
        style: "text",
      },
      { text: new Date().toLocaleString(), style: "text" },

      { text: "Resumen Ejecutivo", style: "subtitle" },
      {
        ul: [
          `Coordinadores: ${resumen.coordinadores}`,
          `Subcoordinadores: ${resumen.subcoordinadores}`,
          `Votantes: ${resumen.votantes}`,
          `Votantes Totales: ${resumen.votantesTotales}`,
        ],
      },

      { text: "Ranking Nacional de Coordinadores", style: "subtitle" },
      {
        table: {
          widths: ["*", 50, 50, 50, 50],
          body: [
            [
              { text: "Coordinador", style: "tableHeader" },
              { text: "Subs", style: "tableHeader" },
              { text: "Directos", style: "tableHeader" },
              { text: "Indirectos", style: "tableHeader" },
              { text: "Total", style: "tableHeader" },
            ],
            ...ranking.map((r) => [
              `${r.nombre} ${r.apellido}`,
              r.subcoordinadores,
              r.directos,
              r.indirectos,
              r.total,
            ]),
          ],
        },
      },

      { text: "Alertas del Sistema", style: "subtitle" },
      ...(alertas.length
        ? alertas.map((a) => ({ text: a, style: "alert" }))
        : [{ text: "Sin alertas detectadas.", style: "text" }]),
    ],
    styles,
    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount}`,
      alignment: "center",
      fontSize: 8,
    }),
  };

  pdfMake.createPdf(docDefinition).download("reporte-superadmin.pdf");
};
