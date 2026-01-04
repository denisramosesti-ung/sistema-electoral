// ======================= PDF SUPERADMIN =======================
// Import dinámico compatible con Vite + Vercel

export const generarPdfSuperadmin = async ({ estructura }) => {
  // ⬇️ IMPORT DINÁMICO (CLAVE)
  const pdfMakeModule = await import("pdfmake/build/pdfmake");
  const pdfFontsModule = await import("pdfmake/build/vfs_fonts");

  const pdfMake = pdfMakeModule.default || pdfMakeModule;
  pdfMake.vfs = pdfFontsModule.pdfMake.vfs;

  const docDefinition = {
    pageSize: "A4",
    pageMargins: [40, 60, 40, 60],

    content: [
      { text: "REPORTE GENERAL – SUPERADMIN", style: "header" },

      { text: "Resumen global", style: "subheader" },
      {
        ul: [
          `Coordinadores: ${estructura.coordinadores.length}`,
          `Subcoordinadores: ${estructura.subcoordinadores.length}`,
          `Votantes cargados: ${estructura.votantes.length}`,
          `Votantes totales (red): ${
            estructura.coordinadores.length +
            estructura.subcoordinadores.length +
            estructura.votantes.length
          }`,
        ],
      },

      { text: "\nDetalle por coordinador", style: "subheader" },

      ...estructura.coordinadores.map((c) => ({
        margin: [0, 5, 0, 5],
        stack: [
          {
            text: `${c.nombre} ${c.apellido} (CI: ${c.ci})`,
            bold: true,
          },
          {
            text: `Subcoordinadores: ${
              estructura.subcoordinadores.filter(
                (s) => s.coordinador_ci === c.ci
              ).length
            }`,
          },
          {
            text: `Votantes totales en red: ${
              estructura.votantes.filter(
                (v) => v.coordinador_ci === c.ci
              ).length
            }`,
          },
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
        margin: [0, 15, 0, 8],
      },
    },
  };

  pdfMake.createPdf(docDefinition).download("reporte-superadmin.pdf");
};
