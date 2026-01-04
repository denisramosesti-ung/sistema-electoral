// ======================= PDF SUBCOORDINADOR =======================
// Reporte de votantes asignados a un subcoordinador

export const generarPDFSubcoordinador = async ({ estructura, currentUser }) => {
  // IMPORT DINÁMICO (OBLIGATORIO EN VITE)
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  pdfMake.vfs = pdfFontsModule.pdfMake.vfs;

  const misVotantes = estructura.votantes.filter(
    (v) => v.asignado_por === currentUser.ci
  );

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],

    content: [
      { text: "REPORTE DE SUBCOORDINADOR", style: "header" },

      {
        text: `${currentUser.nombre} ${currentUser.apellido} (CI: ${currentUser.ci})`,
        style: "subheader",
      },

      {
        ul: [
          `Votantes asignados: ${misVotantes.length}`,
        ],
      },

      { text: "\nListado de votantes", style: "section" },

      ...misVotantes.map((v, idx) => ({
        margin: [0, 4, 0, 4],
        stack: [
          {
            text: `${idx + 1}. ${v.nombre} ${v.apellido}`,
            bold: true,
          },
          {
            text: `CI: ${v.ci}`,
          },
          v.telefono ? { text: `Tel: ${v.telefono}` } : {},
        ],
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

  pdfMake.createPdf(docDefinition).download("reporte-subcoordinador.pdf");
};
