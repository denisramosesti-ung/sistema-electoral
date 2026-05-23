// ======================= HELPERS DE ESTRUCTURA =======================

// Normaliza CI (solo números)
export const normalizeCI = (ci) =>
  String(ci || "").replace(/\D/g, "");

// ======================= MAP BUILDERS (O(1) lookups) =======================

/**
 * Construye un Map: coordinador_ci -> subcoordinadores[]
 * Llámalo una sola vez con useMemo y pasá el resultado a las funciones.
 */
export const buildSubsByCoordMap = (subcoordinadores) => {
  const map = new Map();
  for (const s of subcoordinadores) {
    const key = normalizeCI(s.coordinador_ci);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(s);
  }
  return map;
};

/**
 * Construye un Map: asignado_por -> votantes[]
 * Cubre tanto votantes directos de coord como de sub.
 */
export const buildVotantesByAsignadoPorMap = (votantes) => {
  const map = new Map();
  for (const v of votantes) {
    const key = normalizeCI(v.asignado_por);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(v);
  }
  return map;
};

/**
 * Construye un Set con todos los CIs ya asignados (coords + subs + votantes).
 * Usado por getPersonasDisponibles para evitar .find() por cada persona del padrón.
 */
export const buildAsignadosSet = (estructura) => {
  const set = new Set();
  for (const c of estructura.coordinadores) set.add(normalizeCI(c.ci));
  for (const s of estructura.subcoordinadores) set.add(normalizeCI(s.ci));
  for (const v of estructura.votantes) set.add(normalizeCI(v.ci));
  return set;
};

/**
 * Construye un Map: ci -> { rol, asignado_por_nombre }
 * Para lookups O(1) en getPersonasDisponibles.
 */
export const buildRolMap = (estructura) => {
  const map = new Map();
  for (const c of estructura.coordinadores)
    map.set(normalizeCI(c.ci), { rol: "coordinador", asignadoPorNombre: "" });
  for (const s of estructura.subcoordinadores)
    map.set(normalizeCI(s.ci), { rol: "subcoordinador", asignadoPorNombre: s.asignado_por_nombre || "" });
  for (const v of estructura.votantes)
    map.set(normalizeCI(v.ci), { rol: "votante", asignadoPorNombre: v.asignado_por_nombre || "" });
  return map;
};

// ======================= SUBCOORDINADORES DEL COORD =======================
export const getMisSubcoordinadores = (estructura, currentUser, subsByCoordMap) => {
  if (!currentUser || currentUser.role !== "coordinador") return [];
  const miCI = normalizeCI(currentUser.ci);
  if (subsByCoordMap) return subsByCoordMap.get(miCI) ?? [];
  return estructura.subcoordinadores.filter(
    (s) => normalizeCI(s.coordinador_ci) === miCI
  );
};

// ======================= VOTANTES DE UN SUBCOORD =======================
export const getVotantesDeSubcoord = (estructura, subCi, votantesByAsignadoPorMap) => {
  const key = normalizeCI(subCi);
  if (votantesByAsignadoPorMap) return votantesByAsignadoPorMap.get(key) ?? [];
  return estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === key
  );
};

// ======================= MIS VOTANTES =======================
export const getMisVotantes = (estructura, currentUser, votantesByAsignadoPorMap) => {
  if (!currentUser) return [];
  const miCI = normalizeCI(currentUser.ci);
  if (votantesByAsignadoPorMap) return votantesByAsignadoPorMap.get(miCI) ?? [];
  return estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === miCI
  );
};

// ======================= VOTANTES DIRECTOS DEL COORD =======================
export const getVotantesDirectosCoord = (estructura, coordCi, votantesByAsignadoPorMap) => {
  const key = normalizeCI(coordCi);
  if (votantesByAsignadoPorMap) return votantesByAsignadoPorMap.get(key) ?? [];
  return estructura.votantes.filter(
    (v) => normalizeCI(v.asignado_por) === key
  );
};

// ======================= PERSONAS DISPONIBLES =======================
/**
 * Versión optimizada: recibe rolMap pre-construido para evitar
 * triple .find() por cada persona del padrón.
 */
export const getPersonasDisponibles = (padron, estructura, rolMap) => {
  const map = rolMap ?? buildRolMap(estructura);
  return padron.map((p) => {
    const ci = normalizeCI(p.ci);
    const entry = map.get(ci);
    return {
      ...p,
      ci,
      asignado: entry !== undefined,
      asignadoRol: entry?.rol ?? null,
      asignadoPorNombre: entry?.asignadoPorNombre ?? "",
    };
  });
};

// ======================= ESTRUCTURA PROPIA =======================
export const getEstructuraPropia = (estructura, currentUser, subsByCoordMap, votantesByAsignadoPorMap) => {
  if (!currentUser) {
    return {
      isCoord: false,
      misSubcoords: [],
      misVotantes: [],
      votantesIndirectos: 0,
      totalVotos: 0,
    };
  }

  const isCoord = currentUser.role === "coordinador";
  const isSub = currentUser.role === "subcoordinador";

  let misSubcoords = [];
  let misVotantes = [];

  if (isCoord) {
    misSubcoords = getMisSubcoordinadores(estructura, currentUser, subsByCoordMap);
    misVotantes = getMisVotantes(estructura, currentUser, votantesByAsignadoPorMap);
  } else if (isSub) {
    misVotantes = getMisVotantes(estructura, currentUser, votantesByAsignadoPorMap);
  }

  const votantesIndirectos = isCoord
    ? misSubcoords.reduce(
        (acc, s) => acc + getVotantesDeSubcoord(estructura, s.ci, votantesByAsignadoPorMap).length,
        0
      )
    : 0;

  const totalVotos = misVotantes.length + votantesIndirectos;

  return { isCoord, misSubcoords, misVotantes, votantesIndirectos, totalVotos };
};
