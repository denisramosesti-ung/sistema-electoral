// src/services/pdfService.js

import { generarPDFSuperadmin } from "./pdf/pdfSuperadmin";
import { generarPDFCoordinador } from "./pdf/pdfCoordinador";
import { generarPDFSubcoordinador } from "./pdf/pdfSubcoordinador";

/**
 * Punto único de generación de PDFs
 * Decide automáticamente qué reporte generar según rol
 */
export const generarPDF = ({
  tipo,          // usado solo por superadmin (ranking / estructura)
  estructura,
  padron,
  currentUser,
}) => {
  if (!currentUser || !currentUser.role) {
    alert("Sesión inválida para generar PDF");
    return;
  }

  switch (currentUser.role) {
    case "superadmin":
      generarPDFSuperadmin({
        tipo,
        estructura,
        padron,
        currentUser,
      });
      break;

    case "coordinador":
      generarPDFCoordinador({
        estructura,
        padron,
        currentUser,
      });
      break;

    case "subcoordinador":
      generarPDFSubcoordinador({
        estructura,
        padron,
        currentUser,
      });
      break;

    default:
      alert("Rol no soportado para generación de PDF");
  }
};
