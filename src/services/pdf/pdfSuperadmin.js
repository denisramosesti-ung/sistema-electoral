import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

/* ======================= FIX CRÍTICO VFS ======================= */
if (!pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

export const generarPDFSuperadmin = ({
  tipo,
  estructura,
  padron,
  currentUser,
}) => {
  const totalVotantes =
    estructura.votantes.length +
    estructura.subcoordinadores.length +
    estructura.coordinadores.length;

  const docDefinition = {
    content: [
      { text: "REPORTE GENERAL – SUPERADMIN", style: "title" },

      {
        text: `Administrador: ${currentUser.nombre} ${currentUser.apellido}`,
        style: "text",
      },
      { text: new Date().toLocaleString(), style: "text" },

      { text: "Resumen Global", style: "subtitle" },
      {
        ul: [
          `Coordinadores: ${estructura.coordinadores.length}`,
          `Subcoordinadores: ${estructura.subcoordinadores.length}`,
          `Votantes registrados: ${estructura.votantes.length}`,
          `Votantes totales en red: ${totalVotantes}`,
        ],
      },
    ],
    styles,
  };

  pdfMake.createPdf(docDefinition).download("reporte-superadmin.pdf");
};
