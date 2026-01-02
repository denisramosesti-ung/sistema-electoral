// ======================= MI ESTRUCTURA =======================
// Render completo según rol
// Estado de expansión interno

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Phone,
  Trash2,
} from "lucide-react";

import {
  normalizeCI,
  getMisSubcoordinadores,
  getVotantesDeSubcoord,
  getMisVotantes,
  getVotantesDirectosCoord,
} from "../utils/estructuraHelpers";

const MiEstructura = ({
  estructura,
  currentUser,
  onEditarTelefono,
  onEliminar,
}) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (ci) => {
    const key = normalizeCI(ci);
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const DatosPersona = ({ persona, rol }) => (
    <div className="space-y-1 text-xs md:text-sm">
      <p className="font-semibold">
        {persona.nombre || "-"} {persona.apellido || ""}
      </p>
      <p><b>CI:</b> {persona.ci}</p>
      {rol && <p><b>Rol:</b> {rol}</p>}
      {persona.telefono && <p>Tel: {persona.telefono}</p>}
    </div>
  );

  /* ---- SUPERADMIN ---- */
  if (currentUser.role === "superadmin") {
    return estructura.coordinadores.map((coord) => (
      <div key={coord.ci} className="border rounded-lg mb-3">
        <div
          className="p-4 cursor-pointer flex gap-3"
          onClick={() => toggleExpand(coord.ci)}
        >
          {expanded[normalizeCI(coord.ci)] ? <ChevronDown /> : <ChevronRight />}
          <DatosPersona persona={coord} rol="Coordinador" />
        </div>

        {expanded[normalizeCI(coord.ci)] && (
          <div className="px-4 pb-4">
            {estructura.subcoordinadores
              .filter(
                (s) =>
                  normalizeCI(s.coordinador_ci) === normalizeCI(coord.ci)
              )
              .map((sub) => (
                <div key={sub.ci} className="border p-3 mt-2 rounded">
                  <DatosPersona persona={sub} rol="Subcoordinador" />

                  {getVotantesDeSubcoord(sub.ci, estructura).map((v) => (
                    <div key={v.ci} className="border p-2 mt-2 rounded">
                      <DatosPersona persona={v} rol="Votante" />
                    </div>
                  ))}
                </div>
              ))}

            {getVotantesDirectosCoord(coord.ci, estructura).map((v) => (
              <div key={v.ci} className="border p-2 mt-2 rounded">
                <DatosPersona persona={v} rol="Votante" />
              </div>
            ))}
          </div>
        )}
      </div>
    ));
  }

  /* ---- COORDINADOR ---- */
  if (currentUser.role === "coordinador") {
    const subs = getMisSubcoordinadores(estructura, currentUser);
    const directos = getMisVotantes(estructura, currentUser);

    return (
      <>
        {subs.map((sub) => (
          <div key={sub.ci} className="border rounded mb-3">
            <div
              className="p-4 cursor-pointer flex gap-3"
              onClick={() => toggleExpand(sub.ci)}
            >
              {expanded[normalizeCI(sub.ci)] ? <ChevronDown /> : <ChevronRight />}
              <DatosPersona persona={sub} rol="Subcoordinador" />
            </div>

            {expanded[normalizeCI(sub.ci)] && (
              <div className="px-4 pb-4">
                {getVotantesDeSubcoord(sub.ci, estructura).map((v) => (
                  <div key={v.ci} className="border p-2 mt-2 rounded">
                    <DatosPersona persona={v} rol="Votante" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {directos.length > 0 && (
          <div className="border rounded p-4">
            <p className="font-semibold mb-2">Mis votantes directos</p>
            {directos.map((v) => (
              <div key={v.ci} className="border p-2 mt-2 rounded">
                <DatosPersona persona={v} rol="Votante" />
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  /* ---- SUBCOORDINADOR ---- */
  const misVotantes = getMisVotantes(estructura, currentUser);
  return misVotantes.map((v) => (
    <div key={v.ci} className="border p-3 rounded mb-2">
      <DatosPersona persona={v} rol="Votante" />
    </div>
  ));
};

export default MiEstructura;
