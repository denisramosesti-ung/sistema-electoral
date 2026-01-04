// src/services/pdf/pdfSubcoordinador.js
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

export const generarPDFSubcoordinador = async ({
  estructura,
  currentUser,
}) => {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default;
  const pdfFonts = pdfFontsModule.default;
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  const miCI = normalizeCI(currentUser.ci);

  const misVotantes = estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === miCI
  );

  const docDefinition = {
    content: [
      { text: "REPORTE DE SUBCOORDINADOR", style: "title" },
      { text: `${currentUser.nombre} ${currentUser.apellido}`, style: "text" },
      { text: new Date().toLocaleString(), style: "text" },

      { text: "Votantes asignados", style: "subtitle" },
      {
        ul: misVotantes.map(
          (v) => `${v.nombre} ${v.apellido} — CI ${v.ci}`
        ),
      },
    ],
    styles,
  };

  pdfMake.createPdf(docDefinition).download(
    `reporte-subcoordinador-${currentUser.ci}.pdf`
  );
};
