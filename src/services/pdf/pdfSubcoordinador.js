import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

/* ======================= FIX CRÍTICO VFS ======================= */
if (!pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

export const generarPDFSubcoordinador = ({
  estructura,
  padron,
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
        text: `${currentUser.nombre} ${currentUser.apellido}`,
        style: "text",
      },

      { text: "Resumen", style: "subtitle" },
      {
        ul: [`Votantes asignados: ${misVotantes.length}`],
      },
    ],
    styles,
  };

  pdfMake
    .createPdf(docDefinition)
    .download(`reporte-subcoordinador-${currentUser.ci}.pdf`);
};
