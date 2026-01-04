// src/services/pdf/pdfCoordinador.js
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generarPDFCoordinador = async ({
  estructura,
  currentUser,
}) => {
  const miCI = normalizeCI(currentUser.ci);

  const subcoordinadores = estructura.subcoordinadores.filter(
    (s) => normalizeCI(s.coordinador_ci) === miCI
  );

  const votantesDirectos = estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === miCI
  );

  const votantesIndirectos = estructura.votantes.filter((v) =>
    subcoordinadores.some(
      (s) => normalizeCI(v.asignado_por) === normalizeCI(s.ci)
    )
  );

  const docDefinition = {
    content: [
      { text: "REPORTE DE COORDINADOR", style: "title" },

      {
        text: `Coordinador: ${currentUser.nombre} ${currentUser.apellido}`,
        style: "text",
      },
      { text: `CI: ${currentUser.ci}`, style: "text" },
      { text: new Date().toLocaleString(), style: "text" },

      { text: "Resumen", style: "subtitle" },
      {
        ul: [
          `Subcoordinadores: ${subcoordinadores.length}`,
          `Votantes directos: ${votantesDirectos.length}`,
          `Votantes indirectos: ${votantesIndirectos.length}`,
          `Total votantes: ${
            votantesDirectos.length + votantesIndirectos.length
          }`,
        ],
      },
    ],
    styles,
  };

  pdfMake
    .createPdf(docDefinition)
    .download(`reporte-coordinador-${currentUser.ci}.pdf`);
};
