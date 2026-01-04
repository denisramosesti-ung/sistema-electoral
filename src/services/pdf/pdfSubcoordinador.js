// services/pdf/pdfSubcoordinador.js
import pdfMake from "pdfmake/build/pdfmake.min";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { styles } from "./pdfStyles";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

import { normalizeCI } from "../../utils/estructuraHelpers";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generarPDFSubcoordinador = ({
  estructura,
  padron,
  currentUser,
}) => {
  const miCI = normalizeCI(currentUser.ci);

  // ======================= DATOS BASE =======================
  const misVotantes = estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === miCI
  );

  const miSub = estructura.subcoordinadores.find(
    (s) => normalizeCI(s.ci) === miCI
  );

  const coordinador = estructura.coordinadores.find(
    (c) =>
      normalizeCI(c.ci) === normalizeCI(miSub?.coordinador_ci)
  );

  // ======================= CALIDAD DE DATOS =======================
  const sinTelefono = misVotantes.filter((v) => !v.telefono);
  const conDatosIncompletos = misVotantes.filter(
    (v) => !v.direccion || !v.mesa || !v.orden
  );

  // ======================= DOCUMENTO PDF =======================
  const docDefinition = {
    content: [
      { text: "REPORTE DE SUBCOORDINADOR", style: "title" },

      {
        text: `Subcoordinador: ${currentUser.nombre} ${currentUser.apellido}`,
        style: "text",
      },
      { text: `CI: ${currentUser.ci}`, style: "text" },

      coordinador && {
        text: `Coordinador a cargo: ${coordinador.nombre} ${coordinador.apellido}`,
        style: "text",
      },

      { text: new Date().toLocaleString(), style: "text" },

      { text: "Resumen Operativo", style: "subtitle" },
      {
        ul: [
          `Total de votantes asignados: ${misVotantes.length}`,
          `Votantes con teléfono: ${
            misVotantes.length - sinTelefono.length
          }`,
          `Votantes con datos completos: ${
            misVotantes.length - conDatosIncompletos.length
          }`,
        ],
      },

      { text: "Listado de Votantes", style: "subtitle" },

      misVotantes.length > 0
        ? {
            table: {
              widths: ["*", "auto", "auto"],
              body: [
                [
                  { text: "Nombre", style: "tableHeader" },
                  { text: "CI", style: "tableHeader" },
                  { text: "Teléfono", style: "tableHeader" },
                ],
                ...misVotantes.map((v) => [
                  `${v.nombre} ${v.apellido}`,
                  v.ci,
                  v.telefono || "—",
                ]),
              ],
            },
          }
        : { text: "No tiene votantes asignados.", style: "text" },

      { text: "Alertas", style: "subtitle" },

      sinTelefono.length > 0
        ? {
            text: `⚠ ${sinTelefono.length} votantes no tienen teléfono registrado.`,
            style: "alert",
          }
        : { text: "Todos los votantes tienen teléfono.", style: "text" },

      conDatosIncompletos.length > 0
        ? {
            text: `⚠ ${conDatosIncompletos.length} votantes tienen datos incompletos.`,
            style: "alert",
          }
        : { text: "Datos completos en todos los votantes.", style: "text" },
    ],

    styles,

    footer: (currentPage, pageCount) => ({
      text: `Página ${currentPage} de ${pageCount}`,
      alignment: "center",
      fontSize: 8,
    }),
  };

  pdfMake.createPdf(docDefinition).download(
    `reporte-subcoordinador-${currentUser.ci}.pdf`
  );
};
