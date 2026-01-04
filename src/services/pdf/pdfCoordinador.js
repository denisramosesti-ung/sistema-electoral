import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";
import { normalizeCI } from "../../utils/estructuraHelpers";

/* ======================= FIX CRÍTICO VFS ======================= */
if (!pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

export const generarPDFCoordinador = ({
  estructura,
  padron,
  currentUser,
}) => {
  const miCI = normalizeCI(currentUser.ci);

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

  const docDefinition = {
    content: [
      { text: "REPORTE DE COORDINADOR", style: "title" },
      {
        text: `${currentUser.nombre} ${currentUser.apellido}`,
        style: "text",
      },

      { text: "Resumen", style: "subtitle" },
      {
        ul: [
          `Subcoordinadores: ${misSubcoordinadores.length}`,
          `Votantes directos: ${votantesDirectos.length}`,
          `Votantes indirectos: ${votantesIndirectos.length}`,
          `Total en red: ${
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
