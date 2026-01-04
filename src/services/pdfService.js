// src/services/pdfService.js

export const generarPDF = ({ estructura, currentUser }) => {
  if (!currentUser) {
    alert("Usuario inválido");
    return;
  }

  let html = "";

  // ================= SUPERADMIN =================
  if (currentUser.role === "superadmin") {
    html = `
      <h1>Reporte General – Superadmin</h1>
      <p>${currentUser.nombre} ${currentUser.apellido}</p>
      <hr/>
      <ul>
        <li>Coordinadores: ${estructura.coordinadores.length}</li>
        <li>Subcoordinadores: ${estructura.subcoordinadores.length}</li>
        <li>Votantes: ${estructura.votantes.length}</li>
        <li><b>Votantes totales:</b> ${
          estructura.coordinadores.length +
          estructura.subcoordinadores.length +
          estructura.votantes.length
        }</li>
      </ul>
    `;
  }

  // ================= COORDINADOR =================
  if (currentUser.role === "coordinador") {
    html = `
      <h1>Reporte de Coordinador</h1>
      <p>${currentUser.nombre} ${currentUser.apellido}</p>
      <hr/>
      <ul>
        <li>Subcoordinadores: ${
          estructura.subcoordinadores.filter(
            s => s.coordinador_ci === currentUser.ci
          ).length
        }</li>
        <li>Votantes totales en red</li>
      </ul>
    `;
  }

  // ================= SUBCOORDINADOR =================
  if (currentUser.role === "subcoordinador") {
    html = `
      <h1>Reporte de Subcoordinador</h1>
      <p>${currentUser.nombre} ${currentUser.apellido}</p>
      <hr/>
      <p>Total de votantes asignados</p>
    `;
  }

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Reporte</title>
        <style>
          body { font-family: Arial; padding: 40px; }
          h1 { color: #b91c1c; }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = () => window.print();
        </script>
      </body>
    </html>
  `);
  win.document.close();
};
