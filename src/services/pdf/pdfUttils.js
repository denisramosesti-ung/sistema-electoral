// services/pdf/pdfUtils.js
import { normalizeCI } from "../../utils/estructuraHelpers";

export const calcularResumenGlobal = (estructura) => {
  const coordinadores = estructura.coordinadores.length;
  const subcoordinadores = estructura.subcoordinadores.length;
  const votantes = estructura.votantes.length;

  return {
    coordinadores,
    subcoordinadores,
    votantes,
    votantesTotales: coordinadores + subcoordinadores + votantes,
  };
};

export const rankingCoordinadores = (estructura) => {
  return estructura.coordinadores
    .map((coord) => {
      const subs = estructura.subcoordinadores.filter(
        (s) => normalizeCI(s.coordinador_ci) === normalizeCI(coord.ci)
      );

      const votantesDirectos = estructura.votantes.filter(
        (v) => normalizeCI(v.asignado_por) === normalizeCI(coord.ci)
      );

      const votantesIndirectos = estructura.votantes.filter((v) =>
        subs.some((s) => normalizeCI(v.asignado_por) === normalizeCI(s.ci))
      );

      return {
        ...coord,
        subcoordinadores: subs.length,
        directos: votantesDirectos.length,
        indirectos: votantesIndirectos.length,
        total: votantesDirectos.length + votantesIndirectos.length,
      };
    })
    .sort((a, b) => b.total - a.total);
};

export const detectarAlertas = (estructura) => {
  const alertas = [];

  estructura.coordinadores.forEach((c) => {
    const tieneSubs = estructura.subcoordinadores.some(
      (s) => normalizeCI(s.coordinador_ci) === normalizeCI(c.ci)
    );
    const tieneVotos = estructura.votantes.some(
      (v) => normalizeCI(v.coordinador_ci) === normalizeCI(c.ci)
    );

    if (!tieneSubs && !tieneVotos) {
      alertas.push(
        `El coordinador ${c.nombre} ${c.apellido} no registra actividad.`
      );
    }
  });

  return alertas;
};
