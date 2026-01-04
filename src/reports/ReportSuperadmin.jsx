// src/reports/ReportSuperadmin.js

export const buildSuperadminReportHTML = ({ estructura, currentUser }) => {
  const totalVotantes =
    estructura.votantes.length +
    estructura.subcoordinadores.length +
    estructura.coordinadores.length;

  return `
    <h1>Reporte General — Superadmin</h1>

    <p><b>Administrador:</b> ${currentUser.nombre} ${currentUser.apellido}</p>
    <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>

    <div class="box">
      <h3>Resumen Global</h3>
      <ul>
        <li>Coordinadores: ${estructura.coordinadores.length}</li>
        <li>Subcoordinadores: ${estructura.subcoordinadores.length}</li>
        <li>Votantes directos: ${estructura.votantes.length}</li>
        <li><b>Votantes totales en red: ${totalVotantes}</b></li>
      </ul>
    </div>

    <h2>Listado de Coordinadores</h2>
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>CI</th>
          <th>Teléfono</th>
        </tr>
      </thead>
      <tbody>
        ${estructura.coordinadores
          .map(
            (c) => `
          <tr>
            <td>${c.nombre || ""} ${c.apellido || ""}</td>
            <td>${c.ci}</td>
            <td>${c.telefono || "-"}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
};
