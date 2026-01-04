const ReportSubcoordinador = ({ estructura, currentUser }) => {
  return `
    <h1>Reporte de Subcoordinador</h1>

    <p><b>Subcoordinador:</b> ${currentUser.nombre} ${currentUser.apellido}</p>
    <p><b>Fecha:</b> ${new Date().toLocaleString()}</p>

    <h2>Votantes</h2>
    <ul>
      ${estructura.votantes
        .map(
          (v) => `<li>${v.ci} – ${v.nombre || ""} ${v.apellido || ""}</li>`
        )
        .join("")}
    </ul>
  `;
};

export default ReportSubcoordinador;
