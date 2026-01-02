// ======================= ESTADÍSTICAS =======================

import { normalizeCI } from "../utils/estructuraHelpers";

export const getEstadisticas = (estructura, currentUser) => {
  if (!currentUser) return {};

  // SUPERADMIN
if (currentUser.role === "superadmin") {
  const coordinadores = estructura.coordinadores.length;
  const subcoordinadores = estructura.subcoordinadores.length;
  const votantes = estructura.votantes.length;

  return {
    coordinadores,
    subcoordinadores,
    votantes,
    votantesTotales:
      coordinadores + subcoordinadores + votantes,
  };
}

  // COORDINADOR
  if (currentUser.role === "coordinador") {
    const subs = estructura.subcoordinadores.filter(
      (s) => normalizeCI(s.coordinador_ci) === normalizeCI(currentUser.ci)
    );

    const votantesDirectos = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === normalizeCI(currentUser.ci)
    );

    const votantesDeSubs = subs.reduce(
      (acc, sub) =>
        acc +
        estructura.votantes.filter(
          (v) => normalizeCI(v.asignado_por) === normalizeCI(sub.ci)
        ).length,
      0
    );

    return {
      subcoordinadores: subs.length,
      votantesDirectos: votantesDirectos.length,
      total: votantesDirectos.length + votantesDeSubs,
    };
  }

  // SUBCOORDINADOR
  if (currentUser.role === "subcoordinador") {
    return {
      votantes: estructura.votantes.filter(
        (v) => normalizeCI(v.asignado_por) === normalizeCI(currentUser.ci)
      ).length,
    };
  }

  return {};
};