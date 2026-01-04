// src/services/pdf/pdfCoordinador.js
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

export const generarPDFCoordinador = async ({
  estructura,
  currentUser,
}) => {
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default;
  const pdfFonts = pdfFontsModule.default;
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  const miCI = normalizeCI(currentUser.ci);

  const subs = estructura.subcoordinadores.filter(
    (s) => normalizeCI(s.coordinador_ci) === miCI
  );

  const directos = estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === miCI
  );

  const indirectos = estructura.votantes.filter((v) =>
    subs.some((s) => normalizeCI(v.asignado_por) === normalizeCI(s.ci))
  );

  const docDefinition = {
    content: [
      { text: "REPORTE DE COORDINADOR", style: "title" },
      { text: `${currentUser.nombre} ${currentUser.apellido}`, style: "text" },
      { text: new Date().toLocaleString(), style: "text" },

      { text: "Resumen", style: "subtitle" },
      {
        ul: [
          `Subcoordinadores: ${subs.length}`,
          `Votantes directos: ${directos.length}`,
          `Votantes indirectos: ${indirectos.length}`,
          `Total votantes: ${directos.length + indirectos.length}`,
        ],
      },
    ],
    styles,
  };

  pdfMake.createPdf(docDefinition).download(
    `reporte-coordinador-${currentUser.ci}.pdf`
  );
};
