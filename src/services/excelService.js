// ======================= EXPORTACIÓN EXCEL DE LA ESTRUCTURA =======================
// Genera un .xlsx con exactamente las personas visibles para el usuario
// actual (personasVisibles), el mismo alcance por rol que ya usa el PDF:
// owner/superadmin ven toda la estructura, coordinador solo la suya,
// subcoordinador solo sus votantes. No amplía permisos ni agrega datos
// fuera de personasVisibles.

import * as XLSX from "xlsx";
import { normalizeCI } from "../utils/estructuraHelpers";

const SHEET_NAME = "Estructura";

const COLUMNS = [
  { header: "Jerarquía", key: "jerarquia", width: 16 },
  { header: "Superior", key: "superior", width: 28 },
  { header: "CI", key: "ci", width: 14 },
  { header: "Nombre", key: "nombre", width: 20 },
  { header: "Apellido", key: "apellido", width: 20 },
  { header: "Teléfono", key: "telefono", width: 16 },
  { header: "Local de votación", key: "local", width: 28 },
  { header: "Mesa", key: "mesa", width: 10 },
  { header: "Orden", key: "orden", width: 10 },
  { header: "Confirmado", key: "confirmado", width: 12 },
];

// ======================= HELPERS =======================
const nombreCompleto = (p) => `${p?.nombre || ""} ${p?.apellido || ""}`.trim();

const sortByApellidoNombre = (arr) =>
  [...arr].sort((a, b) => {
    const apellido = String(a?.apellido || "").localeCompare(String(b?.apellido || ""), "es");
    if (apellido !== 0) return apellido;
    return String(a?.nombre || "").localeCompare(String(b?.nombre || ""), "es");
  });

const groupBy = (arr, keyFn) => {
  const map = new Map();
  arr.forEach((item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
};

const isConfirmado = (tipo, persona) => {
  if (tipo === "votante") return persona?.voto_confirmado === true;
  if (tipo === "subcoordinador") return persona?.confirmado === true;
  return true; // coordinador: siempre autoconfirmado (misma convención que el resto del dashboard)
};

const jerarquiaLabel = (tipo) =>
  tipo === "coordinador" ? "Coordinador" : tipo === "subcoordinador" ? "Subcoordinador" : "Votante";

const buildRow = (tipo, persona, superiorNombre) => ({
  jerarquia: jerarquiaLabel(tipo),
  superior: superiorNombre || "",
  ci: String(persona?.ci ?? ""),
  nombre: persona?.nombre || "",
  apellido: persona?.apellido || "",
  telefono: persona?.telefono ? String(persona.telefono) : "",
  local: persona?.local_votacion || "",
  mesa: persona?.mesa ?? "",
  orden: persona?.orden ?? "",
  confirmado: isConfirmado(tipo, persona) ? "Sí" : "No",
});

// ======================= ARMAR FILAS EN ORDEN JERÁRQUICO =======================
// Deriva toda la jerarquía (quién depende de quién) directamente de los
// campos coordinador_ci / asignado_por que cada persona ya trae desde
// Supabase, sin depender de una estructura aparte. Funciona igual para
// los tres roles porque personasVisibles ya viene filtrado por rol.
export const construirFilasEstructura = (personasVisibles, currentUser) => {
  const coordEntries = (personasVisibles || [])
    .filter((p) => p.tipo === "coordinador")
    .map((p) => p.persona);
  const subEntries = (personasVisibles || [])
    .filter((p) => p.tipo === "subcoordinador")
    .map((p) => p.persona);
  const votEntries = (personasVisibles || [])
    .filter((p) => p.tipo === "votante")
    .map((p) => p.persona);

  const votantesByAsignador = groupBy(votEntries, (v) => normalizeCI(v?.asignado_por));
  const currentUserNombre = nombreCompleto(currentUser);

  // Arma un grupo: coordinador (si existe como fila), sus subcoordinadores,
  // los votantes de cada subcoordinador, y los votantes directos del
  // coordinador. coordPersona es null cuando el usuario es el propio
  // coordinador (no aparece como fila, pero sigue siendo el "Superior").
  const buildGroup = (coordPersona, anchorCI, subsOfCoord) => {
    const rows = [];
    const superiorParaSubsYDirectos = coordPersona ? nombreCompleto(coordPersona) : currentUserNombre;

    if (coordPersona) {
      rows.push(buildRow("coordinador", coordPersona, ""));
    }

    const sortedSubs = sortByApellidoNombre(subsOfCoord);
    sortedSubs.forEach((sub) => {
      rows.push(buildRow("subcoordinador", sub, superiorParaSubsYDirectos));
    });

    sortedSubs.forEach((sub) => {
      const subVotantes = sortByApellidoNombre(votantesByAsignador.get(normalizeCI(sub.ci)) || []);
      subVotantes.forEach((v) => rows.push(buildRow("votante", v, nombreCompleto(sub))));
    });

    const directVotantes = sortByApellidoNombre(votantesByAsignador.get(normalizeCI(anchorCI)) || []);
    directVotantes.forEach((v) => rows.push(buildRow("votante", v, superiorParaSubsYDirectos)));

    return rows;
  };

  // Owner / superadmin: una persona por cada coordinador visible.
  if (coordEntries.length > 0) {
    const rows = [];
    sortByApellidoNombre(coordEntries).forEach((coord) => {
      const coordCI = normalizeCI(coord.ci);
      const subsOfCoord = subEntries.filter((s) => normalizeCI(s?.coordinador_ci) === coordCI);
      rows.push(...buildGroup(coord, coordCI, subsOfCoord));
    });
    return rows;
  }

  // Coordinador: un único grupo implícito anclado en el propio usuario.
  if (subEntries.length > 0) {
    return buildGroup(null, currentUser?.ci, subEntries);
  }

  // Subcoordinador: lista plana de sus votantes.
  return sortByApellidoNombre(votEntries).map((v) => buildRow("votante", v, currentUserNombre));
};

// ======================= GENERAR Y DESCARGAR EL .XLSX =======================
export const exportarEstructuraExcel = (personasVisibles, currentUser) => {
  const rows = construirFilasEstructura(personasVisibles, currentUser);

  const aoa = [COLUMNS.map((c) => c.header), ...rows.map((r) => COLUMNS.map((c) => r[c.key]))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // CI y Teléfono como texto explícito, para que Excel no les cambie el
  // formato (ceros a la izquierda, el "+" del prefijo, notación científica).
  const ciCol = COLUMNS.findIndex((c) => c.key === "ci");
  const telCol = COLUMNS.findIndex((c) => c.key === "telefono");
  [ciCol, telCol].forEach((colIdx) => {
    for (let r = 1; r <= rows.length; r++) {
      const cellRef = XLSX.utils.encode_cell({ r, c: colIdx });
      const cell = ws[cellRef];
      if (cell) {
        cell.t = "s";
        cell.z = "@";
      }
    }
  });

  ws["!cols"] = COLUMNS.map((c) => ({ wch: c.width }));

  const lastRow = rows.length; // fila 0 = encabezado
  const lastCol = COLUMNS.length - 1;
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } }),
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `estructura_electoral_${fecha}.xlsx`, { bookType: "xlsx" });
};
