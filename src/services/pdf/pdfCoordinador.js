// ======================= PDF COORDINADOR =======================
// Reporte de red de un coordinador (subcoordinadores + votantes)

export const generarPdfCoordinador = async ({ estructura, currentUser }) => {
  // IMPORT DINÁMICO (OBLIGATORIO EN VITE)
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  pdfMake.vfs = pdfFontsModule.pdfMake.vfs;

  const misSubs = estructura.subcoordinadores.filter(
    (s) => s.coordinador_ci === currentUser.ci
  );

  const votantesDirectos = estructura.votantes.filter(
    (v) => v.asignado_por === currentUser.ci
  );

  const votantesIndirectos = estructura.votantes.filter(
    (v) =>
      misSubs.some((s) => s.ci === v.asignado_por)
  );

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],

    content: [
      { text: "REPORTE DE COORDINADOR", style: "header" },

      {
        text: `${currentUser.nombre} ${currentUser.apellido} (CI: ${currentUser.ci})`,
        style: "subheader",
      },

      {
        ul: [
          `Subcoordinadores: ${misSubs.length}`,
          `Votantes directos: ${votantesDirectos.length}`,
          `Votantes indirectos: ${votantesIndirectos.length}`,
          `Votantes totales en red: ${
            votantesDirectos.length + votantesIndirectos.length
          }`,
        ],
      },

      { text: "\nSubcoordinadores", style: "section" },

      ...misSubs.map((s) => ({
        margin: [0, 5, 0, 5],
        stack: [
          {
            text: `${s.nombre} ${s.apellido} (CI: ${s.ci})`,
            bold: true,
          },
          {
            text: `Votantes asignados: ${
              estructura.votantes.filter((v) => v.asignado_por === s.ci).length
            }`,
          },
        ],
      })),

      { text: "\nVotantes directos", style: "section" },

      ...votantesDirectos.map((v) => ({
        text: `${v.nombre} ${v.apellido} – CI: ${v.ci}`,
        margin: [0, 2, 0, 2],
      })),
    ],

    styles: {
      header: {
        fontSize: 18,
        bold: true,
        color: "#b91c1c",
        margin: [0, 0, 0, 15],
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      section: {
        fontSize: 13,
        bold: true,
        margin: [0, 15, 0, 6],
      },
    },
  };

  pdfMake.createPdf(docDefinition).download("reporte-coordinador.pdf");
};
