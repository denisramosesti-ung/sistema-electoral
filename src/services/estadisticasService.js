import { normalizeCI } from "../utils/estructuraHelpers";

export const getEstadisticas = (estructura, currentUser) => {
  if (!currentUser) return {};

  // ======================= SUPERADMIN =======================
  if (currentUser.role === "superadmin" || currentUser.role === "owner") {
    const coordinadores = estructura.coordinadores.length;
    const subcoordinadores = estructura.subcoordinadores.length;
    const votantes = estructura.votantes.length;

    const subsConfirmados = estructura.subcoordinadores.filter(
      (s) => s.confirmado === true
    ).length;

    const votosConfirmados = estructura.votantes.filter(
      (v) => v.voto_confirmado === true
    ).length;

    const totalConfirmable = coordinadores + subcoordinadores + votantes;
    const totalConfirmados = coordinadores + subsConfirmados + votosConfirmados;
    const porcentajeConfirmados =
      totalConfirmable > 0 ? Math.round((totalConfirmados / totalConfirmable) * 100) : 0;

    return {
      coordinadores,
      subcoordinadores,
      subsConfirmados,
      votantes,
      totalRed: coordinadores + subcoordinadores + votantes,
      totalVotantes: votantes,
      totalConfirmable,
      totalConfirmados,
      votosConfirmados,
      votosPendientes: totalConfirmable - totalConfirmados,
      porcentajeConfirmados,
    };
  }

  // ======================= COORDINADOR =======================
  if (currentUser.role === "coordinador") {
    const miCI = normalizeCI(currentUser.ci);

    // Build Map: asignado_por -> votantes[] — single pass O(n)
    const votantesPorAsignador = new Map();
    for (const v of estructura.votantes) {
      const key = normalizeCI(v.asignado_por);
      if (!votantesPorAsignador.has(key)) votantesPorAsignador.set(key, []);
      votantesPorAsignador.get(key).push(v);
    }

    const subs = estructura.subcoordinadores.filter(
      (s) => normalizeCI(s.coordinador_ci) === miCI
    );

    const votantesDirectos = votantesPorAsignador.get(miCI) ?? [];

    // Indirect voters: one map lookup per sub — O(subs)
    let votantesIndirectos = 0;
    let votosIndirectosConfirmados = 0;
    const subsConfirmados = subs.filter((s) => s.confirmado === true).length;

    for (const sub of subs) {
      const subVots = votantesPorAsignador.get(normalizeCI(sub.ci)) ?? [];
      votantesIndirectos += subVots.length;
      votosIndirectosConfirmados += subVots.filter((v) => v.voto_confirmado === true).length;
    }

    const totalVotantes = votantesDirectos.length + votantesIndirectos;
    const votosDirectosConfirmados = votantesDirectos.filter(
      (v) => v.voto_confirmado === true
    ).length;
    const votosConfirmados = votosDirectosConfirmados + votosIndirectosConfirmados;

    const totalConfirmable = 1 + subs.length + totalVotantes;
    const totalConfirmados = 1 + subsConfirmados + votosConfirmados;
    const porcentajeConfirmados =
      totalConfirmable > 0 ? Math.round((totalConfirmados / totalConfirmable) * 100) : 0;

    return {
      subcoordinadores: subs.length,
      subsConfirmados,
      votantesDirectos: votantesDirectos.length,
      votantesIndirectos,
      totalRed: 1 + subs.length + totalVotantes,
      totalVotantes,
      totalConfirmable,
      totalConfirmados,
      votosConfirmados,
      votosPendientes: totalConfirmable - totalConfirmados,
      porcentajeConfirmados,
    };
  }

  // ======================= SUBCOORDINADOR =======================
  if (currentUser.role === "subcoordinador") {
    const miCI = normalizeCI(currentUser.ci);

    const misVotantes = estructura.votantes.filter(
      (v) => normalizeCI(v.asignado_por) === miCI
    );

    const votosConfirmados = misVotantes.filter(
      (v) => v.voto_confirmado === true
    ).length;

    const totalConfirmable = 1 + misVotantes.length;
    const totalConfirmados = 1 + votosConfirmados;
    const porcentajeTotal =
      totalConfirmable > 0 ? Math.round((totalConfirmados / totalConfirmable) * 100) : 0;

    return {
      votantes: misVotantes.length,
      totalRed: 1 + misVotantes.length,
      totalVotantes: misVotantes.length,
      totalConfirmable,
      totalConfirmados,
      votosConfirmados,
      votosPendientes: totalConfirmable - totalConfirmados,
      porcentajeConfirmados: porcentajeTotal,
    };
  }

  return {};
};
