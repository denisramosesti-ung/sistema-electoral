// src/services/pdf/pdfSubcoordinador.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generarPDFSubcoordinador = async ({
  estructura,
  currentUser,
}) => {
  const miCI = normalizeCI(currentUser.ci);

  const misVotantes = estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === miCI
  );

  const docDefinition = {
    content: [
      { text: "REPORTE DE SUBCOORDINADOR", style: "title" },

      {
        text: `Subcoordinador: ${currentUser.nombre} ${currentUser.apellido}`,
        style: "text",
      },
      { text: `CI: ${currentUser.ci}`, style: "text" },
      { text: new Date().toLocaleString(), style: "text" },

      { text: "Resumen", style: "subtitle" },
      {
        ul: [
          `Votantes asignados: ${misVotantes.length}`,
        ],
      },

      { text: "Listado de votantes", style: "subtitle" },
      misVotantes.length > 0
        ? {
            ul: misVotantes.map(
              (v) => `${v.nombre} ${v.apellido} – CI ${v.ci}`
            ),
          }
        : { text: "No tiene votantes asignados.", style: "text" },
    ],
    styles,
  };

  pdfMake
    .createPdf(docDefinition)
    .download(`reporte-subcoordinador-${currentUser.ci}.pdf`);
};
