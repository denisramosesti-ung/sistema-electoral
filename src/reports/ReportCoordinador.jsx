const ReportCoordinador = ({ estructura, currentUser }) => {
  return `
    <h1>Reporte de Coordinador</h1>

    <p><b>Coordinador:</b> ${currentUser.nombre} ${currentUser.apellido}</p>
    <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>

    <h2>Subcoordinadores</h2>
    <ul>
      ${estructura.subcoordinadores
        .map(
          (s) => `<li>${s.ci} – ${s.nombre || ""} ${s.apellido || ""}</li>`
        )
        .join("")}
    </ul>

    <h2>Votantes</h2>
    <p>Total: ${estructura.votantes.length}</p>
  `;
};

export default ReportCoordinador;
