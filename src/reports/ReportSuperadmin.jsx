const ReportSuperadmin = ({ estructura, currentUser }) => {
  return `
    <h1>Reporte General – Superadmin</h1>

    <p><b>Administrador:</b> ${currentUser.nombre} ${currentUser.apellido}</p>
    <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>

    <h2>Resumen General</h2>
    <ul>
      <li>Coordinadores: ${estructura.coordinadores.length}</li>
      <li>Subcoordinadores: ${estructura.subcoordinadores.length}</li>
      <li>Votantes: ${estructura.votantes.length}</li>
    </ul>

    <h2>Coordinadores</h2>
    <table>
      <thead>
        <tr>
          <th>CI</th>
          <th>Nombre</th>
        </tr>
      </thead>
      <tbody>
        ${estructura.coordinadores
          .map(
            (c) => `
          <tr>
            <td>${c.ci}</td>
            <td>${c.nombre || ""} ${c.apellido || ""}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
};

export default ReportSuperadmin;
