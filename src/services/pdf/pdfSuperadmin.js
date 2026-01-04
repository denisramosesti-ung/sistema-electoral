// src/services/pdf/pdfSuperadmin.js
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

export const generarPDFSuperadmin = async ({
  estructura,
  currentUser,
}) => {
  // ⬇️ IMPORT DINÁMICO (CLAVE)
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default;
  const pdfFonts = pdfFontsModule.default;

  pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
