// src/services/pdfService.js
import { normalizeCI } from "../utils/estructuraHelpers";

export const generarPDF = ({ estructura, currentUser }) => {
  if (!currentUser || currentUser.role !== "superadmin") {
    alert("Este reporte es solo para superadmin.");
    return;
  }

  // ======================= DATOS BASE =======================
  const totalCoordinadores = estructura.coordinadores.length;
  const totalSubcoordinadores = estructura.subcoordinadores.length;
  const totalVotantes = estructura.votantes.length;

  const totalRed =
    totalCoordinadores + totalSubcoordinadores + totalVotantes;

  // ======================= RANKING COORDINADORES =======================
  const ranking = estructura.coordinadores.map((coord) => {
    const coordCI = normalizeCI(coord.ci);

    const subs = estructura.subcoordinadores.filter(
      (s) => normalizeCI(s.coordinador_ci) === coordCI
    );

    const votantesDirectos = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === coordCI
    );

    const votantesIndirectos = estructura.votantes.filter((v) =>
      subs.some((s) => normalizeCI(v.asignado_por) === normalizeCI(s.ci))
    );

    return {
      ...coord,
      subs: subs.length,
      directos: votantesDirectos.length,
      indirectos: votantesIndirectos.length,
      total: votantesDirectos.length + votantesIndirectos.length,
    };
  });

  ranking.sort((a, b) => b.total - a.total);

  // ======================= ALERTAS =======================
  const alertas = [];

  ranking.forEach((c) => {
    if (c.subs === 0) {
      alertas.push(
        `⚠ Coordinador ${c.nombre} ${c.apellido} sin subcoordinadores`
      );
    }
    if (c.total === 0) {
      alertas.push(
        `⚠ Coordinador ${c.nombre} ${c.apellido} sin votantes`
      );
    }
  });

  const votantesSinTelefono = estructura.votantes.filter(
    (v) => !v.telefono
  ).length;

  if (votantesSinTelefono > 0) {
    alertas.push(
      `⚠ ${votantesSinTelefono} votantes sin teléfono registrado`
    );
  }

  // ======================= HTML =======================
  let html = `
    <h1>Reporte General – Superadmin</h1>
    <p><b>Administrador:</b> ${currentUser.nombre} ${currentUser.apellido}</p>
    <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>
    <hr/>

    <h2>Resumen Ejecutivo</h2>
    <ul>
      <li>Coordinadores: ${totalCoordinadores}</li>
      <li>Subcoordinadores: ${totalSubcoordinadores}</li>
      <li>Votantes: ${totalVotantes}</li>
      <li><b>Votantes totales en red: ${totalRed}</b></li>
    </ul>

    <h2>Ranking de Coordinadores</h2>
    <table>
      <thead>
        <tr>
          <th>Coordinador</th>
          <th>Subcoordinadores</th>
          <th>Votantes Directos</th>
          <th>Votantes Indirectos</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${ranking
          .map(
            (c) => `
          <tr>
            <td>${c.nombre} ${c.apellido}</td>
            <td>${c.subs}</td>
            <td>${c.directos}</td>
            <td>${c.indirectos}</td>
            <td><b>${c.total}</b></td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <h2>Alertas de Gestión</h2>
    ${
      alertas.length > 0
        ? `<ul>${alertas.map((a) => `<li>${a}</li>`).join("")}</ul>`
        : "<p>Sin alertas detectadas.</p>"
    }
  `;

  // ======================= PRINT =======================
  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Reporte Superadmin</title>
        <style>
          body { font-family: Arial; padding: 40px; }
          h1 { color: #b91c1c; }
          h2 { margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; }
          th { background: #fee2e2; }
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
